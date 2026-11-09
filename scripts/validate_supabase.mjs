/**
 * Script de Auditoria e Validação das Tabelas do Supabase (PostgreSQL)
 * Lê as credenciais diretamente do arquivo .env.local (protegido pelo .gitignore).
 */

import fs from "node:fs";
import path from "node:path";

function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  const envVars = {};
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim();
        envVars[key] = val;
      }
    }
  }
  return envVars;
}

const localEnv = loadEnvLocal();
const SUPABASE_URL = (
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  localEnv.NEXT_PUBLIC_SUPABASE_URL ||
  ""
)
  .replace(/\/rest\/v1\/?$/, "")
  .replace(/\/$/, "");

const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  localEnv.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  localEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

const TABLES = [
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

async function checkTable(table) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?select=*`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Prefer: "count=exact",
    },
  });

  const contentRange = res.headers.get("content-range");
  const body = await res.json();

  return {
    table,
    status: res.status,
    ok: res.ok,
    count: Array.isArray(body) ? body.length : 0,
    contentRange,
    rows: Array.isArray(body) ? body : [],
    error: !res.ok ? body : null,
  };
}

async function main() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Erro: Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local");
    process.exit(1);
  }

  console.log("=== INICIANDO AUDITORIA DAS 11 TABELAS NO SUPABASE ===");
  for (const table of TABLES) {
    try {
      const r = await checkTable(table);
      console.log(
        `[${r.ok ? "OK" : "ERRO"}] Tabela: ${r.table.padEnd(24)} | HTTP: ${r.status} | Registros: ${r.count}`
      );
      if (!r.ok) {
        console.log("   Detalhe do erro:", JSON.stringify(r.error));
      } else if (
        r.count > 0 &&
        ["profiles", "barbers", "services", "loyalty_cards", "loyalty_rewards"].includes(r.table)
      ) {
        const preview = r.rows
          .map(
            (item) =>
              item.full_name ||
              item.name ||
              item.title ||
              item.specialty ||
              `${item.tier} (${item.points_balance} pts)`
          )
          .join(" | ");
        console.log(`   Dados: ${preview}`);
      }
    } catch (err) {
      console.error(`[FALHA REDE] Tabela: ${table} ->`, err.message);
    }
  }
}

main();
