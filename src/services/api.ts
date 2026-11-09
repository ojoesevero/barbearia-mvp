import { TimeSlot } from "@/types/barbershop";

const DEFAULT_TIMES = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
];

export async function fetchBarberAvailability(
  barberId: string,
  targetDate: string
): Promise<TimeSlot[]> {
  try {
    const res = await fetch(
      `/api/py/availability?barber_id=${encodeURIComponent(barberId)}&target_date=${encodeURIComponent(targetDate)}`
    );
    if (res.ok) {
      const data = await res.json();
      return data.slots as TimeSlot[];
    }
  } catch {
    // Fallback local se o servidor Python local não estiver rodando em paralelo no dev
  }

  // Gera disponibilidade determinística por barbeiro + data para experiência fluida
  const hash = (barberId.charCodeAt(0) + targetDate.charCodeAt(targetDate.length - 1)) % 4;
  return DEFAULT_TIMES.map((time, idx) => ({
    time,
    available: (idx + hash) % 5 !== 0,
  }));
}

export async function sendWhatsAppNotification(payload: {
  phone: string;
  client_name: string;
  template_type:
    | "confirmation"
    | "reminder_24h"
    | "cancellation"
    | "loyalty_reward"
    | "chat_reply";
  appointment_date?: string;
  appointment_time?: string;
  barber_name?: string;
  service_name?: string;
  custom_message?: string;
}) {
  try {
    const res = await fetch("/api/py/notifications/whatsapp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Fallback local
  }

  return {
    status: "simulated",
    provider: "evolution",
    recipient: payload.phone,
    message_preview:
      payload.custom_message ||
      `✂️ *Barbearia Navalha de Ouro*\nOlá, *${payload.client_name}*! Seu horário para *${payload.service_name || "Atendimento"}* com *${payload.barber_name || "Barbeiro"}* em *${payload.appointment_date || "Hoje"} às ${payload.appointment_time || "14:00"}* foi confirmado com sucesso!`,
  };
}
