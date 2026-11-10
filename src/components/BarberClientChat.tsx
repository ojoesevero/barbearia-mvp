"use client";

import React, { useState } from "react";
import {
  MessageCircle,
  Send,
  Smartphone,
  User,
  Scissors,
  CheckCheck,
} from "lucide-react";
import { Barber, ChatMessage } from "@/types/barbershop";
import { INITIAL_CHAT_MESSAGES } from "@/lib/mock-data";
import { sendWhatsAppNotification } from "@/services/api";

interface BarberClientChatProps {
  barbers: Barber[];
  clientName: string;
  clientPhone: string;
}

export default function BarberClientChat({
  barbers,
  clientName,
  clientPhone,
}: BarberClientChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_CHAT_MESSAGES);
  const [activeBarber, setActiveBarber] = useState<Barber>(barbers[0]);
  const [senderRole, setSenderRole] = useState<"client" | "barber">("client");
  const [inputText, setInputText] = useState<string>("");
  const [mirrorWhatsApp, setMirrorWhatsApp] = useState<boolean>(true);

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed) return;

    const now = new Date();
    const timeStr = now.toTimeString().slice(0, 5);

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender_role: senderRole,
      sender_name:
        senderRole === "client" ? clientName || "Cliente" : activeBarber.name,
      content: trimmed,
      timestamp: timeStr,
      sent_via_whatsapp: mirrorWhatsApp,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText("");

    if (mirrorWhatsApp) {
      await sendWhatsAppNotification({
        phone: clientPhone || "+5511977774444",
        client_name: clientName || "Cliente",
        template_type: "chat_reply",
        barber_name: activeBarber.name,
        custom_message: trimmed,
      });
    }
  }

  return (
    <section className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col h-full">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-sm font-semibold uppercase tracking-wider">
            <MessageCircle className="w-4 h-4" />
            <span>Chat em Tempo Real</span>
          </div>
          <h2 className="text-xl font-bold text-white mt-0.5">
            Conversa Barbeiro & Cliente
          </h2>
        </div>

        {/* Seletor de papel para testar os dois lados da conversa */}
        <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-xl p-1 text-xs">
          <button
            type="button"
            onClick={() => setSenderRole("client")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
              senderRole === "client"
                ? "bg-amber-500 text-zinc-950"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Visão Cliente
          </button>
          <button
            type="button"
            onClick={() => setSenderRole("barber")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
              senderRole === "barber"
                ? "bg-amber-500 text-zinc-950"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Scissors className="w-3.5 h-3.5" />
            Visão Barbeiro
          </button>
        </div>
      </div>

      {/* Cabeçalho do barbeiro selecionado */}
      <div className="flex items-center justify-between bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-bold text-amber-300 text-xs">
            {activeBarber.avatar_initials}
          </div>
          <div>
            <p className="text-sm font-bold text-white">{activeBarber.name}</p>
            <p className="text-[11px] text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Online • Supabase Realtime + Ponte WhatsApp
            </p>
          </div>
        </div>

        <select
          aria-label="Trocar barbeiro do chat"
          value={activeBarber.id}
          onChange={(e) => {
            const found = barbers.find((b) => b.id === e.target.value);
            if (found) setActiveBarber(found);
          }}
          className="bg-zinc-900 border border-zinc-700 text-xs text-zinc-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500"
        >
          {barbers.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      {/* Lista de Mensagens */}
      <div className="flex-1 min-h-[260px] max-h-[340px] overflow-y-auto space-y-3 bg-zinc-950/60 border border-zinc-800/70 rounded-xl p-4 mb-4">
        {messages.map((msg) => {
          const isClient = msg.sender_role === "client";
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${
                isClient ? "items-end" : "items-start"
              }`}
            >
              <span className="text-[10px] text-zinc-400 mb-1 px-1">
                {msg.sender_name} • {msg.timestamp}
              </span>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                  isClient
                    ? "bg-amber-500 text-zinc-950 font-medium rounded-br-none"
                    : "bg-zinc-800 text-zinc-100 rounded-bl-none"
                }`}
              >
                <p>{msg.content}</p>
                {msg.sent_via_whatsapp && (
                  <div
                    className={`flex items-center justify-end gap-1 text-[10px] mt-1 ${
                      isClient ? "text-zinc-900/80" : "text-emerald-400"
                    }`}
                  >
                    <CheckCheck className="w-3 h-3" />
                    <span>Sincronizado c/ WhatsApp</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Formulário de Envio */}
      <form onSubmit={handleSendMessage} className="space-y-2.5">
        <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={mirrorWhatsApp}
              onChange={(e) => setMirrorWhatsApp(e.target.checked)}
              className="rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-amber-500"
            />
            <span className="flex items-center gap-1 text-[11px] text-zinc-300">
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              Notificar também via WhatsApp ({clientPhone || "+5511977774444"})
            </span>
          </label>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              senderRole === "client"
                ? "Digite uma mensagem para o barbeiro..."
                : "Responder ao cliente como barbeiro..."
            }
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
          />
          <button
            type="submit"
            className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            Enviar
          </button>
        </div>
      </form>
    </section>
  );
}

