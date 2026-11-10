"use client";

import React, { useState } from "react";
import {
  Search,
  Smartphone,
  ExternalLink,
  Sparkles,
  CheckCheck,
  Clock,
} from "lucide-react";
import { sendWhatsAppNotification } from "@/services/api";

interface WhatsAppAutoFunnelBannerProps {
  clientName: string;
  clientPhone: string;
}

export default function WhatsAppAutoFunnelBanner({
  clientName,
  clientPhone,
}: WhatsAppAutoFunnelBannerProps) {
  const [simulatedReply, setSimulatedReply] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  async function handleSimulateClientHi() {
    setLoading(true);
    const res = await sendWhatsAppNotification({
      phone: clientPhone || "+5511977774444",
      client_name: clientName || "Cliente",
      template_type: "welcome_auto_reply",
    });
    setSimulatedReply(res.message_preview);
    setLoading(false);
  }

  return (
    <section className="bg-gradient-to-r from-emerald-950/50 via-zinc-900 to-zinc-900 border border-emerald-500/30 rounded-2xl p-5 shadow-xl">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Jornada Automática do Cliente (Zero Tempo no Celular para o Barbeiro)
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-white">
            Cliente buscou no Google ➔ Mandou &ldquo;Oi&rdquo; no WhatsApp ➔ Recebeu o Link na Hora!
          </h2>
          <p className="text-xs text-zinc-300 leading-relaxed">
            Enquanto o barbeiro está atendendo na cadeira, o robô responde no WhatsApp em{" "}
            <strong className="text-emerald-400">1 segundo</strong> enviando o link deste site. O
            cliente escolhe o serviço abaixo e vê todos os horários livres de{" "}
            <strong className="text-amber-400">Segunda a Sábado, das 09:00 às 20:00</strong>.
          </p>

          {/* Passos visuais */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
            <div className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-2.5 flex items-center gap-2.5 text-xs">
              <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-amber-400 shrink-0">
                <Search className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 block">Passo 1</span>
                <strong className="text-zinc-100">Acha no Google / Insta</strong>
              </div>
            </div>

            <div className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-2.5 flex items-center gap-2.5 text-xs">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 block">Passo 2</span>
                <strong className="text-zinc-100">Manda &ldquo;Oi&rdquo; no WhatsApp</strong>
              </div>
            </div>

            <div className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-2.5 flex items-center gap-2.5 text-xs">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 block">Passo 3</span>
                <strong className="text-zinc-100">Abre Link e Agenda (09h–20h)</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-stretch sm:items-end justify-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleSimulateClientHi}
            disabled={loading}
            className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-extrabold text-xs px-5 py-3.5 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
          >
            <Smartphone className="w-4 h-4" />
            {loading
              ? "Simulando resposta..."
              : "Simular Cliente mandando 'Oi' no WhatsApp"}
          </button>
          <span className="text-[11px] text-zinc-400 text-center sm:text-right">
            Ideal para demonstrar ao barbeiro como o sistema trabalha sozinho
          </span>
        </div>
      </div>

      {simulatedReply && (
        <div className="mt-4 bg-zinc-950 border border-emerald-500/40 rounded-xl p-4 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-emerald-400 flex items-center gap-1.5">
              <CheckCheck className="w-4 h-4" />
              Resposta Automática Enviada em 1s para o Cliente ({clientPhone}):
            </span>
            <button
              type="button"
              onClick={() => setSimulatedReply(null)}
              className="text-zinc-400 hover:text-white text-[11px]"
            >
              Fechar preview
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-zinc-300">
              <span className="text-[10px] uppercase text-zinc-400 font-bold block mb-1">
                Mensagem recebida do cliente:
              </span>
              <p className="italic text-white">
                &ldquo;Oi! Peguei o número no Google, tem horário para cortar hoje?&rdquo;
              </p>
            </div>

            <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-lg p-3 font-mono text-[11px] text-emerald-100 whitespace-pre-line">
              {simulatedReply}
            </div>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-amber-400 font-semibold">
            <ExternalLink className="w-3.5 h-3.5" />
            Ao clicar no link da mensagem acima, o cliente cai exatamente na tela abaixo para escolher o serviço e horário!
          </div>
        </div>
      )}
    </section>
  );
}

