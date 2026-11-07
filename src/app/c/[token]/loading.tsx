import { Loader2 } from "lucide-react";

export default function CustomerCardLoading() {
  return (
    <main className="min-h-screen bg-[#0c0d0e] text-white flex flex-col items-center justify-center p-4">
      <div role="status" aria-live="polite" className="flex flex-col items-center gap-3 text-center">
        <Loader2 aria-hidden="true" className="h-6 w-6 animate-spin text-stone-300" />
        <p className="text-sm font-semibold text-stone-100">Membuka kartu loyalitas Anda</p>
        <p className="text-xs text-stone-400">Mengambil jumlah stempel terbaru.</p>
      </div>
    </main>
  );
}

