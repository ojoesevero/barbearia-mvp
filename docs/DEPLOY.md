# ☁️ Guia de Deploy — Supabase, GitHub e Vercel

Siga este passo a passo para colocar o sistema em produção utilizando **Supabase** e **Vercel**.

---

## Passo 1: Preparar o Banco de Dados no Supabase

1. Crie um novo projeto em [supabase.com](https://supabase.com).
2. No menu lateral, acesse **SQL Editor** -> **New Query**.
3. Copie e execute o conteúdo de `supabase/migrations/001_initial_schema.sql`.
4. Em seguida, execute `supabase/migrations/002_rls_policies.sql`.
5. Por fim, execute `supabase/seed.sql` para popular os barbeiros, horários, serviços e prêmios iniciais.
6. Em **Project Settings -> API**, copie:
   - `Project URL` (`NEXT_PUBLIC_SUPABASE_URL`)
   - `anon public` (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - `service_role secret` (`SUPABASE_SERVICE_ROLE_KEY`)

---

## Passo 2: Configurar o Deploy na Vercel

1. Acesse [vercel.com/new](https://vercel.com/new) e importe o repositório `ojoesevero/barbearia-mvp` do GitHub.
2. O arquivo `vercel.json` na raiz configurará automaticamente:
   - O build do **Next.js (Node.js)** para o frontend.
   - As Serverless Functions em **Python (`api/index.py`)** sob a rota `/api/py/*`.
   - O **Vercel Cron Job** diário (`/api/py/notifications/cron-reminders`) às 11:00 UTC.
3. Na seção **Environment Variables** da Vercel, adicione as variáveis listadas em `.env.example`.
4. Clique em **Deploy**.

