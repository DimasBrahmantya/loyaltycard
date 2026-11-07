"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";

export default function CustomerCardError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen bg-[#0c0d0e] text-white flex flex-col items-center justify-center p-4">
      <div
        role="alert"
        className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-6 text-center space-y-4"
      >
        <div className="w-12 h-12 rounded-full bg-red-950/60 border border-red-800/60 flex items-center justify-center mx-auto text-red-300">
          <AlertCircle aria-hidden="true" className="w-6 h-6" />
        </div>
        <div className="space-y-1.5">
          <h1 className="text-lg font-bold text-white">Kartu belum bisa dibuka</h1>
          <p className="text-xs text-stone-400 leading-relaxed">
            Koneksi internet terputus atau server sedang bermasalah. Kartu dan stempel Anda aman. Coba lagi sebentar.
          </p>
        </div>
        <button
          type="button"
          onClick={() => retry()}
          className="w-full min-h-11 rounded-xl bg-stone-800 hover:bg-stone-700 text-sm font-semibold text-stone-100 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-stone-900"
        >
          Coba Buka Lagi
        </button>
      </div>
    </main>
  );
}

