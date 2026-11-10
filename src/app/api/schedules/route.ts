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

export async function GET() {
  const supabase = getAdminSupabase();
  if (!supabase) {
    return NextResponse.json({ schedules: [] }, { status: 200 });
  }

  const { data, error } = await supabase
    .from("barber_schedules")
    .select("*")
    .eq("barber_id", DEFAULT_BARBER_ID)
    .order("day_of_week", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Garante os 7 dias (0=Domingo a 6=Sábado), padrão Seg-Sáb 09:00 às 20:00
  const existingMap = new Map(
    (data || []).map((row) => [Number(row.day_of_week), row])
  );

  const fullWeek = [1, 2, 3, 4, 5, 6, 0].map((dayNum) => {
    const found = existingMap.get(dayNum);
    if (found) {
      return {
        day_of_week: dayNum,
        start_time: String(found.start_time).slice(0, 5),
        end_time: String(found.end_time).slice(0, 5),
        break_start: String(found.break_start || "12:00").slice(0, 5),
        break_end: String(found.break_end || "13:00").slice(0, 5),
        slot_interval_minutes: Number(found.slot_interval_minutes || 30),
        is_working: Boolean(found.is_working),
      };
    }
    return {
      day_of_week: dayNum,
      start_time: "09:00",
      end_time: "20:00",
      break_start: "12:00",
      break_end: "13:00",
      slot_interval_minutes: 30,
      is_working: dayNum !== 0, // Domingo fechado por padrão
    };
  });

  return NextResponse.json({
    barber_id: DEFAULT_BARBER_ID,
    schedules: fullWeek,
  });
}

export async function PUT(req: NextRequest) {
  const supabase = getAdminSupabase();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase não configurado" },
      { status: 500 }
    );
  }

  const body = await req.json();
  const start_time = `${String(body.start_time || "09:00").slice(0, 5)}:00`;
  const end_time = `${String(body.end_time || "20:00").slice(0, 5)}:00`;
  const break_start = `${String(body.break_start || "12:00").slice(0, 5)}:00`;
  const break_end = `${String(body.break_end || "13:00").slice(0, 5)}:00`;
  const slot_interval_minutes = Number(body.slot_interval_minutes || 30);
  const workingDays: number[] = Array.isArray(body.working_days)
    ? body.working_days.map(Number)
    : [1, 2, 3, 4, 5, 6];

  const rowsToUpsert = [0, 1, 2, 3, 4, 5, 6].map((dayNum) => ({
    barber_id: DEFAULT_BARBER_ID,
    day_of_week: dayNum,
    start_time,
    end_time,
    break_start,
    break_end,
    slot_interval_minutes,
    is_working: workingDays.includes(dayNum),
  }));

  const { data, error } = await supabase
    .from("barber_schedules")
    .upsert(rowsToUpsert, { onConflict: "barber_id,day_of_week" })
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ saved: true, schedules: data });
}

