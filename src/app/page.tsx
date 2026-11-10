"use client";

import React, { useEffect, useState } from "react";
import {
  Scissors,
  Plus,
  Clock,
  Trash2,
  CheckCircle2,
  Loader2,
  Smartphone,
} from "lucide-react";
import MobileScheduleStep from "@/components/MobileScheduleStep";
import MobileClientBookingStep from "@/components/MobileClientBookingStep";

interface ServiceRecord {
  id: string;
  name: string;
  category: string;
  price: number;
  duration_minutes: number;
}

const CATEGORIES = ["Cabelo", "Barba", "Combo", "Estética"];
const DURATIONS = [15, 30, 40, 45, 60];

export default function HomePage() {
  // Inicia no Passo 3 (Visão do Cliente) para você testar o cadastro prévio + agendamento
  const [activeTab, setActiveTab] = useState<
    "services" | "schedule" | "client"
  >("client");

  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [name, setName] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [duration, setDuration] = useState<number>(30);
  const [category, setCategory] = useState<string>("Cabelo");

  async function loadServices() {
    setLoading(true);
    try {
      const res = await fetch("/api/services", { cache: "no-store" });
      const data = await res.json();
      if (data.services) {
        setServices(data.services);
      }
    } catch {
      // Ignora falha momentânea
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadServices();
  }, []);

  async function handleCreateService(e: React.FormEvent) {
    e.preventDefault();
    const numericPrice = Number(price.replace(",", "."));
    if (!name.trim() || !numericPrice || numericPrice <= 0) return;

    setSaving(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          price: numericPrice,
          duration_minutes: duration,
          category,
        }),
      });

      if (res.ok) {
        const { service } = await res.json();
        setServices((prev) => [...prev, service]);
        setName("");
        setPrice("");
        setFeedback(`"${service.name}" cadastrado no banco!`);
        setTimeout(() => setFeedback(null), 3000);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteService(id: string) {
    setServices((prev) => prev.filter((s) => s.id !== id));
    await fetch(`/api/services?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex justify-center">
      {/* Container Mobile-First (tamanho de tela de celular) */}
      <div className="w-full max-w-md min-h-screen flex flex-col bg-zinc-950 border-x border-zinc-900 pb-20">
        {/* Topo Simples */}
        <header className="sticky top-0 z-20 bg-zinc-950/95 backdrop-blur border-b border-zinc-800 px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center text-zinc-950">
              {activeTab === "services" ? (
                <Scissors className="w-5 h-5" />
              ) : activeTab === "schedule" ? (
                <Clock className="w-5 h-5" />
              ) : (
                <Smartphone className="w-5 h-5" />
              )}
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                {activeTab === "services"
                  ? "Passo 1 • Área do Barbeiro"
                  : activeTab === "schedule"
                  ? "Passo 2 • Área do Barbeiro"
                  : "Passo 3 • Visão do Cliente"}
              </span>
              <h1 className="text-base font-extrabold text-white leading-tight">
                {activeTab === "services"
                  ? "Meus Serviços"
                  : activeTab === "schedule"
                  ? "Meu Expediente"
                  : "Agendar Horário"}
              </h1>
            </div>
          </div>

          <span className="text-xs font-bold bg-zinc-900 border border-zinc-800 text-zinc-300 px-2.5 py-1 rounded-full">
            {activeTab === "services"
              ? `${services.length} serviços`
              : activeTab === "schedule"
              ? "Seg a Sáb"
              : "Link Online"}
          </span>
        </header>

        {/* Conteúdo da Aba Selecionada */}
        <main className="flex-1 p-4 space-y-6">
          {activeTab === "client" ? (
            <MobileClientBookingStep services={services} />
          ) : activeTab === "schedule" ? (
            <MobileScheduleStep />
          ) : (
            <>
              {/* Passo 1: Formulário Rápido de Cadastro de Serviço */}
              <form
                onSubmit={handleCreateService}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-4 shadow-lg"
              >
                <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-amber-400" />
                  Novo Serviço
                </h2>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1">
                    Nome do serviço
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Corte Degradê"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1">
                    Valor cobrado (R$)
                  </label>
                  <input
                    type="number"
                    step="0.50"
                    min="1"
                    required
                    placeholder="Ex: 50,00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-3 text-base font-bold text-amber-400 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">
                    Tempo na cadeira
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {DURATIONS.map((min) => (
                      <button
                        key={min}
                        type="button"
                        onClick={() => setDuration(min)}
                        className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                          duration === min
                            ? "bg-amber-500 border-amber-400 text-zinc-950"
                            : "bg-zinc-950 border-zinc-800 text-zinc-400"
                        }`}
                      >
                        {min}m
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">
                    Categoria
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                          category === cat
                            ? "bg-zinc-100 border-white text-zinc-950 font-bold"
                            : "bg-zinc-950 border-zinc-800 text-zinc-400"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-zinc-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-md shadow-amber-500/10 transition-all"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Salvando no Banco...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Cadastrar Serviço
                    </>
                  )}
                </button>

                {feedback && (
                  <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    {feedback}
                  </div>
                )}
              </form>

              <section className="space-y-2.5">
                <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 px-1">
                  Serviços Ativos na Barbearia
                </h2>

                {loading ? (
                  <div className="py-10 text-center text-xs text-zinc-500 flex flex-col items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
                    Carregando serviços do Supabase...
                  </div>
                ) : services.length === 0 ? (
                  <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 text-center text-xs text-zinc-400">
                    Nenhum serviço cadastrado ainda.
                  </div>
                ) : (
                  services.map((service) => (
                    <div
                      key={service.id}
                      className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300">
                            {service.category}
                          </span>
                          <span className="text-xs text-zinc-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {service.duration_minutes} min
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-white mt-1 truncate">
                          {service.name}
                        </h3>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-base font-extrabold text-amber-400">
                          R$ {Number(service.price).toFixed(2).replace(".", ",")}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteService(service.id)}
                          aria-label={`Remover ${service.name}`}
                          className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-500 hover:text-rose-400 hover:border-rose-500/40 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </section>
            </>
          )}
        </main>

        {/* Barra de Navegação Inferior (3 Passos Mobile) */}
        <nav className="fixed bottom-0 w-full max-w-md bg-zinc-950/95 backdrop-blur border-t border-zinc-800 px-3 py-2 grid grid-cols-3 gap-2 z-30">
          <button
            type="button"
            onClick={() => setActiveTab("services")}
            className={`py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all ${
              activeTab === "services"
                ? "bg-amber-500 text-zinc-950 shadow-md"
                : "bg-zinc-900 text-zinc-400 hover:text-white"
            }`}
          >
            <Scissors className="w-3.5 h-3.5" />
            1. Serviços
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("schedule")}
            className={`py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all ${
              activeTab === "schedule"
                ? "bg-amber-500 text-zinc-950 shadow-md"
                : "bg-zinc-900 text-zinc-400 hover:text-white"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            2. Expediente
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("client")}
            className={`py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all ${
              activeTab === "client"
                ? "bg-amber-500 text-zinc-950 shadow-md"
                : "bg-zinc-900 text-zinc-400 hover:text-white"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            3. Cliente
          </button>
        </nav>
      </div>
    </div>
  );
}
