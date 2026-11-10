import { TimeSlot } from "@/types/barbershop";
import { supabase } from "@/lib/supabase";

// Expediente padrão das barbearias: Segunda a Sábado, das 09:00 às 20:00 (Almoço 12:00-13:00)
export const WORKING_HOURS_SLOTS = [
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
  "19:00",
  "19:30",
];

export function isSundayDate(dateStr?: string): boolean {
  if (!dateStr || typeof dateStr !== "string") return false;
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return false;
  const dateObj = new Date(y, m - 1, d);
  return dateObj.getDay() === 0;
}

export async function fetchBarberAvailability(
  barberId: string,
  targetDate: string,
  bookedTimesForDay: string[] = []
): Promise<TimeSlot[]> {
  if (isSundayDate(targetDate)) {
    return [];
  }

  const bookedSet = new Set(bookedTimesForDay);

  if (supabase) {
    try {
      const { data } = await supabase
        .from("appointments")
        .select("start_time")
        .eq("barber_id", barberId)
        .eq("appointment_date", targetDate)
        .neq("status", "cancelled");

      if (data) {
        for (const row of data) {
          if (row.start_time) {
            bookedSet.add(String(row.start_time).slice(0, 5));
          }
        }
      }
    } catch {
      // Fallback para estado em memória se offline
    }
  }

  return WORKING_HOURS_SLOTS.map((time) => ({
    time,
    available: !bookedSet.has(time),
  }));
}

export async function sendWhatsAppNotification(payload: {
  phone: string;
  client_name: string;
  template_type:
    | "welcome_auto_reply"
    | "confirmation"
    | "reminder_24h"
    | "cancellation"
    | "loyalty_reward"
    | "chat_reply";
  appointment_date?: string;
  appointment_time?: string;
  barber_name?: string;
  service_name?: string;
  booking_url?: string;
  custom_message?: string;
}) {
  const appUrl =
    payload.booking_url ||
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");

  if (payload.template_type === "welcome_auto_reply") {
    return {
      status: "simulated",
      provider: "evolution",
      recipient: payload.phone,
      message_preview:
        `💈 *Olá, ${payload.client_name}! Bem-vindo à Barbearia Navalha de Ouro!* ✂️\n\n` +
        `No momento estou atendendo na cadeira, mas para você *não precisar esperar*, escolha seu serviço e veja todos os horários disponíveis agora neste link:\n\n` +
        `👉 *${appUrl}*\n\n` +
        `🕘 *Funcionamento:* Segunda a Sábado, das 09:00 às 20:00.\n` +
        `Assim que confirmar no link, já cai direto na minha agenda da bancada!`,
    };
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
