-- ============================================================================
-- Migration: 003_prevent_overlapping_appointments.sql
-- Description: Trava de banco de dados (Trigger PL/pgSQL) que impede dois
--              agendamentos do mesmo barbeiro se sobreporem no mesmo horário.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.prevent_appointment_overlap()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status != 'cancelled' THEN
        IF EXISTS (
            SELECT 1
            FROM public.appointments a
            WHERE a.barber_id = NEW.barber_id
              AND a.appointment_date = NEW.appointment_date
              AND a.status != 'cancelled'
              AND a.id IS DISTINCT FROM NEW.id
              AND a.start_time < NEW.end_time
              AND a.end_time > NEW.start_time
        ) THEN
            RAISE EXCEPTION 'Conflito de agenda: O barbeiro já possui um atendimento que colide com o intervalo % - % na data %.',
                NEW.start_time, NEW.end_time, NEW.appointment_date;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_appointment_overlap ON public.appointments;

CREATE TRIGGER trg_prevent_appointment_overlap
    BEFORE INSERT OR UPDATE ON public.appointments
    FOR EACH ROW EXECUTE FUNCTION public.prevent_appointment_overlap();

