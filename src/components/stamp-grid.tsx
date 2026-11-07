import React from "react";
import { Check } from "lucide-react";

export interface StampGridProps {
  stampsCount: number;
  stampsRequired: number;
  brandColor: string;
  logoUrl?: string | null;
  stampIconUrl?: string | null;
  stampColor?: string;
  stampHasBorder?: boolean;
  className?: string;
}

export function StampGrid({
  stampsCount,
  stampsRequired,
  brandColor,
  logoUrl,
  stampIconUrl,
  stampColor = "#ffffff",
  stampHasBorder = true,
  className = "",
}: StampGridProps) {
  const activeIconUrl = stampIconUrl || logoUrl;
  const effectiveStampColor = stampColor || "#ffffff";

  const slots = Array.from({ length: stampsRequired }, (_, index) => {
    const isFilled = index < stampsCount;
    return { slotNumber: index + 1, isFilled };
  });

  return (
    <div
      className={`grid grid-cols-5 gap-2.5 sm:gap-3.5 justify-items-center w-full py-2.5 ${className}`}
      role="group"
      aria-label="Kotak Stempel Loyalitas"
    >
      {slots.map(({ slotNumber, isFilled }) => {
        if (isFilled) {
          return (
            <div
              key={slotNumber}
              className={`relative w-12 h-12 sm:w-13 sm:h-13 rounded-full flex items-center justify-center transition-transform duration-200 hover:scale-105 animate-stamp-pop ${
                stampHasBorder ? "ring-2" : ""
              }`}
              style={{
                backgroundColor: brandColor,
                boxShadow: `0 4px 14px -2px ${brandColor}80, inset 0 2px 4px rgba(255, 255, 255, 0.35)`,
                borderColor: stampHasBorder ? effectiveStampColor : "transparent",
                outlineColor: stampHasBorder ? `${effectiveStampColor}dd` : "transparent",
              }}
              title={`Stempel ke-${slotNumber} terisi`}
              aria-label={`Stempel ke-${slotNumber} terisi`}
            >
              {activeIconUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={activeIconUrl}
                  alt="Ikon Stempel"
                  className="w-6 h-6 object-contain"
                  style={{
                    filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.4))",
                  }}
                />
              ) : (
                <Check
                  className="w-5 h-5 stroke-[3] drop-shadow-sm"
                  style={{ color: effectiveStampColor }}
                />
              )}
              {/* Micro badge angka kecil di sudut stempel */}
              <span
                className="absolute -bottom-1 -right-0.5 w-4 h-4 rounded-full bg-slate-950/90 text-[9px] font-bold text-white flex items-center justify-center border"
                style={{ borderColor: effectiveStampColor }}
              >
                {slotNumber}
              </span>
            </div>
          );
        }

        return (
          <div
            key={slotNumber}
            className="w-12 h-12 sm:w-13 sm:h-13 rounded-full border border-dashed border-white/30 bg-black/20 backdrop-blur-xs flex items-center justify-center text-white/50 font-semibold text-xs transition-colors hover:border-white/50 hover:text-white/80 shadow-inner"
            title={`Stempel ke-${slotNumber} belum terisi`}
            aria-label={`Stempel ke-${slotNumber} belum terisi`}
          >
            {slotNumber}
          </div>
        );
      })}
    </div>
  );
}
