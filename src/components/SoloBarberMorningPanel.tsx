"use client";

import React, { useState } from "react";
import {
  Sun,
  Scissors,
  DollarSign,
  Clock,
  CheckCircle2,
  PlusCircle,
  Lock,
  Unlock,
  Smartphone,
  Calendar,
  UserCheck,
  Sparkles,
} from "lucide-react";
import { BarberAppointmentItem, BarbershopService } from "@/types/barbershop";
import { WORKING_HOURS_SLOTS } from "@/services/api";

interface SoloBarberMorningPanelProps {
  selectedDate: string;
  onChangeDate: (date: string) => void;
  appointments: BarberAppointmentItem[];
  services: BarbershopService[];
  onCompleteAppointment: (appointmentId: string) => void;
  onCancelAppointment: (appointmentId: string) => void;
  onQuickWalkIn: (time: string, clientName: string, service: BarbershopService) => void;
}

export default function SoloBarberMorningPanel({
  selectedDate,
  onChangeDate,
  appointments,
  services,
  onCompleteAppointment,
  onCancelAppointment,
  onQuickWalkIn,
}: SoloBarberMorningPanelProps) {
  const [blockedTimes, setBlockedTimes] = useState<string[]>([]);
  const [filterMode, setFilterMode] = useState<"all" | "booked">("all");
  const [walkInSlot, setWalkInSlot] = useState<string | null>(null);
  const [walkInName, setWalkInName] = useState<string>("");
  const [walkInServiceId, setWalkInServiceId] = useState<string>(services[0].id);

  const dayAppointments = appointments.filter(
    (a) => a.date === selectedDate && a.status !== "cancelled"
  );

  const completedCount = dayAppointments.filter(
    (a) => a.status === "completed"
  ).length;
  const confirmedCount = dayAppointments.filter(
    (a) => a.status === "confirmed"
  ).length;

  const totalExpectedRevenue = dayAppointments.reduce(
    (sum, a) => sum + a.price,
    0
  );
  const realizedRevenue = dayAppointments
    .filter((a) => a.status === "completed")
    .reduce((sum, a) => sum + a.price, 0);

  const nextAppointment = dayAppointments
    .filter((a) => a.status === "confirmed")
    .sort((a, b) => a.time.localeCompare(b.time))[0];

  const occupiedTimes = new Set([
    ...dayAppointments.map((a) => a.time),
    ...blockedTimes,
  ]);
  const freeSlotsCount = WORKING_HOURS_SLOTS.filter(
    (t) => !occupiedTimes.has(t)
  ).length;

  function toggleBlockSlot(time: string) {
    setBlockedTimes((prev) =>
      prev.includes(time) ? prev.filter((t) => t !== time) : [...prev, time]
    );
  }

  function handleSaveWalkIn(e: React.FormEvent) {
    e.preventDefault();
    if (!walkInSlot) return;
    const chosenService =
      services.find((s) => s.id === walkInServiceId) || services[0];
    onQuickWalkIn(
      walkInSlot,
      walkInName.trim() || "Cliente Presencial (Encaixe)",
      chosenService
    );
    setWalkInSlot(null);
    setWalkInName("");
  }

  const slotsToRender =
    filterMode === "booked"
      ? WORKING_HOURS_SLOTS.filter((t) =>
          dayAppointments.some((a) => a.time === t)
        )
      : WORKING_HOURS_SLOTS;

  return (
    <div className="space-y-6">
      {/* Cabeçalho Matinal do Barbeiro Solitário */}
      <section className="bg-gradient-to-r from-amber-500/15 via-zinc-900 to-zinc-900 border border-amber-500/40 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full">
              <Sun className="w-3.5 h-3.5" />
              Modo Bancada • Barbeiro Solitário (Seg a Sáb • 09:00 às 20:00)
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
              Bom dia, Mestre! Aqui está o seu dia organizado.
            </h2>
            <p className="text-xs sm:text-sm text-zinc-300 mt-1">
              Olhe sua agenda na primeira hora da manhã e foque 100% na tesoura. O{" "}
              <strong className="text-emerald-400">Bot do WhatsApp</strong> está
              respondendo os clientes novos com o link automaticamente.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2">
              <label
                htmlFor="barber-day-picker"
                className="block text-[10px] uppercase text-zinc-400 font-bold"
              >
                Dia da Agenda
              </label>
              <input
                id="barber-day-picker"
                type="date"
                value={selectedDate}
                onChange={(e) => onChangeDate(e.target.value)}
                className="bg-transparent text-sm font-bold text-white focus:outline-none"
              />
            </div>

            <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-xl px-4 py-2.5 flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <div>
                <span className="block text-[10px] uppercase text-emerald-300 font-bold">
                  Piloto Automático WhatsApp
                </span>
                <span className="text-xs font-extrabold text-white flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                  Enviando Link no &ldquo;Oi&rdquo;
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 KPIs Matinais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="bg-zinc-950/90 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>Cortes Agendados Hoje</span>
              <Scissors className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-extrabold text-white mt-1">
              {dayAppointments.length} clientes
            </p>
            <p className="text-[11px] text-emerald-400 mt-1">
              {completedCount} concluído(s) • {confirmedCount} na fila
            </p>
          </div>

          <div className="bg-zinc-950/90 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>Caixa Previsto do Dia</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-extrabold text-emerald-400 mt-1">
              R$ {totalExpectedRevenue.toFixed(2).replace(".", ",")}
            </p>
            <p className="text-[11px] text-zinc-400 mt-1">
              Já realizado hoje: R$ {realizedRevenue.toFixed(2).replace(".", ",")}
            </p>
          </div>

          <div className="bg-zinc-950/90 border border-amber-500/40 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-amber-400 font-bold">
              <span>Próximo na Cadeira</span>
              <UserCheck className="w-4 h-4" />
            </div>
            {nextAppointment ? (
              <>
                <p className="text-lg font-extrabold text-white mt-1 truncate">
                  {nextAppointment.time} — {nextAppointment.client_name}
                </p>
                <p className="text-[11px] text-amber-300 truncate mt-0.5">
                  {nextAppointment.service_name} (R${" "}
                  {nextAppointment.price.toFixed(2).replace(".", ",")})
                </p>
              </>
            ) : (
              <p className="text-sm font-bold text-zinc-400 mt-2">
                Nenhum cliente pendente na fila!
              </p>
            )}
          </div>

          <div className="bg-zinc-950/90 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>Horários Livres (09h–20h)</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-extrabold text-white mt-1">
              {freeSlotsCount} vagas
            </p>
            <p className="text-[11px] text-zinc-400 mt-1">
              Abertas no link do cliente agora
            </p>
          </div>
        </div>
      </section>

      {/* Grade Cronológica de Bancada: 09:00 às 20:00 */}
      <section className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-400" />
              Linha do Tempo do Dia (09:00 às 20:00 • Segunda a Sábado)
            </h3>
            <p className="text-xs text-zinc-400">
              Toque em <strong>Concluir Corte</strong> quando terminar para somar no caixa e dar os pontos de fidelidade ao cliente.
            </p>
          </div>

          <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-xl p-1 text-xs">
            <button
              type="button"
              onClick={() => setFilterMode("all")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                filterMode === "all"
                  ? "bg-amber-500 text-zinc-950"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Todos os Horários (09h–20h)
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("booked")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                filterMode === "booked"
                  ? "bg-amber-500 text-zinc-950"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Apenas Agendados ({dayAppointments.length})
            </button>
          </div>
        </div>

        {/* Modal inline rápido de Encaixe Presencial */}
        {walkInSlot && (
          <form
            onSubmit={handleSaveWalkIn}
            className="mb-5 bg-zinc-950 border border-amber-500 rounded-xl p-4 flex flex-col sm:flex-row items-end gap-3"
          >
            <div className="w-full sm:flex-1">
              <label className="block text-xs font-bold text-amber-400 mb-1">
                Encaixe Rápido às {walkInSlot} — Nome do Cliente
              </label>
              <input
                type="text"
                required
                placeholder="Ex: João (Cliente de porta)"
                value={walkInName}
                onChange={(e) => setWalkInName(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="w-full sm:w-64">
              <label className="block text-xs font-bold text-zinc-400 mb-1">
                Serviço
              </label>
              <select
                value={walkInServiceId}
                onChange={(e) => setWalkInServiceId(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — R$ {s.price.toFixed(2)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <button
                type="submit"
                className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs px-4 py-2 rounded-lg"
              >
                Salvar Encaixe
              </button>
              <button
                type="button"
                onClick={() => setWalkInSlot(null)}
                className="bg-zinc-800 text-zinc-300 text-xs px-3 py-2 rounded-lg"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        <div className="space-y-2.5">
          {slotsToRender.map((time) => {
            const appt = dayAppointments.find((a) => a.time === time);
            const isBlocked = blockedTimes.includes(time);

            if (appt) {
              const isCompleted = appt.status === "completed";
              return (
                <div
                  key={time}
                  className={`rounded-xl p-4 border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                    isCompleted
                      ? "bg-emerald-950/25 border-emerald-500/30"
                      : "bg-zinc-950 border-amber-500/40 shadow-md"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`px-3 py-2 rounded-lg font-extrabold text-sm ${
                        isCompleted
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-amber-500 text-zinc-950"
                      }`}
                    >
                      {time}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-white text-sm">
                          {appt.client_name}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
                          {appt.origin === "whatsapp_link"
                            ? "📲 Agendou pelo Link WhatsApp"
                            : "💈 Encaixe na Barbearia"}
                        </span>
                        {isCompleted && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            Concluído (+{appt.loyalty_points} pts fidelidade)
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {appt.service_name} •{" "}
                        <strong className="text-amber-400">
                          R$ {appt.price.toFixed(2).replace(".", ",")}
                        </strong>{" "}
                        • {appt.duration_minutes} min • Tel: {appt.client_phone}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isCompleted ? (
                      <>
                        <button
                          type="button"
                          onClick={() => onCompleteAppointment(appt.id)}
                          className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Concluir Corte
                        </button>
                        <button
                          type="button"
                          onClick={() => onCancelAppointment(appt.id)}
                          className="bg-zinc-800 hover:bg-rose-950 hover:text-rose-300 text-zinc-400 text-xs px-3 py-2.5 rounded-xl transition-all"
                        >
                          Liberar Vaga
                        </button>
                      </>
                    ) : (
                      <span className="text-xs font-bold text-emerald-400 px-3 py-1.5">
                        ✓ Pago & Pontuado
                      </span>
                    )}
                  </div>
                </div>
              );
            }

            return (
              <div
                key={time}
                className={`rounded-xl px-4 py-2.5 border flex items-center justify-between text-xs ${
                  isBlocked
                    ? "bg-zinc-950/30 border-zinc-800/40 text-zinc-600"
                    : "bg-zinc-950/60 border-zinc-800/80 text-zinc-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-sm text-zinc-400">
                    {time}
                  </span>
                  <span
                    className={
                      isBlocked ? "text-rose-400/80 font-medium" : "text-emerald-400"
                    }
                  >
                    {isBlocked
                      ? "🔒 Horário Bloqueado pelo Barbeiro (Pausa)"
                      : "🟢 Horário Livre (Visível no Link do Cliente)"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {!isBlocked && (
                    <button
                      type="button"
                      onClick={() => setWalkInSlot(time)}
                      className="bg-zinc-800 hover:bg-zinc-700 text-amber-400 font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      Encaixe
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleBlockSlot(time)}
                    className="bg-zinc-900 hover:bg-zinc-800 text-zinc-400 px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-all"
                  >
                    {isBlocked ? (
                      <>
                        <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                        Desbloquear
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        Bloquear
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

