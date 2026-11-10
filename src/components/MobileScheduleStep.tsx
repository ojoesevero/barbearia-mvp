"use client";

import React, { useEffect, useState } from "react";
import {
  Clock,
  Coffee,
  CalendarCheck,
  CheckCircle2,
  Loader2,
  Save,
} from "lucide-react";

interface ScheduleRow {
  day_of_week: number;
  start_time: string;
  end_time: string;
  break_start: string;
  break_end: string;
  slot_interval_minutes: number;
  is_working: boolean;
}

const WEEKDAYS = [
  { num: 1, label: "Segunda-feira", short: "Seg" },
  { num: 2, label: "Terça-feira", short: "Ter" },
  { num: 3, label: "Quarta-feira", short: "Qua" },
  { num: 4, label: "Quinta-feira", short: "Qui" },
  { num: 5, label: "Sexta-feira", short: "Sex" },
  { num: 6, label: "Sábado", short: "Sáb" },
  { num: 0, label: "Domingo", short: "Dom" },
];

const INTERVALS = [20, 30, 40, 45, 60];

export default function MobileScheduleStep() {
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [startTime, setStartTime] = useState<string>("09:00");
  const [endTime, setEndTime] = useState<string>("20:00");
  const [breakStart, setBreakStart] = useState<string>("12:00");
  const [breakEnd, setBreakEnd] = useState<string>("13:00");
  const [slotInterval, setSlotInterval] = useState<number>(30);
  const [workingDays, setWorkingDays] = useState<number[]>([1, 2, 3, 4, 5, 6]);

  useEffect(() => {
    async function fetchSchedule() {
      setLoading(true);
      try {
        const res = await fetch("/api/schedules", { cache: "no-store" });
        const data = await res.json();
        if (Array.isArray(data.schedules) && data.schedules.length > 0) {
          const rows: ScheduleRow[] = data.schedules;
          const active = rows
            .filter((r) => r.is_working)
            .map((r) => r.day_of_week);
          setWorkingDays(active);

          const sample = rows.find((r) => r.is_working) || rows[0];
          if (sample) {
            setStartTime(sample.start_time || "09:00");
            // Ajusta para 20:00 caso ainda estivesse 19:00 do seed antigo
            setEndTime(
              sample.end_time === "19:00" ? "20:00" : sample.end_time || "20:00"
            );
            setBreakStart(sample.break_start || "12:00");
            setBreakEnd(sample.break_end || "13:00");
            setSlotInterval(sample.slot_interval_minutes || 30);
          }
        }
      } catch {
        // Mantém padrão Seg a Sáb 09:00 às 20:00
      } finally {
        setLoading(false);
      }
    }
    fetchSchedule();
  }, []);

  function toggleDay(dayNum: number) {
    setWorkingDays((prev) =>
      prev.includes(dayNum)
        ? prev.filter((d) => d !== dayNum)
        : [...prev, dayNum]
    );
  }

  async function handleSaveSchedule(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/schedules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start_time: startTime,
          end_time: endTime,
          break_start: breakStart,
          break_end: breakEnd,
          slot_interval_minutes: slotInterval,
          working_days: workingDays,
        }),
      });

      if (res.ok) {
        setFeedback("Expediente salvo no Supabase com sucesso!");
        setTimeout(() => setFeedback(null), 3500);
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="py-16 text-center text-xs text-zinc-400 flex flex-col items-center gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
        Carregando expediente do banco...
      </div>
    );
  }

  return (
    <form onSubmit={handleSaveSchedule} className="space-y-5">
      {/* Bloco 1: Horário de Abertura e Fechamento */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-4 shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            Horário da Barbearia
          </h2>
          <span className="text-[11px] text-amber-400 font-semibold">
            {startTime} às {endTime}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">
              Abre às
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-3 text-base font-extrabold text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">
              Fecha às
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-3 text-base font-extrabold text-amber-400 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Intervalo de Almoço */}
        <div className="pt-2 border-t border-zinc-800/80">
          <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5 mb-2">
            <Coffee className="w-3.5 h-3.5 text-amber-400" />
            Pausa para Almoço (Bloqueia automático na agenda)
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="block text-[11px] text-zinc-500 mb-1">
                Início do almoço
              </span>
              <input
                type="time"
                value={breakStart}
                onChange={(e) => setBreakStart(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm font-bold text-zinc-200 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <span className="block text-[11px] text-zinc-500 mb-1">
                Volta do almoço
              </span>
              <input
                type="time"
                value={breakEnd}
                onChange={(e) => setBreakEnd(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm font-bold text-zinc-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Tempo padrão entre horários */}
        <div className="pt-2 border-t border-zinc-800/80">
          <label className="block text-xs text-zinc-400 mb-2">
            Intervalo da agenda (de quanto em quanto tempo abre vaga)
          </label>
          <div className="grid grid-cols-5 gap-1.5">
            {INTERVALS.map((min) => (
              <button
                key={min}
                type="button"
                onClick={() => setSlotInterval(min)}
                className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                  slotInterval === min
                    ? "bg-amber-500 border-amber-400 text-zinc-950"
                    : "bg-zinc-950 border-zinc-800 text-zinc-400"
                }`}
              >
                {min}m
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bloco 2: Dias de Funcionamento (Toque Rápido Liga/Desliga) */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3 shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <CalendarCheck className="w-4 h-4 text-amber-400" />
            Dias que Você Atende
          </h2>
          <span className="text-[11px] text-zinc-400">
            Toque para ligar/desligar
          </span>
        </div>

        <div className="space-y-2">
          {WEEKDAYS.map((day) => {
            const isOpen = workingDays.includes(day.num);
            return (
              <button
                key={day.num}
                type="button"
                onClick={() => toggleDay(day.num)}
                className={`w-full p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                  isOpen
                    ? "bg-zinc-950 border-emerald-500/40 text-white"
                    : "bg-zinc-950/40 border-zinc-800/60 text-zinc-500"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      isOpen ? "bg-emerald-400" : "bg-zinc-700"
                    }`}
                  />
                  <span className="text-sm font-bold">{day.label}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-semibold ${
                      isOpen ? "text-emerald-400" : "text-zinc-600"
                    }`}
                  >
                    {isOpen ? `${startTime} às ${endTime}` : "Fechado / Folga"}
                  </span>
                  <div
                    className={`w-10 h-6 rounded-full p-1 transition-colors flex items-center ${
                      isOpen
                        ? "bg-emerald-500 justify-end"
                        : "bg-zinc-800 justify-start"
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-white shadow" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Botão Salvar Expediente */}
      <button
        type="submit"
        disabled={saving}
        className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-zinc-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
      >
        {saving ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Salvando Horários...
          </>
        ) : (
          <>
            <Save className="w-4 h-4" />
            Salvar Meu Expediente
          </>
        )}
      </button>

      {feedback && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {feedback}
        </div>
      )}
    </form>
  );
}

