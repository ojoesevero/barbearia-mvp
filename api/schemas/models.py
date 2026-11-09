"""Modelos Pydantic para validação de entrada e saída da API."""

from datetime import date
from typing import List, Literal, Optional
from pydantic import BaseModel, EmailStr, Field


class ClientCreateRequest(BaseModel):
    full_name: str = Field(..., min_length=3, max_length=120)
    phone: str = Field(..., min_length=10, max_length=20, description="Telefone com DDD ex: +5511999999999")
    email: Optional[EmailStr] = None
    birth_date: Optional[date] = None
    preferred_barber_id: Optional[str] = None
    whatsapp_opt_in: bool = True
    notes: Optional[str] = None


class ServiceItem(BaseModel):
    id: str
    name: str
    category: str
    description: str
    price: float
    duration_minutes: int
    loyalty_points: int


class AvailabilityQuery(BaseModel):
    barber_id: str
    target_date: date
    service_duration_minutes: int = 30


class TimeSlot(BaseModel):
    time: str
    available: bool
    barber_id: str
    barber_name: str


class AppointmentCreateRequest(BaseModel):
    client_name: str = Field(..., min_length=2)
    client_phone: str = Field(..., min_length=10)
    barber_id: str
    service_id: str
    appointment_date: date
    start_time: str = Field(..., pattern=r"^\d{2}:\d{2}$")
    notes: Optional[str] = None


class WhatsAppNotificationRequest(BaseModel):
    phone: str
    client_name: str
    template_type: Literal[
        "confirmation", "reminder_24h", "cancellation", "loyalty_reward", "chat_reply"
    ]
    appointment_date: Optional[str] = None
    appointment_time: Optional[str] = None
    barber_name: Optional[str] = None
    service_name: Optional[str] = None
    custom_message: Optional[str] = None


class ChatMessageRequest(BaseModel):
    room_id: str
    sender_profile_id: str
    sender_role: Literal["client", "barber"]
    content: str = Field(..., min_length=1, max_length=1000)
    forward_to_whatsapp: bool = False
    recipient_phone: Optional[str] = None


class LoyaltyRedeemRequest(BaseModel):
    client_id: str
    reward_id: str
    points_cost: int = Field(..., gt=0)
