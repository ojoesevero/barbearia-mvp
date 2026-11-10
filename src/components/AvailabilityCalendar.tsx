"use client";

import React, { useEffect, useState } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  UserCheck,
  MessageSquareShare,
  CheckCircle2,
  Star,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { Barber, BarbershopService, TimeSlot } from "@/types/barbershop";
import {
  fetchBarberAvailability,
  isSundayDate,
  sendWhatsAppNotification,
} from "@/services/api";

interface AvailabilityCalendarProps {
  barbers: Barber[];
  selectedService: BarbershopService;
  selectedDate: string;
  onChangeDate: (date: string) => void;
  bookedTimesForDay: string[];
  clientName: string;
  clientPhone: string;
  onAppointmentBooked: (booking: {
    barberId: string;
    date: string;
    time: string;
    service: BarbershopService;
  }) => void;
}

export default function AvailabilityCalendar({
  barbers,
  selectedService,
  selectedDate,
  onChangeDate,
  bookedTimesForDay,
  clientName,
  clientPhone,
  onAppointmentBooked,
}: AvailabilityCalendarProps) {
  const [selectedBarber, setSelectedBarber] = useState<Barber>(barbers[0]);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedTime, setSelectedTime] = useState<string>("14:00");
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [bookingStatus, setBookingStatus] = useState<{
    confirmed: boolean;
    whatsappPreview: string;
  } | null>(null);

  const isSunday = isSundayDate(selectedDate);

  useEffect(() => {
    let active = true;
    setLoadingSlots(true);
    fetchBarberAvailability(
      selectedBarber.id,
      selectedDate,
      bookedTimesForDay
    ).then((data) => {
      if (!active) return;
      setSlots(data);
      const firstAvailable = data.find((s) => s.available);
      if (firstAvailable) setSelectedTime(firstAvailable.time);
      setLoadingSlots(false);
    });
    return () => {
      active = false;
    };
  }, [selectedBarber, selectedDate, bookedTimesForDay]);

  async function handleConfirmBooking() {
    if (isSunday) return;
    const formattedDate = selectedDate.split("-").reverse().join("/");
    const whatsappResult = await sendWhatsAppNotification({
      phone: clientPhone || "+5511977774444",
      client_name: clientName || "Cliente VIP",
      template_type: "confirmation",
      appointment_date: formattedDate,
      appointment_time: selectedTime,
      barber_name: selectedBarber.name,
      service_name: selectedService.name,
    });

    setSlots((prev) =>
      prev.map((slot) =>
        slot.time === selectedTime ? { ...slot, available: false } : slot
      )
    );

    setBookingStatus({
      confirmed: true,
      whatsappPreview: whatsappResult.message_preview,
    });

    onAppointmentBooked({
      barberId: selectedBarber.id,
      date: selectedDate,
      time: selectedTime,
      service: selectedService,
    });
  }

  return (
    <section className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-amber-400 text-sm font-semibold uppercase tracking-wider">
          <CalendarIcon className="w-4 h-4" />
          <span>Horários em Tempo Real</span>
        </div>
        <span className="text-[11px] bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded-full font-medium">
          Seg a Sáb • 09:00 às 20:00
        </span>
      </div>
      <h2 className="text-2xl font-bold text-white mt-1 mb-5">
        Veja o Melhor Horário para Você
      </h2>

      {/* 1. Seleção do Barbeiro */}
      <div className="mb-6">
        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2.5">
          1. Escolha o Profissional
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {barbers.map((barber) => {
            const isSelected = selectedBarber.id === barber.id;
            return (
              <button
                key={barber.id}
                type="button"
                onClick={() => {
                  setSelectedBarber(barber);
                  setBookingStatus(null);
                }}
                className={`p-3.5 rounded-xl border text-left transition-all flex items-center gap-3 ${
                  isSelected
                    ? "bg-amber-500/15 border-amber-500 text-white"
                    : "bg-zinc-950/70 border-zinc-800 text-zinc-300 hover:border-zinc-700"
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-bold text-amber-300 text-sm shrink-0">
                  {barber.avatar_initials}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate">{barber.name}</p>
                  <p className="text-[11px] text-zinc-400 truncate">
                    {barber.specialty}
                  </p>
                  <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-semibold mt-0.5">
                    <Star className="w-3 h-3 fill-amber-400" />
                    {barber.rating.toFixed(2)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Escolha da Data */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div>
          <label
            htmlFor="appointment-date"
            className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2"
          >
            2. Selecione o Dia (Segunda a Sábado)
          </label>
          <input
            id="appointment-date"
            type="date"
            value={selectedDate}
            onChange={(e) => {
              onChangeDate(e.target.value);
              setBookingStatus(null);
            }}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-3.5 flex flex-col justify-center">
          <span className="text-[11px] text-zinc-400 uppercase font-semibold">
            Serviço Selecionado
          </span>
          <p className="text-sm font-bold text-white mt-0.5">
            {selectedService.name}
          </p>
          <p className="text-xs text-amber-400 font-medium mt-0.5">
            R$ {selectedService.price.toFixed(2).replace(".", ",")} •{" "}
            {selectedService.duration_minutes} min • +
            {selectedService.loyalty_points} pts fidelidade
          </p>
        </div>
      </div>

      {/* 3. Grade de Horários (09:00 às 20:00) */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            3. Horários Disponíveis das 09:00 às 20:00 (
            {selectedDate.split("-").reverse().join("/")})
          </label>
          <div className="flex items-center gap-3 text-[11px] text-zinc-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Livre
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-zinc-700"></span> Ocupado
            </span>
          </div>
        </div>

        {isSunday ? (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <strong className="block text-amber-300">
                Domingo a barbearia está fechada!
              </strong>
              Nosso atendimento funciona de{" "}
              <strong>Segunda a Sábado, das 09:00 às 20:00</strong>. Selecione
              outro dia no calendário acima.
            </div>
          </div>
        ) : loadingSlots ? (
          <div className="text-xs text-zinc-400 py-6 text-center">
            Consultando agenda do barbeiro...
          </div>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
            {slots.map((slot) => {
              const isSelected = selectedTime === slot.time && slot.available;
              return (
                <button
                  key={slot.time}
                  type="button"
                  disabled={!slot.available}
                  onClick={() => setSelectedTime(slot.time)}
                  className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                    !slot.available
                      ? "bg-zinc-950/40 border-zinc-800/50 text-zinc-600 line-through cursor-not-allowed"
                      : isSelected
                      ? "bg-amber-500 border-amber-400 text-zinc-950 shadow-md shadow-amber-500/20"
                      : "bg-zinc-950 border-zinc-800 text-zinc-200 hover:border-amber-500/50"
                  }`}
                >
                  {slot.time}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Botão de Confirmação com Disparo WhatsApp */}
      <button
        type="button"
        disabled={isSunday}
        onClick={handleConfirmBooking}
        className="w-full py-3.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 disabled:text-zinc-500 text-zinc-950 font-extrabold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
      >
        <UserCheck className="w-4 h-4" />
        Confirmar Horário às {selectedTime} e Receber no WhatsApp
      </button>

      {/* Preview da Notificação WhatsApp Enviada */}
      {bookingStatus?.confirmed && (
        <div className="mt-5 p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200">
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              Horário Reservado! Já aparece na Bancada do Barbeiro
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full font-semibold">
              <Sparkles className="w-3 h-3" />+{selectedService.loyalty_points} pts
              creditados
            </span>
          </div>
          <div className="bg-zinc-950/90 border border-zinc-800 rounded-lg p-3 mt-2 font-mono text-xs text-zinc-300 whitespace-pre-line">
            <div className="flex items-center gap-1.5 text-emerald-400 font-sans font-semibold mb-1.5 text-[11px]">
              <MessageSquareShare className="w-3.5 h-3.5" />
              Comprovante enviado no WhatsApp ({clientPhone || "+5511977774444"}):
            </div>
            {bookingStatus.whatsappPreview}
          </div>
        </div>
      )}
    </section>
  );
}
