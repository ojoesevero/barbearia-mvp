"""Serviço de cálculo de disponibilidade de horários na agenda dos barbeiros."""

from datetime import datetime, timedelta
from typing import Dict, List


def generate_daily_slots(
    start_time_str: str = "09:00",
    end_time_str: str = "19:00",
    break_start_str: str = "12:00",
    break_end_str: str = "13:00",
    interval_minutes: int = 30,
    booked_slots: List[str] | None = None,
) -> List[Dict[str, object]]:
    """
    Calcula os horários disponíveis do barbeiro no dia, descontando intervalo de almoço
    e agendamentos já confirmados.
    """
    booked = set(booked_slots or [])
    fmt = "%H:%M"
    current = datetime.strptime(start_time_str, fmt)
    end = datetime.strptime(end_time_str, fmt)
    break_start = datetime.strptime(break_start_str, fmt)
    break_end = datetime.strptime(break_end_str, fmt)

    slots: List[Dict[str, object]] = []
    delta = timedelta(minutes=interval_minutes)

    while current + delta <= end:
        slot_str = current.strftime(fmt)
        in_lunch_break = break_start <= current < break_end
        if not in_lunch_break:
            slots.append(
                {
                    "time": slot_str,
                    "available": slot_str not in booked,
                }
            )
        current += delta

    return slots
