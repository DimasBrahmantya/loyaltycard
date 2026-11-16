"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BrandIntro } from "@/components/brand-intro";
import { HeroCardSimulator } from "@/components/hero-card-simulator";
import {
  CreditCard,
  QrCode,
  CheckCircle2,
  Stamp,
  Award,
  History,
} from "lucide-react";

export default function HomePage() {
  const [showIntro, setShowIntro] = useState(false);

  // Otomatis putar opening pada kunjungan awal (selama 2.5 detik lalu langsung masuk)
  useEffect(() => {
    const hasSeen = sessionStorage.getItem("seen_loyalty_intro");
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    sessionStorage.setItem("seen_loyalty_intro", "true");
    if (!hasSeen && !prefersReducedMotion) {
      setTimeout(() => setShowIntro(true), 0);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0b1120] text-slate-900 dark:text-slate-100 selection:bg-blue-900/10 selection:text-blue-900 dark:selection:text-blue-300">
      {/* Opening Intro Modal/Screen (Otomatis masuk setelah beberapa detik) */}
      <BrandIntro
        isOpen={showIntro}
        onClose={() => setShowIntro(false)}
        durationMs={2500}
      />

      {/* Navigation */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-md dark:border-slate-800/80 dark:bg-[#0b1120]/85 transition-colors">
        <div className="max-w-6xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 font-bold text-lg text-slate-900 dark:text-slate-100 group">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-600/25 group-hover:scale-105 transition-transform">
                <CreditCard className="h-5 w-5" />
              </div>
              <span className="tracking-tight">
                Loyalty<span className="text-blue-600 dark:text-blue-400">Card</span>
              </span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <a href="#alur-kasir" className="hover:text-slate-900 dark:hover:text-slate-100 transition">
              Cara Kerja
            </a>
            <a href="#fitur" className="hover:text-slate-900 dark:hover:text-slate-100 transition">
              Fitur Kasir
            </a>
            <a href="#mulai" className="hover:text-slate-900 dark:hover:text-slate-100 transition">
              Mulai Gratis
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/login">
              <Button variant="outline" size="sm" className="text-xs font-semibold border-slate-200 dark:border-slate-700">
                Masuk
              </Button>
            </Link>

            <Link href="/register">
              <Button size="sm" className="text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-600/20">
                Daftar Usaha Gratis
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative px-4 pt-12 pb-16 sm:pt-20 sm:pb-24 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
            {/* Left Column: Headline & Action */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 text-blue-700 dark:text-blue-300 text-xs font-semibold">
                <span>Tanpa Unduh Aplikasi &bull; Siap dalam 2 Menit</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-[52px] font-extrabold tracking-tight text-slate-900 dark:text-slate-50 leading-[1.12]">
                Apresiasi Pelanggan dengan{" "}
                <span className="text-blue-600 dark:text-blue-400">
                  Stempel Digital
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Gantikan kartu stempel kertas yang mudah hilang. Pelanggan cukup scan QR dari browser ponsel, kasir beri stempel dalam satu klik, dan reward ditukarkan secara akurat.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
                <Link href="/register" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto text-sm font-bold px-7 h-12 rounded-xl bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-600/25">
                    Mulai Buat Kartu Usaha
                  </Button>
                </Link>

                <Link href="/login" className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto text-sm font-semibold h-12 rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900">
                    Masuk ke Dashboard
                  </Button>
                </Link>
              </div>

              {/* Key Trust Highlights */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs font-semibold text-slate-700 dark:text-slate-300 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Cepat di meja kasir</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Pelanggan tanpa install app</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Riwayat audit terlindungi</span>
                </div>
              </div>
            </div>

            {/* Right Column: Live Interactive Card Simulator */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-[460px] p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/30 dark:to-slate-900 border border-blue-200/80 dark:border-blue-800/40 shadow-xl shadow-blue-600/10">
                <HeroCardSimulator />
              </div>
            </div>
          </div>
        </section>

        {/* Real Product Workflow Section */}
        <section id="alur-kasir" className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 py-16 sm:py-20">
          <div id="fitur" className="max-w-6xl mx-auto px-4 sm:px-6 space-y-10">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Alur Operasional di Meja Kasir
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Siklus nyata transaksi stempel dan klaim reward tanpa instalasi perangkat lunak tambahan.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
              {/* Step 1 */}
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start gap-4 hover:border-blue-300 dark:hover:border-blue-700 transition">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                  1
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Pelanggan Buka Kartu via QR</span>
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Pelanggan memindai kode QR usaha dari peramban ponsel mereka. Halaman kartu langsung aktif dan tersimpan di riwayat tanpa perlu membuat kata sandi.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start gap-4 hover:border-blue-300 dark:hover:border-blue-700 transition">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                  2
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Stamp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Kasir Beri Stempel &amp; Catat Nota</span>
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Kasir menekan tombol stempel dengan opsi menyertakan nomor nota transaksi. Jika ada salah input, stempel terakhir dapat dibatalkan secara aman.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start gap-4 hover:border-emerald-300 dark:hover:border-emerald-700 transition">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                  3
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Reward Terbuka Otomatis</span>
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Saat jumlah stempel mencapai target, tombol tukar hadiah aktif. Kasir memvalidasi penukaran, dan siklus kartu baru otomatis dimulai dari nol.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start gap-4 hover:border-blue-300 dark:hover:border-blue-700 transition">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                  4
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <History className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Riwayat Audit &amp; Multi-Kasir</span>
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Pemilik usaha memantau setiap transaksi stempel, nama kasir yang bertugas, waktu pemberian, dan rekap penukaran hadiah di dasbor admin.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Strip */}
        <section id="mulai" className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-blue-600 via-blue-800 to-slate-900 text-white border border-blue-500/30 shadow-xl space-y-4">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Siap Memulai Kartu Loyalitas untuk Usaha Anda?
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 max-w-md mx-auto leading-relaxed">
              Daftarkan usaha Anda, atur logo dan hadiah pertama, lalu mulai berikan stempel kepada pelanggan.
            </p>
            <div className="pt-2 flex justify-center">
              <Link href="/register">
                <Button size="lg" className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm px-8 h-12 rounded-xl shadow-lg shadow-orange-600/30">
                  Daftarkan Usaha Sekarang
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-8 text-xs text-slate-600 dark:text-slate-400">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
            <CreditCard className="w-4 h-4 text-blue-900 dark:text-blue-400" />
            <span>LoyaltyCard</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/terms"
              className="inline-flex min-h-11 items-center px-2 text-slate-600 hover:text-blue-900 dark:text-slate-400 dark:hover:text-blue-300 transition"
            >
              Syarat Layanan
            </Link>
            <Link
              href="/privacy"
              className="inline-flex min-h-11 items-center px-2 text-slate-600 hover:text-blue-900 dark:text-slate-400 dark:hover:text-blue-300 transition"
            >
              Kebijakan Privasi
            </Link>
            <span className="text-slate-400 dark:text-slate-600 select-none">&bull;</span>
            <p>&copy; 2026 LoyaltyCard. Hak cipta dilindungi.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
