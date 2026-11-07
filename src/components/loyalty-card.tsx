import React from "react";
import { StampGrid } from "@/components/stamp-grid";
import { Award, Store } from "lucide-react";

export interface LoyaltyCardProps {
  tenantName: string;
  logoUrl?: string | null;
  brandColor: string;
  customerName: string;
  stampsCount: number;
  stampsRequired: number;
  rewardText: string;
  status: "active" | "completed" | string;
  className?: string;
}

export function LoyaltyCard({
  tenantName,
  logoUrl,
  brandColor,
  customerName,
  stampsCount,
  stampsRequired,
  rewardText,
  status,
  className = "",
}: LoyaltyCardProps) {
  const isCompleted = status === "completed" || stampsCount >= stampsRequired;

  return (
    <div
      className={`w-full max-w-[420px] rounded-3xl p-5 shadow-2xl text-white relative overflow-hidden flex flex-col justify-between gap-4 border border-white/10 select-none ${className}`}
      style={{
        background: `linear-gradient(145deg, ${brandColor} 0%, #1c1917 80%, #0c0a09 100%)`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-white/15 pb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={tenantName}
                className="w-full h-full object-cover"
              />
            ) : (
              <Store className="w-5 h-5 text-white/90" />
            )}
          </div>
          <span className="font-bold text-base sm:text-lg tracking-wide truncate text-white">
            {tenantName}
          </span>
        </div>

        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/15 text-white/90 shrink-0">
          Kartu Loyalitas
        </span>
      </div>

      {/* Banner status completed */}
      {isCompleted && (
        <div
          role="status"
          className="bg-amber-400 text-amber-950 px-3.5 py-2 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5 shadow-md animate-pulse"
        >
          <Award className="w-4 h-4 shrink-0 text-amber-900" />
          <span className="truncate">
            Kartu penuh! Tunjukkan ke kasir: {rewardText}
          </span>
        </div>
      )}

      {/* Stamp Grid */}
      <div className="py-1">
        <StampGrid
          stampsCount={stampsCount}
          stampsRequired={stampsRequired}
          brandColor={brandColor}
          logoUrl={logoUrl}
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-3 border-t border-white/15 pt-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wider text-white/70 font-medium">
            Pelanggan
          </p>
          <p className="text-sm font-semibold truncate text-white">
            {customerName}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <span className="text-sm font-bold tracking-wider bg-white/20 px-3 py-1 rounded-full text-white inline-block">
            {stampsCount} / {stampsRequired}
          </span>
        </div>
      </div>
    </div>
  );
}

