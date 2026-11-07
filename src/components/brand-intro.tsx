"use client";

import React, { useEffect, useRef, useState } from "react";
import { ShieldCheck, CreditCard } from "lucide-react";

interface BrandIntroProps {
  isOpen: boolean;
  onClose: () => void;
  durationMs?: number;
}

const FADE_OUT_MS = 400;

export function BrandIntro({ isOpen, onClose, durationMs = 2500 }: BrandIntroProps) {
  const [fadingOut, setFadingOut] = useState(false);
  const skipRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Tutup otomatis setelah durationMs; pengunjung bisa melewati kapan saja.
  useEffect(() => {
    if (!isOpen) return;
    const autoClose = setTimeout(() => setFadingOut(true), durationMs);
    return () => {
      clearTimeout(autoClose);
      setFadingOut(false);
    };
  }, [isOpen, durationMs]);

  useEffect(() => {
    if (!fadingOut) return;
    const finish = setTimeout(() => onCloseRef.current(), FADE_OUT_MS);
    return () => clearTimeout(finish);
  }, [fadingOut]);

  // Fokus ke tombol Lewati, Escape melewati, Tab tidak keluar dari dialog (R-32).
  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    skipRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setFadingOut(true);
      } else if (event.key === "Tab") {
        event.preventDefault();
        skipRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Opening Aplikasi LoyaltyCard"
      className={`fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#0b1120] text-white transition-opacity duration-400 ${
        fadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Decorative frame border */}
      <div className="absolute inset-0 border border-white/[0.06] m-4 sm:m-8 rounded-3xl pointer-events-none" />

      <button
        ref={skipRef}
        type="button"
        onClick={() => setFadingOut(true)}
        className="absolute top-6 right-6 sm:top-10 sm:right-10 z-20 inline-flex min-h-11 items-center justify-center rounded-lg border border-white/20 px-4 text-sm font-semibold text-slate-200 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1120]"
      >
        Lewati
      </button>

      <div className="relative z-10 max-w-md w-full flex flex-col items-center text-center space-y-6 animate-intro-in">
        {/* Emblem & Monogram */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center">
          <CreditCard aria-hidden="true" className="w-10 h-10 sm:w-12 sm:h-12 text-blue-400 stroke-[1.75]" />
        </div>

        {/* Brand Name & Typography */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-slate-700 bg-slate-800/80 text-[11px] font-medium text-slate-300">
            <ShieldCheck aria-hidden="true" className="w-3.5 h-3.5 text-blue-400" />
            <span>Digital Loyalty System</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-100">
            Loyalty<span className="text-blue-400">Card</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xs mx-auto leading-relaxed">
            Membangun kedekatan pelanggan dengan kartu stempel digital yang elegan dan mudah.
          </p>
        </div>
      </div>
    </div>
  );
}
