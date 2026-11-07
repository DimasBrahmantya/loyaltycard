import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CreditCard, QrCode, Sparkles, CheckCircle2 } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* Navigation */}
      <header className="border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="max-w-6xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2 font-bold text-xl text-orange-600 dark:text-orange-500">
            <CreditCard className="h-6 w-6" />
            <span>LoyaltyCard</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Masuk
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Daftar Sekarang</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 sm:py-24 text-center">
        <div className="max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-medium text-orange-800 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-300">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Kartu Loyalitas Digital Multi-Tenant untuk UMKM</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight">
            Tingkatkan Pelanggan Setia dengan{" "}
            <span className="text-orange-600 dark:text-orange-500">
              Kartu Stempel Digital
            </span>
          </h1>

          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
            Satu kartu per pelanggan. Scan QR, tambah stempel, tukar hadiah.
            Pelanggan tidak perlu download aplikasi atau registrasi akun.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link href="/register" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto text-base px-8">
                Mulai Buat Kartu Gratis
              </Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-base">
                Masuk ke Dashboard
              </Button>
            </Link>
          </div>

          {/* Key Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-12 text-left">
            <div className="p-4 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <QrCode className="h-8 w-8 text-orange-600 mb-3" />
              <h3 className="font-semibold text-base mb-1">Akses Scan QR Instan</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Pelanggan cukup scan QR untuk melihat kartu dan jumlah stempel mereka secara real-time.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <CheckCircle2 className="h-8 w-8 text-orange-600 mb-3" />
              <h3 className="font-semibold text-base mb-1">Stempel & Tukar Hadiah</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Kasir menambah stempel dalam 1 klik. Saat penuh, tukar hadiah dan siklus otomatis di-reset.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <CreditCard className="h-8 w-8 text-orange-600 mb-3" />
              <h3 className="font-semibold text-base mb-1">Kustomisasi Brand</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Atur logo usaha, warna tema brand, hadiah gratis, dan jumlah stempel yang dibutuhkan.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 py-6 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-500">
        <p>&copy; 2026 LoyaltyCard. Hak cipta dilindungi.</p>
      </footer>
    </div>
  );
}
