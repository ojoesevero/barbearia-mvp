"""Serviço de integração com WhatsApp via Evolution API / Z-API (incluindo Auto-Atendimento para Barbeiro Solitário)."""

import os
import re
from typing import Any, Dict
import httpx
from api.core.config import settings
from api.schemas.models import WhatsAppNotificationRequest


def normalize_phone(phone: str) -> str:
    """Normaliza telefone para apenas dígitos (padrão WhatsApp DDI+DDD+Número)."""
    digits = re.sub(r"\D", "", phone)
    if len(digits) in (10, 11) and not digits.startswith("55"):
        digits = f"55{digits}"
    return digits


def build_whatsapp_message(payload: WhatsAppNotificationRequest) -> str:
    """Constrói a mensagem formatada para WhatsApp conforme o tipo de template."""
    if payload.custom_message:
        return payload.custom_message

    app_url = payload.booking_url or os.getenv("NEXT_PUBLIC_APP_URL", "http://localhost:3000")

    templates = {
        "welcome_auto_reply": (
            f"💈 *Olá, {payload.client_name}! Bem-vindo à Barbearia Navalha de Ouro!* ✂️\n\n"
            f"No momento estou em atendimento na cadeira, mas para você *não precisar esperar*, "
            f"escolha seu serviço e veja todos os meus horários livres em tempo real neste link:\n\n"
            f"👉 *{app_url}*\n\n"
            f"🕘 *Funcionamento:* Segunda a Sábado, das 09:00 às 20:00.\n"
            f"Assim que escolher o horário no link, eu recebo aqui na bancada e te mando a confirmação na hora!"
        ),
        "confirmation": (
            f"✂️ *Barbearia Navalha de Ouro — Confirmação*\n\n"
            f"Olá, *{payload.client_name}*! Seu horário está confirmado:\n"
            f"📅 *Data:* {payload.appointment_date or 'Hoje'}\n"
            f"⏰ *Horário:* {payload.appointment_time or '14:00'}\n"
            f"💈 *Profissional:* {payload.barber_name or 'Barbeiro'}\n"
            f"🧾 *Serviço:* {payload.service_name or 'Corte & Barba'}\n\n"
            f"📍 Te espero na cadeira! Caso precise reagendar, avise com até 2h de antecedência."
        ),
        "reminder_24h": (
            f"⏰ *Lembrete de Agendamento — Barbearia Navalha de Ouro*\n\n"
            f"Fala, *{payload.client_name}*! Passando para lembrar do seu horário:\n"
            f"📅 *Data:* {payload.appointment_date}\n"
            f"⏰ *Horário:* {payload.appointment_time}\n"
            f"💈 *Barbeiro:* {payload.barber_name}\n\n"
            f"Responda *1* para Confirmar ou acesse {app_url} se precisar reagendar."
        ),
        "cancellation": (
            f"❌ *Agendamento Cancelado*\n\n"
            f"Olá, *{payload.client_name}*. Seu agendamento para {payload.appointment_date} "
            f"às {payload.appointment_time} foi cancelado. Acesse {app_url} quando quiser escolher outro horário!"
        ),
        "loyalty_reward": (
            f"🏆 *Parabéns, {payload.client_name}!*\n\n"
            f"Você atingiu a pontuação necessária no nosso *Plano de Fidelidade* e "
            f"desbloqueou uma recompensa especial! Apresente esta mensagem no seu próximo corte."
        ),
        "chat_reply": (
            f"💬 *Mensagem do seu Barbeiro ({payload.barber_name or 'Barbearia'}):*\n\n"
            f"{payload.custom_message or 'Olá! Como posso ajudar no seu próximo corte?'}"
        ),
    }
    return templates.get(payload.template_type, templates["confirmation"])


async def send_whatsapp_message(payload: WhatsAppNotificationRequest) -> Dict[str, Any]:
    """
    Envia mensagem via Evolution API ou Z-API.
    Caso as credenciais ainda não estejam configuradas no ambiente, opera em modo simulado (sandbox)
    retornando o preview completo da mensagem para facilitar testes e demonstrações comerciais.
    """
    clean_phone = normalize_phone(payload.phone)
    message_text = build_whatsapp_message(payload)

    if not settings.is_whatsapp_configured:
        return {
            "status": "simulated",
            "provider": settings.whatsapp_provider,
            "recipient": clean_phone,
            "message_preview": message_text,
            "info": "Configure WHATSAPP_API_URL e WHATSAPP_API_KEY para disparo real via Evolution API / Z-API.",
        }

    headers = {
        "Content-Type": "application/json",
        "apikey": settings.whatsapp_api_key,
    }

    if settings.whatsapp_provider == "zapi":
        endpoint = f"{settings.whatsapp_api_url.rstrip('/')}/send-text"
        body = {"phone": clean_phone, "message": message_text}
    else:
        endpoint = (
            f"{settings.whatsapp_api_url.rstrip('/')}"
            f"/message/sendText/{settings.whatsapp_instance}"
        )
        body = {
            "number": clean_phone,
            "text": message_text,
            "delay": 1000,
        }

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post(endpoint, json=body, headers=headers)
        response.raise_for_status()
        return {
            "status": "sent",
            "provider": settings.whatsapp_provider,
            "recipient": clean_phone,
            "message_preview": message_text,
            "provider_response": response.json(),
        }
