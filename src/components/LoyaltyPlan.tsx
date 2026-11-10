"use client";

import React, { useState } from "react";
import { Award, Gift, Sparkles, Check, History } from "lucide-react";
import { LoyaltyReward, LoyaltyTransaction } from "@/types/barbershop";

interface LoyaltyPlanProps {
  pointsBalance: number;
  stampsCount: number;
  rewards: LoyaltyReward[];
  transactions: LoyaltyTransaction[];
  onRedeemReward: (reward: LoyaltyReward) => void;
}

export default function LoyaltyPlan({
  pointsBalance,
  stampsCount,
  rewards,
  transactions,
  onRedeemReward,
}: LoyaltyPlanProps) {
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const tier =
    pointsBalance >= 250
      ? "Ouro"
      : pointsBalance >= 100
      ? "Prata"
      : "Bronze";

  function handleRedeem(reward: LoyaltyReward) {
    if (pointsBalance < reward.points_cost) {
      setFeedbackMsg(
        `Faltam ${reward.points_cost - pointsBalance} pontos para resgatar "${reward.title}".`
      );
      return;
    }
    onRedeemReward(reward);
    setFeedbackMsg(
      `🎉 Recompensa "${reward.title}" resgatada com sucesso! Voucher enviado ao seu WhatsApp.`
    );
  }

  return (
    <section className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-sm font-semibold uppercase tracking-wider">
            <Award className="w-4 h-4" />
            <span>Clube de Vantagens</span>
          </div>
          <h2 className="text-2xl font-bold text-white mt-1">
            Plano de Fidelidade
          </h2>
        </div>

        <div className="flex items-center gap-3 bg-zinc-950 border border-amber-500/40 rounded-xl px-4 py-2.5">
          <div>
            <span className="block text-[10px] uppercase tracking-wider text-zinc-400">
              Saldo Atual
            </span>
            <span className="text-xl font-extrabold text-amber-400">
              {pointsBalance} pts
            </span>
          </div>
          <div className="h-7 w-px bg-zinc-800" />
          <div>
            <span className="block text-[10px] uppercase tracking-wider text-zinc-400">
              Categoria
            </span>
            <span className="text-sm font-bold text-white flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Nível {tier}
            </span>
          </div>
        </div>
      </div>

      {/* Cartão de 10 Selos */}
      <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between text-xs mb-3">
          <span className="font-bold text-zinc-200">
            Cartão Fidelidade Digital (10 Cortes = 1 Cortesia VIP)
          </span>
          <span className="text-amber-400 font-semibold">
            {stampsCount}/10 selos
          </span>
        </div>

        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
          {Array.from({ length: 10 }).map((_, index) => {
            const filled = index < stampsCount;
            return (
              <div
                key={index}
                className={`h-11 rounded-lg border flex flex-col items-center justify-center text-xs font-bold transition-all ${
                  filled
                    ? "bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm shadow-amber-500/20"
                    : "bg-zinc-950/60 border-zinc-800 text-zinc-600"
                }`}
              >
                {filled ? <Check className="w-4 h-4" /> : index + 1}
              </div>
            );
          })}
        </div>
      </div>

      {feedbackMsg && (
        <div className="mb-4 p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-xs text-amber-200 font-medium">
          {feedbackMsg}
        </div>
      )}

      {/* Catálogo de Prêmios */}
      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-1.5">
        <Gift className="w-3.5 h-3.5 text-amber-400" />
        Recompensas Disponíveis para Resgate
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {rewards.map((reward) => {
          const canRedeem = pointsBalance >= reward.points_cost;
          return (
            <div
              key={reward.id}
              className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-3.5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-bold text-white">
                    {reward.title}
                  </h4>
                  <span className="text-xs font-extrabold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400 shrink-0">
                    {reward.points_cost} pts
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  {reward.description}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleRedeem(reward)}
                className={`mt-3 w-full py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                  canRedeem
                    ? "bg-amber-500 hover:bg-amber-400 text-zinc-950"
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                }`}
              >
                {canRedeem
                  ? "Resgatar Recompensa"
                  : `Faltam ${reward.points_cost - pointsBalance} pts`}
              </button>
            </div>
          );
        })}
      </div>

      {/* Histórico Recente */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2.5 flex items-center gap-1.5">
          <History className="w-3.5 h-3.5 text-amber-400" />
          Extrato Recente de Pontos
        </h3>
        <div className="space-y-2">
          {transactions.slice(0, 4).map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between bg-zinc-950/50 border border-zinc-800/70 rounded-lg px-3.5 py-2 text-xs"
            >
              <div>
                <p className="font-semibold text-zinc-200">{tx.description}</p>
                <span className="text-[10px] text-zinc-500">{tx.date}</span>
              </div>
              <span
                className={`font-bold ${
                  tx.type === "earn" ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {tx.type === "earn" ? `+${tx.points}` : tx.points} pts
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

