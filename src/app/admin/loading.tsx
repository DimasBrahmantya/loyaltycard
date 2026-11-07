import { Loader2 } from "lucide-react";

export default function AdminLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center"
    >
      <Loader2 aria-hidden="true" className="h-6 w-6 animate-spin text-stone-600 dark:text-stone-400" />
      <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
        Memuat data usaha Anda
      </p>
      <p className="text-xs text-stone-600 dark:text-stone-400">
        Mengambil kartu, pelanggan, dan riwayat terbaru.
      </p>
    </div>
  );
}

