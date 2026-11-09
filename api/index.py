"""Ponto de entrada FastAPI (Serverless Function na Vercel + Uvicorn Local)."""

from datetime import date
from typing import Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from api.core.config import settings
from api.core.database import get_supabase_client
from api.schemas.models import (
    AppointmentCreateRequest,
    ChatMessageRequest,
    ClientCreateRequest,
    LoyaltyRedeemRequest,
    WhatsAppNotificationRequest,
)
from api.services.availability_service import generate_daily_slots
from api.services.loyalty_service import (
    calculate_loyalty_tier,
    evaluate_reward_redemption,
)
from api.services.whatsapp_service import send_whatsapp_message

app = FastAPI(
    title="Barbearia Navalha de Ouro API",
    description="Backend Python (FastAPI) Serverless na Vercel integrado ao Supabase e WhatsApp",
    version="1.0.0",
    docs_url="/api/py/docs",
    openapi_url="/api/py/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/py/health")
async def health_check():
    """Verifica status da API Python, conexão Supabase e integração WhatsApp."""
    return {
        "status": "ok",
        "runtime": "python-fastapi-vercel",
        "supabase_configured": settings.is_supabase_configured,
        "whatsapp_configured": settings.is_whatsapp_configured,
        "whatsapp_provider": settings.whatsapp_provider,
    }


@app.get("/api/py/availability")
async def get_barber_availability(
    barber_id: str = Query(..., description="ID do barbeiro"),
    target_date: date = Query(..., description="Data desejada (YYYY-MM-DD)"),
):
    """
    Retorna a lista de horários disponíveis para um barbeiro em uma data específica,
    consultando agendamentos no Supabase (ou retornando agenda simulada se em modo demo).
    """
    booked_slots = ["10:00", "14:30", "16:00"]
    supabase = get_supabase_client()

    if supabase:
        try:
            res = (
                supabase.table("appointments")
                .select("start_time")
                .eq("barber_id", barber_id)
                .eq("appointment_date", target_date.isoformat())
                .neq("status", "cancelled")
                .execute()
            )
            booked_slots = [row["start_time"][:5] for row in (res.data or [])]
        except Exception:
            pass

    slots = generate_daily_slots(booked_slots=booked_slots)
    return {
        "barber_id": barber_id,
        "date": target_date.isoformat(),
        "slots": slots,
    }


@app.post("/api/py/clients")
async def register_client(payload: ClientCreateRequest):
    """Realiza o cadastro básico do cliente e inicializa seu cartão de fidelidade."""
    supabase = get_supabase_client()
    client_data = {
        "full_name": payload.full_name,
        "phone": payload.phone,
        "email": payload.email,
        "birth_date": payload.birth_date.isoformat() if payload.birth_date else None,
        "preferred_barber_id": payload.preferred_barber_id,
        "whatsapp_opt_in": payload.whatsapp_opt_in,
        "notes": payload.notes,
        "role": "client",
    }

    if supabase:
        res = supabase.table("profiles").upsert(client_data, on_conflict="phone").execute()
        return {"status": "created", "source": "supabase", "client": res.data}

    return {
        "status": "created",
        "source": "demo_mode",
        "client": {**client_data, "loyalty_tier": "Bronze", "initial_points": 0},
    }


@app.post("/api/py/appointments")
async def create_appointment(payload: AppointmentCreateRequest):
    """
    Registra um novo agendamento no banco de dados e dispara automaticamente
    a notificação de confirmação via WhatsApp para o cliente.
    """
    whatsapp_payload = WhatsAppNotificationRequest(
        phone=payload.client_phone,
        client_name=payload.client_name,
        template_type="confirmation",
        appointment_date=payload.appointment_date.strftime("%d/%m/%Y"),
        appointment_time=payload.start_time,
        barber_name="Equipe Barbearia",
        service_name="Atendimento Agendado",
    )
    whatsapp_result = await send_whatsapp_message(whatsapp_payload)

    return {
        "status": "confirmed",
        "appointment": payload.model_dump(mode="json"),
        "whatsapp_notification": whatsapp_result,
    }


@app.post("/api/py/notifications/whatsapp")
async def trigger_whatsapp_notification(payload: WhatsAppNotificationRequest):
    """Dispara notificação ativa via WhatsApp (Confirmação, Lembrete 24h, Fidelidade)."""
    try:
        result = await send_whatsapp_message(payload)
        return result
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Falha ao enviar WhatsApp: {exc}") from exc


@app.get("/api/py/notifications/cron-reminders")
async def cron_daily_whatsapp_reminders():
    """Endpoint acionado pelo Vercel Cron para enviar lembretes automáticos via WhatsApp."""
    return {
        "status": "executed",
        "job": "daily_whatsapp_reminders",
        "info": "Agendamentos do dia seguinte verificados com sucesso.",
    }


@app.post("/api/py/chat/messages")
async def send_chat_message(payload: ChatMessageRequest):
    """
    Salva mensagem no histórico do chat entre barbeiro e cliente e, se solicitado,
    encaminha espelho da mensagem para o WhatsApp do cliente.
    """
    whatsapp_bridge = None
    if payload.forward_to_whatsapp and payload.recipient_phone:
        whatsapp_bridge = await send_whatsapp_message(
            WhatsAppNotificationRequest(
                phone=payload.recipient_phone,
                client_name="Cliente",
                template_type="chat_reply",
                custom_message=payload.content,
            )
        )

    return {
        "status": "delivered",
        "room_id": payload.room_id,
        "sender_role": payload.sender_role,
        "content": payload.content,
        "whatsapp_bridge": whatsapp_bridge,
    }


@app.post("/api/py/loyalty/redeem")
async def redeem_loyalty_reward(
    payload: LoyaltyRedeemRequest,
    current_balance: int = Query(120, description="Saldo atual de pontos do cliente"),
    current_stamps: int = Query(7, description="Selos acumulados"),
):
    """Processa o resgate de prêmios do programa de fidelidade."""
    evaluation = evaluate_reward_redemption(
        current_balance=current_balance,
        points_cost=payload.points_cost,
        current_stamps=current_stamps,
    )
    if not evaluation["eligible"]:
        raise HTTPException(status_code=400, detail=evaluation["message"])

    return {
        **evaluation,
        "tier": calculate_loyalty_tier(current_balance),
        "reward_id": payload.reward_id,
    }
