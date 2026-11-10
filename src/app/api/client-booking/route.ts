import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdminSupabase() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const url = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";

  if (!url || !key) return null;
  return createClient(url, key);
}

const DEFAULT_BARBER_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

function timeToMinutes(t: string): number {
  const [hh, mm] = String(t).slice(0, 5).split(":").map(Number);
  return (hh || 0) * 60 + (mm || 0);
}

function minutesToTime(totalMinutes: number): string {
  const hh = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const mm = String(totalMinutes % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

/**
 * Verifica se dois intervalos de tempo [startA, endA) e [startB, endB) se sobrepõem.
 */
function intervalsOverlap(
  startA: number,
  endA: number,
  startB: number,
  endB: number
): boolean {
  return startA < endB && endA > startB;
}

export async function GET(req: NextRequest) {
  const supabase = getAdminSupabase();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase não configurado" },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(req.url);
  const dateStr =
    searchParams.get("date") || new Date().toISOString().split("T")[0];
  const requestedDuration = Number(searchParams.get("duration") || 0);

  const [y, m, d] = dateStr.split("-").map(Number);
  const dayOfWeek = new Date(y, m - 1, d).getDay(); // 0=Dom ... 6=Sáb

  // 1. Busca expediente salvo no Passo 2 para este dia da semana
  const { data: schedRow } = await supabase
    .from("barber_schedules")
    .select("*")
    .eq("barber_id", DEFAULT_BARBER_ID)
    .eq("day_of_week", dayOfWeek)
    .maybeSingle();

  const isWorking = schedRow ? Boolean(schedRow.is_working) : dayOfWeek !== 0;

  if (!isWorking) {
    return NextResponse.json({
      date: dateStr,
      day_of_week: dayOfWeek,
      is_working: false,
      slots: [],
    });
  }

  const startMin = timeToMinutes(schedRow?.start_time || "09:00");
  const endMin = timeToMinutes(schedRow?.end_time || "20:00");
  const breakStartMin = timeToMinutes(schedRow?.break_start || "12:00");
  const breakEndMin = timeToMinutes(schedRow?.break_end || "13:00");
  const interval = Number(schedRow?.slot_interval_minutes || 30);
  const serviceDuration = requestedDuration > 0 ? requestedDuration : interval;

  // 2. Busca todos os agendamentos ativos nesta data (com start_time E end_time)
  const { data: existingAppts } = await supabase
    .from("appointments")
    .select("id, start_time, end_time, status")
    .eq("barber_id", DEFAULT_BARBER_ID)
    .eq("appointment_date", dateStr)
    .neq("status", "cancelled");

  const busyIntervals = (existingAppts || []).map((a) => ({
    start: timeToMinutes(a.start_time),
    end: timeToMinutes(a.end_time),
  }));

  // 3. Gera os slots e bloqueia qualquer horário cujo intervalo [cur, cur + serviceDuration)
  // invada o horário de almoço, passe do fechamento ou colida com outro agendamento!
  const slots: { time: string; available: boolean }[] = [];
  for (let cur = startMin; cur + interval <= endMin; cur += interval) {
    const slotEnd = cur + serviceDuration;

    // Se o próprio início do slot está dentro do almoço, não exibe na grade
    const startsInLunch = cur >= breakStartMin && cur < breakEndMin;
    if (startsInLunch) continue;

    // Verifica se o tempo total do serviço invade o almoço ou passa do fechamento
    const invadesLunch = intervalsOverlap(
      cur,
      slotEnd,
      breakStartMin,
      breakEndMin
    );
    const exceedsClosing = slotEnd > endMin;

    // Verifica colisão de intervalo real [cur, slotEnd) com agendamentos existentes
    const collidesWithAppointment = busyIntervals.some((busy) =>
      intervalsOverlap(cur, slotEnd, busy.start, busy.end)
    );

    const timeLabel = minutesToTime(cur);
    slots.push({
      time: timeLabel,
      available: !invadesLunch && !exceedsClosing && !collidesWithAppointment,
    });
  }

  return NextResponse.json({
    date: dateStr,
    day_of_week: dayOfWeek,
    is_working: true,
    slots,
  });
}

export async function POST(req: NextRequest) {
  const supabase = getAdminSupabase();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase não configurado" },
      { status: 500 }
    );
  }

  const body = await req.json();
  const action = body.action;

  // ETAPA 1: Cadastro prévio / Identificação do Cliente (Nome + Telefone)
  if (action === "identify") {
    const fullName = String(body.full_name || "").trim();
    const rawPhone = String(body.phone || "").replace(/\D/g, "");
    const normalizedPhone =
      rawPhone.length >= 10 && !rawPhone.startsWith("55")
        ? `+55${rawPhone}`
        : `+${rawPhone}`;

    if (!fullName || rawPhone.length < 10) {
      return NextResponse.json(
        { error: "Informe seu nome e número de WhatsApp com DDD." },
        { status: 400 }
      );
    }

    const { data: client, error } = await supabase
      .from("profiles")
      .upsert(
        {
          full_name: fullName,
          phone: normalizedPhone,
          role: "client",
          whatsapp_opt_in: true,
        },
        { onConflict: "phone" }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: loyalty } = await supabase
      .from("loyalty_cards")
      .select("*")
      .eq("client_id", client.id)
      .maybeSingle();

    return NextResponse.json({
      client,
      loyalty: loyalty || { points_balance: 0, stamps_count: 0, tier: "Bronze" },
    });
  }

  // ETAPA 2: Confirmar Agendamento no Banco (com trava anti-colisão de horário)
  if (action === "book") {
    const { client_id, service_id, appointment_date, start_time } = body;

    if (!client_id || !service_id || !appointment_date || !start_time) {
      return NextResponse.json(
        { error: "Dados incompletos para o agendamento." },
        { status: 400 }
      );
    }

    const { data: service } = await supabase
      .from("services")
      .select("*")
      .eq("id", service_id)
      .single();

    if (!service) {
      return NextResponse.json(
        { error: "Serviço não encontrado." },
        { status: 404 }
      );
    }

    const startMin = timeToMinutes(start_time);
    const endMin = startMin + Number(service.duration_minutes || 30);
    const endTime = minutesToTime(endMin);

    // TRAVA DE ENGENHARIA NO BACKEND: Verifica se já existe agendamento que sobreponha [startMin, endMin)
    const { data: existingAppts } = await supabase
      .from("appointments")
      .select("id, start_time, end_time")
      .eq("barber_id", DEFAULT_BARBER_ID)
      .eq("appointment_date", appointment_date)
      .neq("status", "cancelled");

    const conflicting = (existingAppts || []).find((a) =>
      intervalsOverlap(
        startMin,
        endMin,
        timeToMinutes(a.start_time),
        timeToMinutes(a.end_time)
      )
    );

    if (conflicting) {
      return NextResponse.json(
        {
          error: `Horário indisponível! Já existe um atendimento das ${String(
            conflicting.start_time
          ).slice(0, 5)} às ${String(conflicting.end_time).slice(
            0,
            5
          )}. Escolha outro horário.`,
        },
        { status: 409 }
      );
    }

    const { data: appointment, error: bookErr } = await supabase
      .from("appointments")
      .insert([
        {
          client_id,
          barber_id: DEFAULT_BARBER_ID,
          service_id,
          appointment_date,
          start_time: `${start_time}:00`,
          end_time: `${endTime}:00`,
          status: "confirmed",
          total_price: service.price,
        },
      ])
      .select()
      .single();

    if (bookErr) {
      return NextResponse.json({ error: bookErr.message }, { status: 500 });
    }

    return NextResponse.json({ appointment, service }, { status: 201 });
  }

  return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
}
