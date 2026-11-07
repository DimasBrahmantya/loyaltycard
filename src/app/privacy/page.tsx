import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CreditCard } from "lucide-react";

export const metadata = {
  title: "Kebijakan Privasi: LoyaltyCard",
  description: "Kebijakan Privasi Penggunaan Layanan LoyaltyCard",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between">
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
            <CreditCard className="w-5 h-5 text-blue-900 dark:text-blue-400" />
            <span>LoyaltyCard</span>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 text-xs">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Beranda</span>
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12 flex-1 w-full space-y-8">
        <div className="space-y-2 border-b border-slate-200 dark:border-slate-800 pb-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Kebijakan Privasi
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Terakhir diperbarui: 7 November 2026
          </p>
        </div>

        <div className="prose dark:prose-invert max-w-none text-sm text-slate-700 dark:text-slate-300 space-y-6">
          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              1. Data yang Dikumpulkan
            </h2>
            <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-600 dark:text-slate-400">
              [TEKS LEGAL DARI PEMILIK: Tuliskan data yang diproses sistem seperti nama pelanggan, nomor telepon jika ada, alamat email merchant, serta data log transaksi stempel di sini.]
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              2. Penggunaan Informasi
            </h2>
            <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-600 dark:text-slate-400">
              [TEKS LEGAL DARI PEMILIK: Jelaskan tujuan penggunaan data hanya untuk verifikasi kepemilikan kartu loyalitas, pencegahan kecurangan stempel, dan pencatatan riwayat di sini.]
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              3. Keamanan Data dan Pihak Ketiga
            </h2>
            <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-600 dark:text-slate-400">
              [TEKS LEGAL DARI PEMILIK: Jelaskan standar penyimpanan basis data aman di Supabase dan kebijakan bahwa data pelanggan tidak diperjualbelikan kepada pihak ketiga di sini.]
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              4. Hak Pengguna & Penghapusan Akun
            </h2>
            <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-600 dark:text-slate-400">
              [TEKS LEGAL DARI PEMILIK: Cantumkan tata cara permohonan penghapusan kartu atau data bisnis oleh merchant maupun pembeli di sini.]
            </div>
          </section>
        </div>
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
        <p>&copy; 2026 LoyaltyCard. Hak cipta dilindungi.</p>
      </footer>
    </div>
  );
}

