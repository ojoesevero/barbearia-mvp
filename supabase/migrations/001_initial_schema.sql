-- ============================================================================
-- Migration: 001_initial_schema.sql
-- Description: Schema principal do Sistema Web de Barbearia (Supabase/PostgreSQL)
-- Author: Engenharia de Software - Barbearia MVP
-- ============================================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. ENUMS
-- ============================================================================
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('client', 'barber', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE appointment_status AS ENUM (
        'pending',
        'confirmed',
        'completed',
        'cancelled',
        'no_show'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE loyalty_tx_type AS ENUM ('earn', 'redeem', 'bonus', 'expire');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_status AS ENUM ('queued', 'sent', 'delivered', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- 2. TABELA: profiles (Cadastro básico de Clientes, Barbeiros e Admins)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
    full_name VARCHAR(120) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE, -- Formato E.164 ex: +5511999999999
    email VARCHAR(160) UNIQUE,
    birth_date DATE,
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'client',
    preferred_barber_id UUID,
    whatsapp_opt_in BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- ============================================================================
-- 3. TABELA: barbers (Profissionais da Barbearia)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.barbers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    specialty VARCHAR(120) NOT NULL DEFAULT 'Corte & Barba Clássica',
    bio TEXT,
    rating NUMERIC(3, 2) NOT NULL DEFAULT 5.00,
    commission_rate NUMERIC(5, 2) NOT NULL DEFAULT 50.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Adiciona FK de barbeiro preferido em profiles após criação da tabela barbers
ALTER TABLE public.profiles
    DROP CONSTRAINT IF EXISTS fk_profiles_preferred_barber,
    ADD CONSTRAINT fk_profiles_preferred_barber
    FOREIGN KEY (preferred_barber_id) REFERENCES public.barbers(id) ON DELETE SET NULL;

-- ============================================================================
-- 4. TABELA: barber_schedules (Grade de Horários Semanal por Barbeiro)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.barber_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    barber_id UUID NOT NULL REFERENCES public.barbers(id) ON DELETE CASCADE,
    day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Dom, 1=Seg ... 6=Sáb
    start_time TIME NOT NULL DEFAULT '09:00:00',
    end_time TIME NOT NULL DEFAULT '20:00:00',
    break_start TIME DEFAULT '12:00:00',
    break_end TIME DEFAULT '13:00:00',
    slot_interval_minutes SMALLINT NOT NULL DEFAULT 30,
    is_working BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE (barber_id, day_of_week)
);

-- ============================================================================
-- 5. TABELA: services (Catálogo de Serviços da Barbearia)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'Cabelo', -- Cabelo, Barba, Combo, Estética
    description TEXT,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    duration_minutes SMALLINT NOT NULL CHECK (duration_minutes > 0),
    loyalty_points INTEGER NOT NULL DEFAULT 10 CHECK (loyalty_points >= 0),
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_services_active ON public.services(is_active);

-- ============================================================================
-- 6. TABELA: appointments (Agenda e Reservas de Horários)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    barber_id UUID NOT NULL REFERENCES public.barbers(id) ON DELETE RESTRICT,
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status appointment_status NOT NULL DEFAULT 'confirmed',
    total_price NUMERIC(10, 2) NOT NULL,
    notes TEXT,
    reminder_sent BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_appointment_time CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_appointments_date_barber
    ON public.appointments(appointment_date, barber_id, status);
CREATE INDEX IF NOT EXISTS idx_appointments_client
    ON public.appointments(client_id, appointment_date DESC);

-- ============================================================================
-- 7. TABELAS DE FIDELIDADE: loyalty_cards, loyalty_rewards, loyalty_transactions
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.loyalty_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    points_balance INTEGER NOT NULL DEFAULT 0 CHECK (points_balance >= 0),
    total_points_earned INTEGER NOT NULL DEFAULT 0,
    stamps_count SMALLINT NOT NULL DEFAULT 0 CHECK (stamps_count BETWEEN 0 AND 10),
    tier VARCHAR(30) NOT NULL DEFAULT 'Bronze', -- Bronze, Prata, Ouro, VIP
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.loyalty_rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(100) NOT NULL,
    description TEXT,
    points_cost INTEGER NOT NULL CHECK (points_cost > 0),
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loyalty_card_id UUID NOT NULL REFERENCES public.loyalty_cards(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    reward_id UUID REFERENCES public.loyalty_rewards(id) ON DELETE SET NULL,
    tx_type loyalty_tx_type NOT NULL,
    points INTEGER NOT NULL, -- Positivo para ganho, negativo para resgate
    description VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loyalty_tx_card
    ON public.loyalty_transactions(loyalty_card_id, created_at DESC);

-- ============================================================================
-- 8. TABELAS DE CHAT: chat_rooms e chat_messages (Barbeiro <-> Cliente)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.chat_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    barber_id UUID NOT NULL REFERENCES public.barbers(id) ON DELETE CASCADE,
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (client_id, barber_id)
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
    sender_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    sent_via_whatsapp BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_room
    ON public.chat_messages(room_id, created_at ASC);

-- ============================================================================
-- 9. TABELA: whatsapp_notifications (Auditoria e Fila de Disparos WhatsApp)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.whatsapp_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    phone VARCHAR(20) NOT NULL,
    template_type VARCHAR(50) NOT NULL, -- confirmation, reminder_24h, cancellation, loyalty_reward
    message_body TEXT NOT NULL,
    provider VARCHAR(30) NOT NULL DEFAULT 'evolution',
    external_message_id VARCHAR(120),
    status notification_status NOT NULL DEFAULT 'queued',
    error_message TEXT,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_status
    ON public.whatsapp_notifications(status, created_at);

-- ============================================================================
-- 10. TRIGGERS E FUNÇÕES AUTOMÁTICAS
-- ============================================================================

-- 10.1 Atualizar coluna updated_at automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_barbers_updated_at
    BEFORE UPDATE ON public.barbers
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_services_updated_at
    BEFORE UPDATE ON public.services
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_appointments_updated_at
    BEFORE UPDATE ON public.appointments
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 10.2 Criar cartão de fidelidade automaticamente ao cadastrar novo cliente
CREATE OR REPLACE FUNCTION public.create_loyalty_card_for_new_client()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role = 'client' THEN
        INSERT INTO public.loyalty_cards (client_id, points_balance, total_points_earned, stamps_count, tier)
        VALUES (NEW.id, 0, 0, 0, 'Bronze')
        ON CONFLICT (client_id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_create_loyalty_card
    AFTER INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.create_loyalty_card_for_new_client();

-- 10.3 Creditar pontos e selo de fidelidade quando o agendamento for concluído
CREATE OR REPLACE FUNCTION public.credit_loyalty_points_on_completion()
RETURNS TRIGGER AS $$
DECLARE
    v_service_points INTEGER;
    v_service_name VARCHAR(100);
    v_card_id UUID;
    v_new_total INTEGER;
    v_new_tier VARCHAR(30);
BEGIN
    IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
        SELECT loyalty_points, name INTO v_service_points, v_service_name
        FROM public.services WHERE id = NEW.service_id;

        SELECT id INTO v_card_id
        FROM public.loyalty_cards WHERE client_id = NEW.client_id;

        IF v_card_id IS NOT NULL AND v_service_points > 0 THEN
            UPDATE public.loyalty_cards
            SET
                points_balance = points_balance + v_service_points,
                total_points_earned = total_points_earned + v_service_points,
                stamps_count = CASE WHEN stamps_count >= 10 THEN 1 ELSE stamps_count + 1 END,
                updated_at = NOW()
            WHERE id = v_card_id
            RETURNING total_points_earned INTO v_new_total;

            -- Atualiza Tier conforme acumulado histórico
            v_new_tier := CASE
                WHEN v_new_total >= 500 THEN 'VIP'
                WHEN v_new_total >= 250 THEN 'Ouro'
                WHEN v_new_total >= 100 THEN 'Prata'
                ELSE 'Bronze'
            END;

            UPDATE public.loyalty_cards SET tier = v_new_tier WHERE id = v_card_id;

            INSERT INTO public.loyalty_transactions (
                loyalty_card_id, appointment_id, tx_type, points, description
            ) VALUES (
                v_card_id, NEW.id, 'earn', v_service_points,
                'Pontos acumulados: ' || v_service_name
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_credit_loyalty_points
    AFTER UPDATE ON public.appointments
    FOR EACH ROW EXECUTE FUNCTION public.credit_loyalty_points_on_completion();

