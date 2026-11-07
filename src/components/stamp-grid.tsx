import React from "react";
import { Check } from "lucide-react";

export interface StampGridProps {
  stampsCount: number;
  stampsRequired: number;
  brandColor: string;
  logoUrl?: string | null;
  className?: string;
}

export function StampGrid({
  stampsCount,
  stampsRequired,
  brandColor,
  logoUrl,
  className = "",
}: StampGridProps) {
  const slots = Array.from({ length: stampsRequired }, (_, index) => {
    const isFilled = index < stampsCount;
    return { slotNumber: index + 1, isFilled };
  });

  return (
    <div
      className={`grid grid-cols-5 gap-2.5 sm:gap-3 justify-items-center w-full py-2 ${className}`}
      role="group"
      aria-label="Kotak Stempel"
    >
      {slots.map(({ slotNumber, isFilled }) => {
        if (isFilled) {
          return (
            <div
              key={slotNumber}
              className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center shadow-md transition-transform duration-200 hover:scale-105"
              style={{ backgroundColor: brandColor }}
              title={`Stempel ke-${slotNumber} terisi`}
              aria-label={`Stempel ke-${slotNumber} terisi`}
            >
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="w-6 h-6 object-contain"
                  style={{ filter: "brightness(0) invert(1)" }}
                />
              ) : (
                <Check className="w-6 h-6 text-white stroke-[3]" />
              )}
            </div>
          );
        }

        return (
          <div
            key={slotNumber}
            className="w-12 h-12 rounded-full border-2 border-dashed border-white/50 bg-black/10 flex items-center justify-center text-white/80 font-semibold text-sm transition-opacity hover:opacity-100"
            title={`Stempel ke-${slotNumber} kosong`}
            aria-label={`Stempel ke-${slotNumber} kosong`}
          >
            {slotNumber}
          </div>
        );
      })}
    </div>
  );
}

