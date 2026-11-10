"use client";

import React, { useEffect, useState } from "react";
import {
  User,
  Phone,
  ArrowRight,
  Scissors,
  Calendar,
  Clock,
  CheckCircle2,
  Loader2,
  Award,
  RefreshCw,
} from "lucide-react";

interface ServiceItem {
  id: string;
  name: string;
  category: string;
  price: number;
  duration_minutes: number;
}

interface IdentifiedClient {
  id: string;
  full_name: string;
  phone: string;
}

interface SlotItem {
  time: string;
  available: boolean;
}

function getTodayOrNextWorkdayISO(): string {
  const d = new Date();
  if (d.getDay() === 0) {
    d.setDate(d.getDate() + 1);
  }
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function MobileClientBookingStep({
  services,
}: {
  services: ServiceItem[];
}) {
  // Etapa 1: Cadastro prévio (Nome + Telefone)
  const [clientName, setClientName] = useState<string>("");
  const [clientPhone, setClientPhone] = useState<string>("");
  const [identifying, setIdentifying] = useState<boolean>(false);
  const [identifiedClient, setIdentifiedClient] =
    useState<IdentifiedClient | null>(null);
  const [loyaltyPoints, setLoyaltyPoints] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Etapa 2: Escolha de Serviço, Data e Horário
  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    services[0]?.id || ""
  );
  const [selectedDate, setSelectedDate] = useState<string>(() =>
    getTodayOrNextWorkdayISO()
  );
  const [slots, setSlots] = useState<SlotItem[]>([]);
  const [isWorkingDay, setIsWorkingDay] = useState<boolean>(true);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [booking, setBooking] = useState<boolean>(false);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Etapa 3: Comprovante de Agendamento Confirmado
  const [confirmedReceipt, setConfirmedReceipt] = useState<{
    serviceName: string;
    price: number;
    date: string;
    time: string;
    endTime: string;
  } | null>(null);

  useEffect(() => {
    if (!selectedServiceId && services.length > 0) {
      setSelectedServiceId(services[0].id);
    }
  }, [services, selectedServiceId]);

  const currentService = services.find((s) => s.id === selectedServiceId);
  const currentDuration = currentService?.duration_minutes || 30;

  useEffect(() => {
    if (!identifiedClient) return;
    let active = true;
    async function loadSlots() {
      setLoadingSlots(true);
      try {
        const res = await fetch(
          `/api/client-booking?date=${encodeURIComponent(
            selectedDate
          )}&duration=${currentDuration}&t=${refreshTrigger}`,
          { cache: "no-store" }
        );
        const data = await res.json();
        if (!active) return;
        setIsWorkingDay(Boolean(data.is_working));
        const fetchedSlots: SlotItem[] = data.slots || [];
        setSlots(fetchedSlots);
        const firstFree = fetchedSlots.find((s) => s.available);
        setSelectedTime(firstFree ? firstFree.time : "");
      } finally {
        if (active) setLoadingSlots(false);
      }
    }
    loadSlots();
    return () => {
      active = false;
    };
  }, [identifiedClient, selectedDate, currentDuration, refreshTrigger]);

  async function handleIdentifyClient(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setIdentifying(true);

    try {
      const res = await fetch("/api/client-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "identify",
          full_name: clientName,
          phone: clientPhone,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Erro ao cadastrar cliente.");
      } else {
        setIdentifiedClient(data.client);
        setLoyaltyPoints(data.loyalty?.points_balance || 0);
      }
    } catch {
      setErrorMsg("Falha de conexão ao salvar cadastro.");
    } finally {
      setIdentifying(false);
    }
  }

  async function handleConfirmBooking() {
    if (!identifiedClient || !selectedServiceId || !selectedTime) return;
    setBooking(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/client-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "book",
          client_id: identifiedClient.id,
          service_id: selectedServiceId,
          appointment_date: selectedDate,
          start_time: selectedTime,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Não foi possível agendar este horário.");
        // Atualiza grade imediatamente se houve conflito
        setRefreshTrigger((prev) => prev + 1);
      } else {
        setConfirmedReceipt({
          serviceName: data.service.name,
          price: Number(data.service.price),
          date: selectedDate.split("-").reverse().join("/"),
          time: selectedTime,
          endTime: String(data.appointment.end_time || "").slice(0, 5),
        });
        setRefreshTrigger((prev) => prev + 1);
      }
    } finally {
      setBooking(false);
    }
  }

  // ============================================================================
  // TELA 1: CADASTRO PRÉVIO OBRIGATÓRIO (NOME E TELEFONE)
  // ============================================================================
  if (!identifiedClient) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-5 shadow-xl">
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-2">
            <User className="w-6 h-6" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
            Link de Agendamento Online
          </span>
          <h2 className="text-xl font-extrabold text-white">
            Identifique-se para Agendar
          </h2>
          <p className="text-xs text-zinc-400">
            Informe seu nome e WhatsApp para ver os serviços e horários disponíveis.
          </p>
        </div>

        <form onSubmit={handleIdentifyClient} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Seu Nome *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                placeholder="Ex: João Henrique"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Seu WhatsApp (com DDD) *
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
              <input
                type="tel"
                required
                placeholder="Ex: 11999998888"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={identifying}
            className="w-full py-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
          >
            {identifying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Entrando...
              </>
            ) : (
              <>
                Ver Serviços e Horários
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    );
  }

  // ============================================================================
  // TELA 3: COMPROVANTE DE AGENDAMENTO CONFIRMADO
  // ============================================================================
  if (confirmedReceipt) {
    return (
      <div className="bg-zinc-900 border border-emerald-500/40 rounded-2xl p-6 text-center space-y-5 shadow-xl">
        <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
            Tudo Certo, {identifiedClient.full_name}!
          </span>
          <h2 className="text-xl font-extrabold text-white mt-1">
            Horário Agendado com Sucesso!
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Seu horário já foi bloqueado na agenda do barbeiro.
          </p>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-left space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-zinc-400">Cliente:</span>
            <strong className="text-white">{identifiedClient.full_name}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">WhatsApp:</span>
            <strong className="text-zinc-200">{identifiedClient.phone}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Serviço:</span>
            <strong className="text-amber-400">
              {confirmedReceipt.serviceName}
            </strong>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Data e Período Reservado:</span>
            <strong className="text-emerald-400">
              {confirmedReceipt.date} ({confirmedReceipt.time} às{" "}
              {confirmedReceipt.endTime})
            </strong>
          </div>
          <div className="flex justify-between pt-2 border-t border-zinc-800">
            <span className="text-zinc-400">Valor a pagar na barbearia:</span>
            <strong className="text-base text-white">
              R$ {confirmedReceipt.price.toFixed(2).replace(".", ",")}
            </strong>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setConfirmedReceipt(null);
            setRefreshTrigger((prev) => prev + 1);
          }}
          className="w-full py-3.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Fazer Outro Agendamento
        </button>
      </div>
    );
  }

  // ============================================================================
  // TELA 2: ESCOLHER SERVIÇO + DIA + HORÁRIO LIVRE
  // ============================================================================
  return (
    <div className="space-y-5">
      {/* Barra do Cliente Identificado */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center justify-center shrink-0">
            {identifiedClient.full_name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-white truncate">
              Olá, {identifiedClient.full_name}
            </p>
            <p className="text-[11px] text-zinc-400 flex items-center gap-2">
              <span>{identifiedClient.phone}</span>
              <span className="text-amber-400 font-semibold flex items-center gap-0.5">
                <Award className="w-3 h-3" /> {loyaltyPoints} pts
              </span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIdentifiedClient(null)}
          className="text-[11px] text-zinc-400 hover:text-white underline shrink-0"
        >
          Trocar
        </button>
      </div>

      {/* 1. Escolher Serviço */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
          <Scissors className="w-3.5 h-3.5" />
          1. Escolha o Serviço
        </h3>

        {services.length === 0 ? (
          <p className="text-xs text-zinc-400 py-4 text-center">
            Nenhum serviço cadastrado ainda. Cadastre na aba 1. Serviços!
          </p>
        ) : (
          <div className="space-y-2">
            {services.map((service) => {
              const isSelected = selectedServiceId === service.id;
              return (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => {
                    setSelectedServiceId(service.id);
                    setErrorMsg(null);
                  }}
                  className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                    isSelected
                      ? "bg-amber-500/15 border-amber-500 text-white"
                      : "bg-zinc-950 border-zinc-800 text-zinc-300"
                  }`}
                >
                  <div>
                    <p className="text-sm font-bold">{service.name}</p>
                    <span className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" /> {service.duration_minutes}{" "}
                      min • {service.category}
                    </span>
                  </div>
                  <span className="text-sm font-extrabold text-amber-400">
                    R$ {Number(service.price).toFixed(2).replace(".", ",")}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Escolher Data e Horário Livre */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            2. Escolha o Dia e Horário ({currentDuration} min)
          </h3>
        </div>

        <input
          type="date"
          value={selectedDate}
          onChange={(e) => {
            setSelectedDate(e.target.value);
            setErrorMsg(null);
          }}
          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-amber-500"
        />

        {loadingSlots ? (
          <div className="py-8 text-center text-xs text-zinc-400 flex flex-col items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
            Verificando disponibilidade real no banco...
          </div>
        ) : !isWorkingDay ? (
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-center text-xs text-zinc-400">
            Neste dia a barbearia está fechada. Escolha outro dia acima!
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {slots.map((slot) => {
              const isSelected = selectedTime === slot.time && slot.available;
              return (
                <button
                  key={slot.time}
                  type="button"
                  disabled={!slot.available}
                  onClick={() => setSelectedTime(slot.time)}
                  className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                    !slot.available
                      ? "bg-zinc-950/40 border-zinc-800/40 text-zinc-600 line-through cursor-not-allowed"
                      : isSelected
                      ? "bg-amber-500 border-amber-400 text-zinc-950 shadow-md"
                      : "bg-zinc-950 border-zinc-800 text-zinc-200"
                  }`}
                >
                  {slot.time}
                </button>
              );
            })}
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}

        <button
          type="button"
          disabled={booking || !isWorkingDay || !selectedTime}
          onClick={handleConfirmBooking}
          className="w-full py-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 disabled:text-zinc-500 text-zinc-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
        >
          {booking ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Confirmando...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Confirmar Agendamento {selectedTime ? `às ${selectedTime}` : ""}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
