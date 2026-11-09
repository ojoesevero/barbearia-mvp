# 📊 Fluxogramas do Sistema e Diagrama Completo do Banco de Dados

Este documento consolida os fluxogramas operacionais, diagramas de sequência, máquina de estados e o Diagrama Entidade-Relacionamento (DER) completo do **Sistema Web para Barbearia (Barbearia MVP)**.

---

## 1. Fluxograma Geral de Operação (Jornada Ponta a Ponta)

O fluxograma abaixo representa o caminho completo do cliente desde o acesso à plataforma até o pós-atendimento com pontuação de fidelidade e notificações via WhatsApp:

```mermaid
flowchart TD
    Start(["👤 Cliente acessa o Sistema Web"]) --> CheckCadastro{"Possui cadastro?"}

    CheckCadastro -- "Não" --> FormCadastro["📝 6. Cadastro Básico do Cliente\n(Nome, WhatsApp, E-mail, Nascimento, Barbeiro Preferido)"]
    FormCadastro --> TriggerCard["⚡ Trigger SQL: trg_create_loyalty_card\nCria Cartão de Fidelidade (Nível Bronze, 0 pts)"]
    TriggerCard --> Catalogo

    CheckCadastro -- "Sim" --> Catalogo["✂️ 1. Lista de Serviços da Barbearia\nFiltra por Cabelo, Barba, Combo ou Estética"]
    Catalogo --> SelectService["Seleciona Serviço\n(Ex: Combo VIP - R$ 95 - 60 min - +40 pts)"]

    SelectService --> Calendario["📅 2. Calendário de Disponibilidade\nEscolhe Barbeiro e Data"]
    Calendario --> CalcSlots["🐍 API Python (/api/py/availability)\nConsulta Supabase + Desconta Almoço e Ocupados"]
    CalcSlots --> ChooseSlot["Cliente seleciona horário livre (Ex: 14:00)"]

    ChooseSlot --> ConfirmBook["✅ Confirma Agendamento\nGrava em public.appointments (status: confirmed)"]
    ConfirmBook --> WhatsAppConfirm["📲 3. Notificação WhatsApp (Evolution/Z-API)\nEnvia comprovante imediato para o celular do cliente"]

    WhatsAppConfirm --> CronJob["⏰ Lembrete Automático 24h Antes\nVercel Cron (/api/py/notifications/cron-reminders)"]
    WhatsAppConfirm --> Chat["💬 4. Chat Barbeiro & Cliente\nDúvidas em tempo real (Supabase Realtime + Ponte WhatsApp)"]

    CronJob --> Atendimento["💈 Atendimento Realizado na Barbearia"]
    Chat --> Atendimento

    Atendimento --> StatusComplete["Barbeiro finaliza atendimento\n(status muda para 'completed')"]
    StatusComplete --> TriggerPoints["⚡ Trigger SQL: trg_credit_loyalty_points\nSoma pontos do serviço + 1 selo no Cartão Fidelidade"]

    TriggerPoints --> CheckTier{"5. Plano de Fidelidade\nVerifica Saldo & Nível"}
    CheckTier -- "Saldo >= Custo Prêmio" --> Redeem["🎁 Cliente resgata Recompensa\n(Ex: Barba Terapia ou Corte 100% OFF)"]
    CheckTier -- "Acumulando" --> End(["🔄 Próximo Agendamento"])
    Redeem --> End
```

---

## 2. Diagrama de Sequência (Arquitetura Node.js + Python + Supabase + WhatsApp)

```mermaid
sequenceDiagram
    autonumber
    actor C as Cliente / Barbeiro
    participant W as Frontend Next.js (Node.js)
    participant P as Backend FastAPI (Python)
    participant DB as Supabase PostgreSQL
    participant RT as Supabase Realtime
    participant WA as WhatsApp API (Evolution/Z-API)

    Note over C,WA: Fluxo 1: Consulta de Disponibilidade e Agendamento
    C->>W: Seleciona Serviço, Barbeiro e Data
    W->>P: GET /api/py/availability?barber_id=...&target_date=...
    P->>DB: SELECT start_time FROM appointments WHERE status != 'cancelled'
    DB-->>P: Retorna horários já ocupados
    P-->>W: Retorna grade de slots livres (descontando intervalo de almoço)
    C->>W: Clica em "Confirmar Agendamento"
    W->>P: POST /api/py/appointments
    P->>DB: INSERT INTO appointments (...)
    P->>WA: POST /message/sendText (Confirmação de Horário)
    WA-->>C: Recebe mensagem no WhatsApp
    P-->>W: Confirmação + Preview da Notificação

    Note over C,WA: Fluxo 2: Chat em Tempo Real com Espelhamento WhatsApp
    C->>W: Envia mensagem no Chat
    W->>DB: INSERT INTO chat_messages
    DB->>RT: Dispara evento CDC (WebSocket)
    RT-->>W: Atualiza tela do Barbeiro/Cliente instantaneamente
    W->>P: POST /api/py/chat/messages (se espelhamento WhatsApp ativo)
    P->>WA: Encaminha mensagem para WhatsApp do cliente

    Note over C,WA: Fluxo 3: Conclusão e Crédito Automático de Fidelidade
    C->>DB: UPDATE appointments SET status = 'completed'
    DB->>DB: Trigger trg_credit_loyalty_points (Soma pontos, +1 selo, atualiza Tier)
    DB->>DB: INSERT INTO loyalty_transactions (tipo: 'earn')
```

---

## 3. Diagramas de Estado (Agendamento e Fidelidade)

### 3.1 Ciclo de Vida do Agendamento (`appointment_status`)

```mermaid
stateDiagram-v2
    [*] --> pending : Reserva criada (aguardando validação)
    [*] --> confirmed : Reserva imediata pelo Calendário
    pending --> confirmed : Cliente confirma via WhatsApp
    pending --> cancelled : Cancelado antes da confirmação
    confirmed --> completed : Corte realizado na barbearia (Dispara Pontos Fidelidade)
    confirmed --> cancelled : Cancelado pelo cliente/barbeiro (>2h antecedência)
    confirmed --> no_show : Cliente não compareceu
    completed --> [*]
    cancelled --> [*]
    no_show --> [*]
```

### 3.2 Progressão de Níveis do Plano de Fidelidade (`tier`)

```mermaid
stateDiagram-v2
    [*] --> Bronze : Cadastro do Cliente (0 a 99 pts acumulados)
    Bronze --> Prata : Atinge 100 pts históricos
    Prata --> Ouro : Atinge 250 pts históricos
    Ouro --> VIP : Atinge 500+ pts históricos
```

---

## 4. Diagrama Entidade-Relacionamento Completo (Banco de Dados Supabase)

O banco de dados no Supabase é composto por **11 tabelas** no schema `public`, conectadas por chaves estrangeiras (`FK`) e protegidas por *Row Level Security (RLS)*:

```mermaid
erDiagram
    PROFILES ||--o| BARBERS : "1:1 (quando role=barber)"
    BARBERS ||--o{ PROFILES : "1:N (preferred_barber_id)"
    PROFILES ||--|| LOYALTY_CARDS : "1:1 (cartão fidelidade)"
    PROFILES ||--o{ APPOINTMENTS : "1:N (client_id)"
    BARBERS ||--o{ BARBER_SCHEDULES : "1:N (barber_id)"
    BARBERS ||--o{ APPOINTMENTS : "1:N (barber_id)"
    SERVICES ||--o{ APPOINTMENTS : "1:N (service_id)"
    SERVICES ||--o{ LOYALTY_REWARDS : "1:N (service_id)"
    LOYALTY_CARDS ||--o{ LOYALTY_TRANSACTIONS : "1:N (loyalty_card_id)"
    APPOINTMENTS ||--o{ LOYALTY_TRANSACTIONS : "1:N (appointment_id)"
    LOYALTY_REWARDS ||--o{ LOYALTY_TRANSACTIONS : "1:N (reward_id)"
    PROFILES ||--o{ CHAT_ROOMS : "1:N (client_id)"
    BARBERS ||--o{ CHAT_ROOMS : "1:N (barber_id)"
    CHAT_ROOMS ||--o{ CHAT_MESSAGES : "1:N (room_id)"
    PROFILES ||--o{ CHAT_MESSAGES : "1:N (sender_profile_id)"
    PROFILES ||--o{ WHATSAPP_NOTIFICATIONS : "1:N (client_id)"
    APPOINTMENTS ||--o{ WHATSAPP_NOTIFICATIONS : "1:N (appointment_id)"

    PROFILES {
        uuid id PK
        uuid auth_user_id UK "FK opcional auth.users"
        varchar full_name "Nome completo"
        varchar phone UK "WhatsApp E.164 (+55...)"
        varchar email UK "E-mail do usuário"
        date birth_date "Data de nascimento"
        text avatar_url "Foto de perfil"
        user_role role "client | barber | admin"
        uuid preferred_barber_id FK "Barbeiro preferido"
        boolean whatsapp_opt_in "Aceita notificações"
        text notes "Observações do cliente"
        timestamptz created_at
        timestamptz updated_at
    }

    BARBERS {
        uuid id PK
        uuid profile_id UK "FK para profiles.id"
        varchar specialty "Especialidade técnica"
        text bio "Biografia profissional"
        numeric rating "Nota média (0.00 a 5.00)"
        numeric commission_rate "Comissão (%)"
        boolean is_active "Ativo na agenda"
        timestamptz created_at
        timestamptz updated_at
    }

    BARBER_SCHEDULES {
        uuid id PK
        uuid barber_id FK "FK para barbers.id"
        smallint day_of_week "0 (Dom) a 6 (Sáb)"
        time start_time "Início expediente (09:00)"
        time end_time "Fim expediente (19:00)"
        time break_start "Início almoço (12:00)"
        time break_end "Fim almoço (13:00)"
        smallint slot_interval_minutes "Duração slot (30 min)"
        boolean is_working "Dia útil ativo"
    }

    SERVICES {
        uuid id PK
        varchar name "Nome do serviço"
        varchar category "Cabelo | Barba | Combo | Estética"
        text description "Detalhes do serviço"
        numeric price "Valor em R$"
        smallint duration_minutes "Tempo estimado (min)"
        integer loyalty_points "Pontos gerados"
        text image_url "Imagem ilustrativa"
        boolean is_active "Disponível no catálogo"
        timestamptz created_at
        timestamptz updated_at
    }

    APPOINTMENTS {
        uuid id PK
        uuid client_id FK "FK para profiles.id"
        uuid barber_id FK "FK para barbers.id"
        uuid service_id FK "FK para services.id"
        date appointment_date "Data do corte"
        time start_time "Horário inicial"
        time end_time "Horário final"
        appointment_status status "pending|confirmed|completed|cancelled|no_show"
        numeric total_price "Valor cobrado"
        text notes "Observações do pedido"
        boolean reminder_sent "Lembrete 24h enviado"
        timestamptz created_at
        timestamptz updated_at
    }

    LOYALTY_CARDS {
        uuid id PK
        uuid client_id UK "FK para profiles.id"
        integer points_balance "Saldo disponível para resgate"
        integer total_points_earned "Acumulado histórico (define Tier)"
        smallint stamps_count "Selos acumulados (0 a 10)"
        varchar tier "Bronze | Prata | Ouro | VIP"
        timestamptz updated_at
    }

    LOYALTY_REWARDS {
        uuid id PK
        varchar title "Nome da recompensa"
        text description "Regras do prêmio"
        integer points_cost "Custo em pontos"
        uuid service_id FK "Serviço vinculado (opcional)"
        boolean is_active "Ativo para resgate"
        timestamptz created_at
    }

    LOYALTY_TRANSACTIONS {
        uuid id PK
        uuid loyalty_card_id FK "FK para loyalty_cards.id"
        uuid appointment_id FK "FK para appointments.id"
        uuid reward_id FK "FK para loyalty_rewards.id"
        loyalty_tx_type tx_type "earn | redeem | bonus | expire"
        integer points "+ganho ou -resgate"
        varchar description "Histórico da transação"
        timestamptz created_at
    }

    CHAT_ROOMS {
        uuid id PK
        uuid client_id FK "FK para profiles.id"
        uuid barber_id FK "FK para barbers.id"
        timestamptz last_message_at "Última interação"
        timestamptz created_at
    }

    CHAT_MESSAGES {
        uuid id PK
        uuid room_id FK "FK para chat_rooms.id"
        uuid sender_profile_id FK "Autor da mensagem"
        text content "Texto da mensagem"
        boolean is_read "Lida pelo destinatário"
        boolean sent_via_whatsapp "Sincronizada com WhatsApp"
        timestamptz created_at
    }

    WHATSAPP_NOTIFICATIONS {
        uuid id PK
        uuid client_id FK "FK para profiles.id"
        uuid appointment_id FK "FK para appointments.id"
        varchar phone "Telefone destino"
        varchar template_type "confirmation | reminder_24h | ..."
        text message_body "Conteúdo disparado"
        varchar provider "evolution | zapi"
        varchar external_message_id "ID de retorno da API"
        notification_status status "queued | sent | delivered | failed"
        text error_message "Log de erro se falhar"
        timestamptz sent_at
        timestamptz created_at
    }
```

---

## 5. Resumo das Automações Internas do Banco (Triggers PL/pgSQL)

| Trigger | Tabela Alvo | Evento | Função Executada | Regra de Negócio |
| :--- | :--- | :--- | :--- | :--- |
| `trg_profiles_updated_at` | `profiles` | `BEFORE UPDATE` | `handle_updated_at()` | Atualiza `updated_at = NOW()` automaticamente. |
| `trg_barbers_updated_at` | `barbers` | `BEFORE UPDATE` | `handle_updated_at()` | Atualiza `updated_at = NOW()` automaticamente. |
| `trg_services_updated_at` | `services` | `BEFORE UPDATE` | `handle_updated_at()` | Atualiza `updated_at = NOW()` automaticamente. |
| `trg_appointments_updated_at` | `appointments` | `BEFORE UPDATE` | `handle_updated_at()` | Atualiza `updated_at = NOW()` automaticamente. |
| `trg_create_loyalty_card` | `profiles` | `AFTER INSERT` | `create_loyalty_card_for_new_client()` | Cria imediatamente um registro em `loyalty_cards` com saldo `0` e tier `Bronze` para todo novo cliente. |
| `trg_credit_loyalty_points` | `appointments` | `AFTER UPDATE` | `credit_loyalty_points_on_completion()` | Quando `status` passa para `'completed'`, soma `services.loyalty_points` ao cartão do cliente, avança `stamps_count` (1 a 10), recalcula o `tier` e grava o extrato em `loyalty_transactions`. |

