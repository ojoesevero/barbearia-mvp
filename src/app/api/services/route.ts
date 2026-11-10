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

export async function GET() {
  const supabase = getAdminSupabase();
  if (!supabase) {
    return NextResponse.json({ services: [] }, { status: 200 });
  }

  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ services: data || [] });
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
  const name = String(body.name || "").trim();
  const category = String(body.category || "Cabelo").trim();
  const price = Number(body.price || 0);
  const duration_minutes = Number(body.duration_minutes || 30);
  const loyalty_points = Math.max(5, Math.round(price / 3));

  if (!name || price <= 0) {
    return NextResponse.json(
      { error: "Informe o nome e o valor do serviço." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("services")
    .insert([
      {
        name,
        category,
        description: body.description || `${name} (${duration_minutes} min)`,
        price,
        duration_minutes,
        loyalty_points,
        is_active: true,
      },
    ])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ service: data }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const supabase = getAdminSupabase();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase não configurado" },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });
  }

  // Soft delete (is_active = false) para não quebrar histórico de agendamentos
  const { error } = await supabase
    .from("services")
    .update({ is_active: false })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ deleted: true });
}

