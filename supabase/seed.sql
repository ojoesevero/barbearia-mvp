-- ============================================================================
-- Seed: seed.sql
-- Description: Dados iniciais para testes locais e homologação no Supabase
-- ============================================================================

-- 1. Perfis dos Barbeiros
INSERT INTO public.profiles (id, full_name, phone, email, role, whatsapp_opt_in)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'Rafael "Navalha" Mendes', '+5511988881111', 'rafael@barbeariamvp.com', 'barber', true),
    ('22222222-2222-2222-2222-222222222222', 'Lucas Oliveira', '+5511988882222', 'lucas@barbeariamvp.com', 'barber', true),
    ('33333333-3333-3333-3333-333333333333', 'Matheus Costa', '+5511988883333', 'matheus@barbeariamvp.com', 'barber', true),
    ('44444444-4444-4444-4444-444444444444', 'Carlos Eduardo Silva', '+5511977774444', 'carlos.cliente@email.com', 'client', true)
ON CONFLICT (phone) DO NOTHING;

-- 2. Registro dos Barbeiros
INSERT INTO public.barbers (id, profile_id, specialty, bio, rating, commission_rate)
VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Degradê Navalhado & Barba Terapia', 'Mestre barbeiro com 10 anos de experiência em cortes clássicos e modernos.', 4.95, 50.00),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'Corte Social, Tesoura & Visagismo', 'Especialista em visagismo masculino e acabamento na tesoura.', 4.90, 50.00),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333', 'Freestyle, Pigmentação & Platinado', 'Referência em cortes urbanos, platinado e alinhamento de barba.', 4.88, 45.00)
ON CONFLICT (id) DO NOTHING;

-- 3. Grade de Horários (Segunda a Sábado, das 09:00 às 20:00)
INSERT INTO public.barber_schedules (barber_id, day_of_week, start_time, end_time, break_start, break_end, slot_interval_minutes, is_working)
SELECT b.id, d.day_num, '09:00:00', '20:00:00', '12:00:00', '13:00:00', 30, true
FROM public.barbers b
CROSS JOIN (SELECT generate_series(1, 6) AS day_num) d
ON CONFLICT (barber_id, day_of_week) DO UPDATE SET end_time = '20:00:00';

-- 4. Catálogo de Serviços da Barbearia
INSERT INTO public.services (id, name, category, description, price, duration_minutes, loyalty_points)
VALUES
    ('d1111111-1111-1111-1111-111111111111', 'Corte Degradê / Clássico', 'Cabelo', 'Corte personalizado com lavagem, finalização com pomada e acabamento na navalha.', 55.00, 40, 20),
    ('d2222222-2222-2222-2222-222222222222', 'Barba Terapia (Toalha Quente)', 'Barba', 'Modelagem completa de barba com vapor de ozônio, toalha quente e óleo hidratante.', 45.00, 30, 15),
    ('d3333333-3333-3333-3333-333333333333', 'Combo VIP (Cabelo + Barba + Sobrancelha)', 'Combo', 'Pacote completo de renovação visual com massagem facial e bebida cortesia.', 95.00, 60, 40),
    ('d4444444-4444-4444-4444-444444444444', 'Acabamento (Pezinho & Sobrancelha)', 'Estética', 'Manutenção rápida do contorno do corte e alinhamento de sobrancelha na navalha.', 25.00, 15, 10),
    ('d5555555-5555-5555-5555-555555555555', 'Selagem / Hidratação Profunda', 'Estética', 'Tratamento capilar reconstrutor para redução de volume e brilho intenso.', 70.00, 45, 25),
    ('d6666666-6666-6666-6666-666666666666', 'Corte Infantil (Até 10 anos)', 'Cabelo', 'Corte cuidadoso para crianças com atendimento especializado.', 45.00, 30, 15)
ON CONFLICT (id) DO NOTHING;

-- 5. Catálogo de Recompensas do Plano de Fidelidade
INSERT INTO public.loyalty_rewards (id, title, description, points_cost, service_id)
VALUES
    ('e1111111-1111-1111-1111-111111111111', 'Sobrancelha + Pezinho Grátis', 'Resgate um acabamento completo por conta da casa.', 50, 'd4444444-4444-4444-4444-444444444444'),
    ('e2222222-2222-2222-2222-222222222222', 'Barba Terapia Cortesia', 'Uma sessão completa de Barba Terapia com toalha quente.', 100, 'd2222222-2222-2222-2222-222222222222'),
    ('e3333333-3333-3333-3333-333333333333', 'Corte Clássico / Degradê 100% OFF', 'Seu próximo corte sai totalmente grátis ao atingir 150 pontos.', 150, 'd1111111-1111-1111-1111-111111111111'),
    ('e4444444-4444-4444-4444-444444444444', 'Combo VIP Experiência Completa', 'Cabelo + Barba + Sobrancelha + Cerveja Artesanal.', 240, 'd3333333-3333-3333-3333-333333333333')
ON CONFLICT (id) DO NOTHING;

-- 6. Atualiza saldo inicial do cliente de demonstração
UPDATE public.loyalty_cards
SET points_balance = 120, total_points_earned = 180, stamps_count = 7, tier = 'Prata'
WHERE client_id = '44444444-4444-4444-4444-444444444444';

