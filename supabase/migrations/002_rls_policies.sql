-- ============================================================================
-- Migration: 002_rls_policies.sql
-- Description: Políticas de Row Level Security (RLS) e Realtime no Supabase
-- ============================================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barber_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLÍTICAS DE LEITURA PÚBLICA (Catálogo de Serviços, Barbeiros, Horários e Recompensas)
-- ============================================================================
CREATE POLICY "Serviços ativos são visíveis publicamente"
    ON public.services FOR SELECT
    USING (is_active = true);

CREATE POLICY "Barbeiros ativos são visíveis publicamente"
    ON public.barbers FOR SELECT
    USING (is_active = true);

CREATE POLICY "Horários dos barbeiros são visíveis publicamente"
    ON public.barber_schedules FOR SELECT
    USING (true);

CREATE POLICY "Recompensas de fidelidade visíveis publicamente"
    ON public.loyalty_rewards FOR SELECT
    USING (is_active = true);

-- ============================================================================
-- POLÍTICAS PARA PROFILES E AGENDAMENTOS (MVP + Auth Supabase)
-- ============================================================================
CREATE POLICY "Leitura de perfis para usuários autenticados e MVP"
    ON public.profiles FOR SELECT
    USING (true);

CREATE POLICY "Cadastro público de novos clientes"
    ON public.profiles FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Atualização do próprio perfil"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = auth_user_id OR auth.role() = 'service_role');

CREATE POLICY "Visualização de agendamentos"
    ON public.appointments FOR SELECT
    USING (true);

CREATE POLICY "Criação de novos agendamentos"
    ON public.appointments FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Atualização de agendamentos"
    ON public.appointments FOR UPDATE
    USING (true);

-- ============================================================================
-- POLÍTICAS PARA FIDELIDADE E CHAT
-- ============================================================================
CREATE POLICY "Visualização do cartão de fidelidade"
    ON public.loyalty_cards FOR SELECT
    USING (true);

CREATE POLICY "Visualização do extrato de fidelidade"
    ON public.loyalty_transactions FOR SELECT
    USING (true);

CREATE POLICY "Acesso às salas de chat"
    ON public.chat_rooms FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Acesso e envio de mensagens no chat"
    ON public.chat_messages FOR ALL
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- SUPABASE REALTIME (Habilita eventos em tempo real para Chat e Agenda)
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;

