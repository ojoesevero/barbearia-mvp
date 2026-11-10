# 💈 Barbearia MVP — Sistema Web Completo para Barbearias

Sistema web moderno desenvolvido para gestão de barbearias e autoatendimento de clientes, construído com arquitetura híbrida **Node.js (Next.js 14)** no Frontend e **Python (FastAPI Serverless)** no Backend, banco de dados e tempo real no **Supabase (PostgreSQL + Realtime)**, notificações ativas via **WhatsApp (Evolution API / Z-API)** e hospedagem unificada na **Vercel**.

---

## ✨ Funcionalidades Principais

1. **✂️ Lista de Serviços da Barbearia**: Catálogo interativo com filtro por categorias (*Cabelo, Barba, Combo, Estética*), preços, tempo estimado de execução e pontos de fidelidade concedidos.
2. **📅 Calendário de Disponibilidade**: Consulta dinâmica da grade de horários por barbeiro e data, descontando automaticamente intervalos de almoço e horários já reservados.
3. **📲 Notificação via WhatsApp para o Cliente**: Integração em Python com **Evolution API / Z-API** para disparo automático de confirmações de agendamento, lembretes 24h antes (via Vercel Cron), resgates de fidelidade e espelhamento do chat.
4. **💬 Chat entre Barbeiro e Cliente**: Conversa em tempo real suportada pelo **Supabase Realtime** com opção de sincronizar respostas diretamente no WhatsApp do cliente.
5. **🏆 Plano de Fidelidade**: Cartão digital de 10 selos + sistema de pontos por serviço concluído (calculado via *Database Trigger* no PostgreSQL), níveis (*Bronze, Prata, Ouro, VIP*), catálogo de prêmios e extrato.
6. **👤 Cadastro Básico do Cliente**: Registro rápido com Nome, WhatsApp (formato E.164), E-mail, Data de Nascimento, Barbeiro de Preferência e *Opt-in* de notificações.

---

## 🏗️ Arquitetura de Diretórios (Boas Práticas)

```text
barbearia-mvp/
├── api/                                # Backend Python (FastAPI Serverless na Vercel)
│   ├── core/
│   │   ├── config.py                   # Variáveis de ambiente e configurações globais
│   │   └── database.py                 # Cliente singleton do Supabase para Python
│   ├── schemas/
│   │   └── models.py                   # Contratos e validações Pydantic v2
│   ├── services/
│   │   ├── availability_service.py     # Algoritmo de cálculo de slots livres na agenda
│   │   ├── loyalty_service.py          # Regras de negócio de selos, pontos e níveis VIP
│   │   └── whatsapp_service.py         # Integração REST com Evolution API e Z-API
│   ├── __init__.py
│   └── index.py                        # Entrypoint FastAPI (/api/py/*)
├── docs/                               # Documentação Técnica (Markdown)
│   ├── ARCHITECTURE.md                 # Desenho de arquitetura e fluxos de dados
│   ├── DATABASE.md                     # Diagrama ER, Triggers e Políticas RLS
│   ├── API_AND_WHATSAPP.md             # Contratos da API Python e Templates WhatsApp
│   └── DEPLOY.md                       # Guia passo a passo de deploy (Supabase + Vercel)
├── src/                                # Frontend Node.js (Next.js 14 App Router + TypeScript)
│   ├── app/
│   │   ├── globals.css                 # Estilos globais e Tailwind CSS
│   │   ├── layout.tsx                  # Layout raiz da aplicação
│   │   └── page.tsx                    # Dashboard unificado do Cliente & Barbearia
│   ├── components/
│   │   ├── AvailabilityCalendar.tsx    # Calendário de horários e reserva
│   │   ├── BarberClientChat.tsx        # Chat em tempo real Barbeiro <-> Cliente
│   │   ├── ClientRegistration.tsx      # Formulário de cadastro básico e teste WhatsApp
│   │   ├── LoyaltyPlan.tsx             # Cartão de 10 selos, pontos e resgate de prêmios
│   │   └── ServiceList.tsx             # Catálogo filtrável de serviços da barbearia
│   ├── lib/
│   │   ├── mock-data.ts                # Dados iniciais sincronizados com seed.sql
│   │   └── supabase.ts                 # Cliente Supabase para o navegador
│   ├── services/
│   │   └── api.ts                      # Cliente HTTP para comunicação com FastAPI
│   └── types/
│       └── barbershop.ts               # Tipagens estáticas TypeScript
├── supabase/                           # Scripts de Banco de Dados PostgreSQL
│   ├── migrations/
│   │   ├── 001_initial_schema.sql      # Criação de tabelas, índices, funções e triggers
│   │   └── 002_rls_policies.sql        # Row Level Security (RLS) e publicação Realtime
│   └── seed.sql                        # Carga inicial de barbeiros, serviços e prêmios
├── .env.example                        # Template de variáveis de ambiente
├── next.config.mjs                     # Proxy reverso local Next.js -> FastAPI
├── package.json                        # Dependências Node.js
├── requirements.txt                    # Dependências Python para Vercel Serverless
└── vercel.json                         # Roteamento híbrido Next.js + Python + Cron Jobs
```

---

## 🚀 Como Executar Localmente

### 1. Configurar Variáveis de Ambiente
Copie o arquivo `.env.example` para `.env.local` e preencha com as chaves do seu projeto Supabase e provedor WhatsApp (ou execute diretamente no modo demonstração integrado):
```bash
cp .env.example .env.local
```

### 2. Criar as Tabelas no Supabase
No painel do **Supabase -> SQL Editor**, execute na ordem:
1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_rls_policies.sql`
3. `supabase/seed.sql`

### 3. Iniciar o Backend Python (FastAPI)
```bash
python -m venv .venv
# Windows PowerShell:
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
npm run dev:api
```
A documentação interativa Swagger estará disponível em `http://127.0.0.1:8000/api/py/docs`.

### 4. Iniciar o Frontend Node.js (Next.js)
```bash
npm install
npm run dev
```
Acesse `http://localhost:3000`.

---

## 📚 Documentação Complementar

- [📐 Arquitetura do Sistema (`docs/ARCHITECTURE.md`)](docs/ARCHITECTURE.md)
- [🗄️ Modelagem do Banco de Dados (`docs/DATABASE.md`)](docs/DATABASE.md)
- [🔌 API Python & Integração WhatsApp (`docs/API_AND_WHATSAPP.md`)](docs/API_AND_WHATSAPP.md)
- [☁️ Guia de Deploy na Vercel & Supabase (`docs/DEPLOY.md`)](docs/DEPLOY.md)

