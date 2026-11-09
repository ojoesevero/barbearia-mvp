"use client";

import React, { useState } from "react";
import {
  Scissors,
  Calendar,
  MessageCircle,
  Award,
  UserCheck,
  Smartphone,
} from "lucide-react";
import {
  INITIAL_BARBERS,
  INITIAL_LOYALTY_HISTORY,
  INITIAL_REWARDS,
  INITIAL_SERVICES,
} from "@/lib/mock-data";
import {
  BarbershopService,
  ClientProfile,
  LoyaltyReward,
  LoyaltyTransaction,
} from "@/types/barbershop";
import ServiceList from "@/components/ServiceList";
import AvailabilityCalendar from "@/components/AvailabilityCalendar";
import BarberClientChat from "@/components/BarberClientChat";
import LoyaltyPlan from "@/components/LoyaltyPlan";
import ClientRegistration from "@/components/ClientRegistration";

export default function HomePage() {
  const [selectedService, setSelectedService] = useState<BarbershopService>(
    INITIAL_SERVICES[0]
  );

  const [clientProfile, setClientProfile] = useState<ClientProfile>({
    full_name: "Carlos Eduardo Silva",
    phone: "+5511977774444",
    email: "carlos.cliente@email.com",
    birth_date: "1994-06-15",
    preferred_barber_id: INITIAL_BARBERS[0].id,
    whatsapp_opt_in: true,
  });

  const [pointsBalance, setPointsBalance] = useState<number>(120);
  const [stampsCount, setStampsCount] = useState<number>(7);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>(
    INITIAL_LOYALTY_HISTORY
  );

  function handleAppointmentBooked(pointsEarned: number, serviceName: string) {
    setPointsBalance((prev) => prev + pointsEarned);
    setStampsCount((prev) => (prev >= 10 ? 1 : prev + 1));
    setTransactions((prev) => [
      {
        id: `tx-${Date.now()}`,
        type: "earn",
        points: pointsEarned,
        description: `Agendamento: ${serviceName}`,
        date: new Date().toLocaleDateString("pt-BR"),
      },
      ...prev,
    ]);
  }

  function handleRedeemReward(reward: LoyaltyReward) {
    setPointsBalance((prev) => Math.max(0, prev - reward.points_cost));
    setTransactions((prev) => [
      {
        id: `tx-${Date.now()}`,
        type: "redeem",
        points: -reward.points_cost,
        description: `Resgate: ${reward.title}`,
        date: new Date().toLocaleDateString("pt-BR"),
      },
      ...prev,
    ]);
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950">
      {/* Header Principal */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-zinc-950/85 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-zinc-950 shadow-lg shadow-amber-500/20">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-white">
                NAVALHA DE OURO{" "}
                <span className="text-amber-400 font-semibold text-xs ml-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30">
                  BARBERSHOP MVP
                </span>
              </h1>
              <p className="text-[11px] text-zinc-400 hidden sm:block">
                Next.js (Node.js) • FastAPI (Python) • Supabase • WhatsApp API
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="hidden md:flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-full text-zinc-300">
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span>WhatsApp Ativo</span>
            </div>
            <div className="flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/40 px-3 py-1.5 rounded-full text-amber-300 font-bold">
              <Award className="w-3.5 h-3.5" />
              <span>{pointsBalance} pts</span>
            </div>
          </div>
        </div>
      </header>

      {/* Barra de Atalhos das 6 Funcionalidades */}
      <div className="bg-zinc-900/50 border-b border-zinc-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
          <div className="flex flex-wrap items-center gap-4">
            <a
              href="#servicos"
              className="hover:text-amber-400 flex items-center gap-1.5 transition-colors"
            >
              <Scissors className="w-3.5 h-3.5 text-amber-400" />
              1. Lista de Serviços
            </a>
            <a
              href="#calendario"
              className="hover:text-amber-400 flex items-center gap-1.5 transition-colors"
            >
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              2. Calendário & Disponibilidade
            </a>
            <a
              href="#cadastro"
              className="hover:text-amber-400 flex items-center gap-1.5 transition-colors"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              3. Notificações WhatsApp
            </a>
            <a
              href="#chat"
              className="hover:text-amber-400 flex items-center gap-1.5 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5 text-amber-400" />
              4. Chat Barbeiro & Cliente
            </a>
            <a
              href="#fidelidade"
              className="hover:text-amber-400 flex items-center gap-1.5 transition-colors"
            >
              <Award className="w-3.5 h-3.5 text-amber-400" />
              5. Plano de Fidelidade
            </a>
            <a
              href="#cadastro"
              className="hover:text-amber-400 flex items-center gap-1.5 transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5 text-amber-400" />
              6. Cadastro do Cliente
            </a>
          </div>
          <span className="text-[11px] text-zinc-500">
            Cliente logado:{" "}
            <strong className="text-zinc-300">{clientProfile.full_name}</strong>
          </span>
        </div>
      </div>

      {/* Conteúdo Principal em Grid Responsivo */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Linha 1: Catálogo de Serviços + Calendário de Disponibilidade */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div id="servicos" className="lg:col-span-6">
            <ServiceList
              services={INITIAL_SERVICES}
              selectedService={selectedService}
              onSelectService={setSelectedService}
            />
          </div>

          <div id="calendario" className="lg:col-span-6">
            <AvailabilityCalendar
              barbers={INITIAL_BARBERS}
              selectedService={selectedService}
              clientName={clientProfile.full_name}
              clientPhone={clientProfile.phone}
              onAppointmentBooked={handleAppointmentBooked}
            />
          </div>
        </div>

        {/* Linha 2: Plano de Fidelidade + Chat Barbeiro/Cliente */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div id="fidelidade" className="lg:col-span-6">
            <LoyaltyPlan
              pointsBalance={pointsBalance}
              stampsCount={stampsCount}
              rewards={INITIAL_REWARDS}
              transactions={transactions}
              onRedeemReward={handleRedeemReward}
            />
          </div>

          <div id="chat" className="lg:col-span-6">
            <BarberClientChat
              barbers={INITIAL_BARBERS}
              clientName={clientProfile.full_name}
              clientPhone={clientProfile.phone}
            />
          </div>
        </div>

        {/* Linha 3: Cadastro Básico do Cliente & Disparo de Teste WhatsApp */}
        <div id="cadastro">
          <ClientRegistration
            barbers={INITIAL_BARBERS}
            profile={clientProfile}
            onUpdateProfile={setClientProfile}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-6 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            © {new Date().getFullYear()} Barbearia Navalha de Ouro — MVP
          </span>
          <span>
            Infraestrutura: Vercel • Supabase PostgreSQL & Realtime • Python
            FastAPI • Node.js Next.js
          </span>
        </div>
      </footer>
    </div>
  );
}
