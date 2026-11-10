"use client";

import React, { useState } from "react";
import { UserPlus, CheckCircle2, BellRing, Send } from "lucide-react";
import { Barber, ClientProfile } from "@/types/barbershop";
import { sendWhatsAppNotification } from "@/services/api";

interface ClientRegistrationProps {
  barbers: Barber[];
  profile: ClientProfile;
  onUpdateProfile: (profile: ClientProfile) => void;
}

export default function ClientRegistration({
  barbers,
  profile,
  onUpdateProfile,
}: ClientRegistrationProps) {
  const [formData, setFormData] = useState<ClientProfile>(profile);
  const [savedBanner, setSavedBanner] = useState<boolean>(false);
  const [testWhatsAppResult, setTestWhatsAppResult] = useState<string | null>(
    null
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onUpdateProfile(formData);
    setSavedBanner(true);

    try {
      await fetch("/api/py/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
    } catch {
      // Continua em modo local caso API Python não esteja ativa
    }

    setTimeout(() => setSavedBanner(false), 4000);
  }

  async function handleTestReminder() {
    const res = await sendWhatsAppNotification({
      phone: formData.phone,
      client_name: formData.full_name,
      template_type: "reminder_24h",
      appointment_date: "Amanhã",
      appointment_time: "14:00",
      barber_name:
        barbers.find((b) => b.id === formData.preferred_barber_id)?.name ||
        barbers[0].name,
    });
    setTestWhatsAppResult(res.message_preview);
  }

  return (
    <section className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center gap-2 text-amber-400 text-sm font-semibold uppercase tracking-wider">
        <UserPlus className="w-4 h-4" />
        <span>Perfil & Notificações</span>
      </div>
      <h2 className="text-xl font-bold text-white mt-1 mb-4">
        Cadastro Básico do Cliente
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              Nome Completo *
            </label>
            <input
              type="text"
              required
              value={formData.full_name}
              onChange={(e) =>
                setFormData({ ...formData, full_name: e.target.value })
              }
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              WhatsApp (com DDD) *
            </label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              placeholder="+5511999999999"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              E-mail
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              Data de Nascimento
            </label>
            <input
              type="date"
              value={formData.birth_date}
              onChange={(e) =>
                setFormData({ ...formData, birth_date: e.target.value })
              }
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">
            Barbeiro de Preferência
          </label>
          <select
            value={formData.preferred_barber_id}
            onChange={(e) =>
              setFormData({ ...formData, preferred_barber_id: e.target.value })
            }
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
          >
            {barbers.map((barber) => (
              <option key={barber.id} value={barber.id}>
                {barber.name} — {barber.specialty}
              </option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-2.5 cursor-pointer select-none pt-1">
          <input
            type="checkbox"
            checked={formData.whatsapp_opt_in}
            onChange={(e) =>
              setFormData({ ...formData, whatsapp_opt_in: e.target.checked })
            }
            className="rounded border-zinc-700 bg-zinc-950 text-amber-500 focus:ring-amber-500"
          />
          <span className="text-xs text-zinc-300">
            Desejo receber confirmações, lembretes de horário e vouchers de
            fidelidade no WhatsApp
          </span>
        </label>

        <div className="flex flex-wrap gap-2.5 pt-2">
          <button
            type="submit"
            className="flex-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold py-2.5 px-4 rounded-xl text-xs transition-all"
          >
            Salvar Cadastro do Cliente
          </button>

          <button
            type="button"
            onClick={handleTestReminder}
            className="bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border border-emerald-500/30 font-semibold py-2.5 px-4 rounded-xl text-xs flex items-center gap-1.5 transition-all"
          >
            <BellRing className="w-3.5 h-3.5" />
            Testar Lembrete WhatsApp
          </button>
        </div>
      </form>

      {savedBanner && (
        <div className="mt-3 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          Cadastro atualizado e vinculado ao Cartão de Fidelidade!
        </div>
      )}

      {testWhatsAppResult && (
        <div className="mt-4 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs">
          <div className="flex items-center justify-between text-emerald-400 font-semibold mb-1">
            <span className="flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5" />
              Disparo de Lembrete 24h (Evolution API / Z-API)
            </span>
            <button
              type="button"
              onClick={() => setTestWhatsAppResult(null)}
              className="text-zinc-500 hover:text-zinc-300 text-[11px]"
            >
              Fechar
            </button>
          </div>
          <pre className="whitespace-pre-wrap font-mono text-[11px] text-zinc-300 mt-1">
            {testWhatsAppResult}
          </pre>
        </div>
      )}
    </section>
  );
}

