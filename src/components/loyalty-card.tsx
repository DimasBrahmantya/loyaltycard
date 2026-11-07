import React from "react";
import { StampGrid } from "@/components/stamp-grid";
import { Award, Store, Gift, CheckCircle2 } from "lucide-react";

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
  currentCycle?: number;
  cardBgUrl?: string | null;
  stampIconUrl?: string | null;
  stampColor?: string;
  stampHasBorder?: boolean;
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
  currentCycle = 1,
  cardBgUrl,
  stampIconUrl,
  stampColor = "#ffffff",
  stampHasBorder = true,
}: LoyaltyCardProps) {
  const isCompleted = status === "completed" || stampsCount >= stampsRequired;
  const progressPercent = Math.min(100, Math.round((stampsCount / stampsRequired) * 100));

  return (
    <div
      className={`w-full max-w-[420px] rounded-[20px] p-6 text-white relative overflow-hidden flex flex-col justify-between gap-5 border border-white/15 select-none transition-all duration-300 hover:border-white/30 ${className}`}
      style={{
        background: `radial-gradient(ellipse at top left, ${brandColor}dd 0%, #0f172a 65%, #020617 100%)`,
        boxShadow: "0 14px 28px -10px rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.2)",
      }}
    >
      {/* Custom Background Image with protective overlay */}
      {cardBgUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center pointer-events-none"
          style={{ backgroundImage: `url(${cardBgUrl})` }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${brandColor}aa 0%, rgba(15, 23, 42, 0.85) 60%, rgba(2, 6, 23, 0.94) 100%)`,
            }}
          />
        </div>
      )}

      {/* Decorative subtle texture watermark */}
      <div 
        className="absolute -right-8 -top-8 w-44 h-44 rounded-full pointer-events-none opacity-5 border border-white" 
      />
      <div 
        className="absolute -right-16 -bottom-16 w-52 h-52 rounded-full pointer-events-none opacity-5 border border-white" 
      />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between gap-3 border-b border-white/10 pb-3.5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-lg overflow-hidden bg-white/10 border border-white/20 flex items-center justify-center shrink-0 shadow-sm backdrop-blur-xs">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={tenantName}
                className="w-full h-full object-cover"
              />
            ) : (
              <Store className="w-5 h-5 text-white/80" />
            )}
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-base sm:text-lg tracking-tight truncate text-white">
              {tenantName}
            </h2>
            <p className="text-[11px] text-white/70 font-medium">
              Kartu pelanggan
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end shrink-0">
          <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15 text-white/90">
            Siklus ke-{currentCycle}
          </span>
        </div>
      </div>

      {/* Banner Hadiah / Reward info */}
      <div className="relative z-10">
        {isCompleted ? (
          <div
            role="status"
            className="bg-emerald-600 text-white px-4 py-2.5 rounded-2xl text-xs font-bold text-center flex items-center justify-center gap-2 border border-emerald-400/40"
          >
            <Award className="w-4 h-4 shrink-0 text-white" />
            <span className="truncate">
              Stempel penuh. Tukar hadiah: <strong>{rewardText}</strong>
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-black/25 border border-white/10 text-xs text-white/90">
            <span className="flex items-center gap-1.5 truncate">
              <Gift className="w-3.5 h-3.5 text-white/80 shrink-0" />
              <span className="truncate">Target: {rewardText}</span>
            </span>
            <span className="font-semibold text-white shrink-0 ml-2">
              {stampsRequired - stampsCount} stempel lagi
            </span>
          </div>
        )}
      </div>

      {/* Stamp Grid Container */}
      <div className="relative z-10 py-1 bg-white/[0.03] rounded-2xl p-2 border border-white/5">
        <StampGrid
          stampsCount={stampsCount}
          stampsRequired={stampsRequired}
          brandColor={brandColor}
          logoUrl={logoUrl}
          stampIconUrl={stampIconUrl}
          stampColor={stampColor}
          stampHasBorder={stampHasBorder}
        />
      </div>

      {/* Progress Bar */}
      <div className="relative z-10 space-y-1">
        <div className="flex justify-between text-[11px] text-white/70 font-medium">
          <span>Kemajuan</span>
          <span>{stampsCount} dari {stampsRequired} stempel ({progressPercent}%)</span>
        </div>
        <div className="w-full h-2 bg-black/30 rounded-full overflow-hidden border border-white/10">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              isCompleted ? "bg-emerald-400" : "bg-white"
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 flex items-center justify-between gap-3 border-t border-white/10 pt-3">
        <div className="min-w-0">
          <p className="text-[10px] text-white/70 font-medium">
            Pemegang kartu
          </p>
          <p className="text-sm font-semibold truncate text-white">
            {customerName}
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-1.5 text-xs text-white/90 bg-white/10 px-2.5 py-1 rounded-lg border border-white/10">
          {isCompleted ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
          ) : (
            <Store className="w-3.5 h-3.5 text-white/70" />
          )}
          <span className="font-semibold">{isCompleted ? "Siap Klaim" : "Sedang Aktif"}</span>
        </div>
      </div>
    </div>
  );
}
