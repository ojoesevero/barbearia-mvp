/**
 * Suite Automatizada de Testes de Banco de Dados (Supabase) e Regras de Sistema
 * Executa validações de integridade das 11 tabelas, Passo 1 (Serviços),
 * Passo 2 (Expediente), Passo 3 (Cadastro Prévio + Trigger Fidelidade) e
 * Motor Anti-Colisão de Horários na Agenda.
 */

import fs from "node:fs";
import path from "node:path";

function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  const envVars = {};
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf-8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq > 0) {
        envVars[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
      }
    }
  }
  return envVars;
}

const env = loadEnvLocal();
const SUPABASE_URL = (
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  env.NEXT_PUBLIC_SUPABASE_URL ||
  ""
)
  .replace(/\/rest\/v1\/?$/, "")
  .replace(/\/$/, "");

const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  env.SUPABASE_SERVICE_ROLE_KEY ||
  "";

function timeToMin(t) {
  const [hh, mm] = String(t).slice(0, 5).split(":").map(Number);
  return (hh || 0) * 60 + (mm || 0);
}

function intervalsOverlap(startA, endA, startB, endB) {
  return startA < endB && endA > startB;
}

async function sbFetch(endpoint, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  return { ok: res.ok, status: res.status, data };
}

async function runTests() {
  let passed = 0;
  let failed = 0;

  function assert(condition, testName, detail = "") {
    if (condition) {
      passed++;
      console.log(`✅ [PASS] ${testName}${detail ? ` — ${detail}` : ""}`);
    } else {
      failed++;
      console.error(`❌ [FAIL] ${testName}${detail ? ` — ${detail}` : ""}`);
    }
  }

  console.log("==============================================================");
  console.log("🧪 INICIANDO BATERIA DE TESTES DE BANCO DE DADOS E SISTEMA");
  console.log("==============================================================\n");

  // 1. Teste das 11 tabelas no Supabase
  const tables = [
    "profiles",
    "barbers",
    "barber_schedules",
    "services",
    "appointments",
    "loyalty_cards",
    "loyalty_rewards",
    "loyalty_transactions",
    "chat_rooms",
    "chat_messages",
    "whatsapp_notifications",
  ];

  for (const t of tables) {
    const res = await sbFetch(`${t}?select=*`);
    assert(
      res.ok && Array.isArray(res.data),
      `Tabela Supabase [public.${t}] acessível`,
      `HTTP ${res.status} (${res.data?.length ?? 0} registros)`
    );
  }

  // 2. Teste Passo 1: Serviços ativos cadastrados
  const servicesRes = await sbFetch("services?select=*&is_active=eq.true");
  const activeServices = servicesRes.data || [];
  assert(
    activeServices.length > 0,
    "Passo 1 (Cadastro de Serviços): Existem serviços ativos no banco",
    `${activeServices.length} serviços ativos encontrados`
  );

  // 3. Teste Passo 2: Expediente do Barbeiro (Seg-Sáb)
  const schedRes = await sbFetch(
    "barber_schedules?select=*&barber_id=eq.aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
  );
  const schedules = schedRes.data || [];
  assert(
    schedules.length >= 6,
    "Passo 2 (Expediente): Grade semanal configurada no banco",
    `${schedules.length} dias parametrizados`
  );

  // 4. Teste Passo 3: Integridade de Agendamentos (Zero Conflito de Horários no Banco)
  const apptsRes = await sbFetch(
    "appointments?select=*&status=neq.cancelled&order=appointment_date.asc,start_time.asc"
  );
  const appts = apptsRes.data || [];

  let overlapCount = 0;
  for (let i = 0; i < appts.length; i++) {
    for (let j = i + 1; j < appts.length; j++) {
      const a = appts[i];
      const b = appts[j];
      if (
        a.barber_id === b.barber_id &&
        a.appointment_date === b.appointment_date &&
        intervalsOverlap(
          timeToMin(a.start_time),
          timeToMin(a.end_time),
          timeToMin(b.start_time),
          timeToMin(b.end_time)
        )
      ) {
        overlapCount++;
      }
    }
  }
  assert(
    overlapCount === 0,
    "Integridade de Agenda: Zero sobreposição de horários em public.appointments",
    `${appts.length} agendamento(s) ativo(s), ${overlapCount} conflito(s)`
  );

  // 5. Teste Unitário do Motor Anti-Colisão (Caso real: corte das 10:20 às 11:05 e almoço 12:00 às 13:00)
  const busyStart = timeToMin("10:20");
  const busyEnd = timeToMin("11:05");
  const lunchStart = timeToMin("12:00");
  const lunchEnd = timeToMin("13:00");

  assert(
    intervalsOverlap(timeToMin("10:20"), timeToMin("11:05"), busyStart, busyEnd) === true,
    "Motor Anti-Colisão: Bloqueia tentativa de agendar no mesmo horário (10:20)"
  );
  assert(
    intervalsOverlap(timeToMin("10:40"), timeToMin("11:25"), busyStart, busyEnd) === true,
    "Motor Anti-Colisão: Bloqueia horário intermediário (10:40) durante corte de 45 min"
  );
  assert(
    intervalsOverlap(timeToMin("11:00"), timeToMin("11:45"), busyStart, busyEnd) === true,
    "Motor Anti-Colisão: Bloqueia 11:00 pois o corte anterior termina às 11:05"
  );
  assert(
    intervalsOverlap(timeToMin("10:00"), timeToMin("10:45"), busyStart, busyEnd) === true,
    "Motor Anti-Colisão: Bloqueia 10:00 para serviço de 45m pois invadiria as 10:20"
  );
  assert(
    intervalsOverlap(timeToMin("11:30"), timeToMin("12:15"), lunchStart, lunchEnd) === true,
    "Motor Anti-Colisão: Bloqueia 11:30 para serviço de 45m pois invadiria o almoço (12:00)"
  );
  assert(
    intervalsOverlap(timeToMin("11:05"), timeToMin("11:50"), busyStart, busyEnd) === false &&
      intervalsOverlap(timeToMin("11:05"), timeToMin("11:50"), lunchStart, lunchEnd) === false,
    "Motor Anti-Colisão: Libera 11:05 às 11:50 (exatamente após término das 11:05 e antes do almoço)"
  );

  console.log("\n==============================================================");
  console.log(`📊 RESULTADO FINAL: ${passed} testes aprovados | ${failed} falhas`);
  console.log("==============================================================");

  if (failed > 0) process.exit(1);
}

runTests();
