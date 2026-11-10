"use client";

import React, { useState } from "react";
import { Scissors, Clock, Award, CheckCircle2 } from "lucide-react";
import { BarbershopService, ServiceCategory } from "@/types/barbershop";

interface ServiceListProps {
  services: BarbershopService[];
  selectedService: BarbershopService;
  onSelectService: (service: BarbershopService) => void;
}

const CATEGORIES: ServiceCategory[] = [
  "Todos",
  "Cabelo",
  "Barba",
  "Combo",
  "Estética",
];

export default function ServiceList({
  services,
  selectedService,
  onSelectService,
}: ServiceListProps) {
  const [activeCategory, setActiveCategory] = useState<ServiceCategory>("Todos");

  const filteredServices =
    activeCategory === "Todos"
      ? services
      : services.filter((s) => s.category === activeCategory);

  return (
    <section className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-sm font-semibold uppercase tracking-wider">
            <Scissors className="w-4 h-4" />
            <span>Catálogo de Serviços</span>
          </div>
          <h2 className="text-2xl font-bold text-white mt-1">
            Escolha seu Serviço
          </h2>
        </div>

        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeCategory === category
                  ? "bg-amber-500 text-zinc-950 font-semibold shadow-md shadow-amber-500/20"
                  : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredServices.map((service) => {
          const isSelected = selectedService.id === service.id;
          return (
            <div
              key={service.id}
              onClick={() => onSelectService(service)}
              className={`cursor-pointer rounded-xl p-4 border transition-all flex flex-col justify-between ${
                isSelected
                  ? "bg-amber-500/10 border-amber-500 shadow-lg shadow-amber-500/5"
                  : "bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="inline-block text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-zinc-800 text-amber-400 mb-2">
                      {service.category}
                    </span>
                    <h3 className="text-base font-bold text-white">
                      {service.name}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-extrabold text-amber-400">
                      R$ {service.price.toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                  {service.description}
                </p>
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-800/80 text-xs">
                <div className="flex items-center gap-4 text-zinc-300">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-zinc-400" />
                    {service.duration_minutes} min
                  </span>
                  <span className="flex items-center gap-1 text-emerald-400 font-medium">
                    <Award className="w-3.5 h-3.5" />+{service.loyalty_points} pts
                  </span>
                </div>

                <span
                  className={`flex items-center gap-1 font-semibold ${
                    isSelected ? "text-amber-400" : "text-zinc-400"
                  }`}
                >
                  {isSelected ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Selecionado
                    </>
                  ) : (
                    "Selecionar"
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

