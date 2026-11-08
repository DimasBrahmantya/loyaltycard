"use client";

import React, { useState } from "react";
import { LoyaltyCard } from "@/components/loyalty-card";
import { Plus, RotateCcw, CreditCard } from "lucide-react";

export function HeroCardSimulator() {
  const [stamps, setStamps] = useState(5);
  const totalRequired = 10;

  const handleAddStamp = () => {
    setStamps((prev) => (prev < totalRequired ? prev + 1 : prev));
  };

  const handleReset = () => {
    setStamps(0);
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-[420px] mx-auto">
      {/* Live Card */}
      <div className="w-full transform transition-all duration-300 hover:scale-[1.01]">
        <LoyaltyCard
          tenantName="Kopi Kawan Setia"
          brandColor="#1e3a8a"
          customerName="Rian Pratama"
          stampsCount={stamps}
          stampsRequired={totalRequired}
          rewardText="Gratis 1 Kopi Susu Aren"
          status={stamps >= totalRequired ? "completed" : "active"}
        />
      </div>

      {/* Simulator Control Pill */}
      <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
        <span className="px-2.5 py-1 text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1.5">
          <CreditCard className="w-3.5 h-3.5 text-blue-900 dark:text-blue-400" />
          <span>Simulasi demo:</span>
        </span>

        <button
          type="button"
          onClick={handleAddStamp}
          disabled={stamps >= totalRequired}
          className="inline-flex min-h-11 items-center gap-1 px-3 rounded-lg bg-blue-900 hover:bg-blue-950 disabled:opacity-40 text-white font-medium transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah Stempel</span>
        </button>

        <button
          type="button"
          onClick={handleReset}
          className="inline-flex min-h-11 items-center gap-1 px-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          title="Reset simulasi stempel"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="sr-only sm:not-sr-only">Reset</span>
        </button>
      </div>
    </div>
  );
}

