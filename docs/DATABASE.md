# 🗄️ Modelagem do Banco de Dados (Supabase / PostgreSQL)

Os scripts de criação de tabelas estão organizados no diretório `supabase/`:
- `supabase/migrations/001_initial_schema.sql`: Tabelas, relacionamentos, índices, funções e *triggers*.
- `supabase/migrations/002_rls_policies.sql`: Políticas de segurança *Row Level Security (RLS)* e configuração do *Supabase Realtime*.
- `supabase/seed.sql`: Dados iniciais de barbeiros, horários de expediente, serviços e recompensas.

---

## 1. Diagrama Entidade-Relacionamento (ERD)

```mermaid
erDiagram
    PROFILES ||--o| BARBERS : "é um profissional"
    PROFILES ||--o| LOYALTY_CARDS : "possui cartão"
    PROFILES ||--o{ APPOINTMENTS : "agenda como cliente"
    BARBERS ||--o{ BARBER_SCHEDULES : "atende em"
    BARBERS ||--o{ APPOINTMENTS : "realiza"
    SERVICES ||--o{ APPOINTMENTS : "compõe"
    LOYALTY_CARDS ||--o{ LOYALTY_TRANSACTIONS : "registra extrato"
    LOYALTY_REWARDS ||--o{ LOYALTY_TRANSACTIONS : "é resgatada em"
    PROFILES ||--o{ CHAT_ROOMS : "participa (cliente)"
    BARBERS ||--o{ CHAT_ROOMS : "participa (barbeiro)"
    CHAT_ROOMS ||--o{ CHAT_MESSAGES : "contém mensagens"
    PROFILES ||--o{ WHATSAPP_NOTIFICATIONS : "recebe"

    PROFILES {
        uuid id PK
        varchar full_name
        varchar phone UK
        varchar email UK
        date birth_date
        user_role role
        uuid preferred_barber_id FK
        boolean whatsapp_opt_in
    }

    BARBERS {
        uuid id PK
        uuid profile_id FK
        varchar specialty
        numeric rating
        boolean is_active
    }

    SERVICES {
        uuid id PK
        varchar name
        varchar category
        numeric price
        smallint duration_minutes
        integer loyalty_points
    }

    APPOINTMENTS {
        uuid id PK
        uuid client_id FK
        uuid barber_id FK
        uuid service_id FK
        date appointment_date
        time start_time
        time end_time
        appointment_status status
        numeric total_price
    }

    LOYALTY_CARDS {
        uuid id PK
        uuid client_id FK
        integer points_balance
        integer total_points_earned
        smallint stamps_count
        varchar tier
    }
```

---

## 2. Descrição das Tabelas

| Tabela | Finalidade |
| :--- | :--- |
| `public.profiles` | Cadastro básico de clientes, barbeiros e administradores (nome, telefone WhatsApp único, data de nascimento, barbeiro preferido e opt-in). |
| `public.barbers` | Dados profissionais de cada barbeiro (especialidade, avaliação, comissão e status ativo). |
| `public.barber_schedules` | Grade de expediente por dia da semana (`0` a `6`), horário de início/fim, intervalo de almoço e duração padrão do slot. |
| `public.services` | Catálogo de serviços da barbearia com preço, duração em minutos e quantidade de pontos de fidelidade gerados. |
| `public.appointments` | Agendamentos realizados pelos clientes, vinculando cliente, barbeiro, serviço, data, horário e status (`pending`, `confirmed`, `completed`, `cancelled`, `no_show`). |
| `public.loyalty_cards` | Saldo de pontos, contagem de selos (0 a 10) e categoria atual (`Bronze`, `Prata`, `Ouro`, `VIP`) do cliente. |
| `public.loyalty_rewards` | Catálogo de recompensas resgatáveis com pontos acumulados. |
| `public.loyalty_transactions` | Histórico auditável de pontos ganhos (`earn`) e resgatados (`redeem`). |
| `public.chat_rooms` / `public.chat_messages` | Salas de bate-papo e mensagens em tempo real entre barbeiro e cliente. |
| `public.whatsapp_notifications` | Log de auditoria e fila de envios de mensagens via WhatsApp. |

