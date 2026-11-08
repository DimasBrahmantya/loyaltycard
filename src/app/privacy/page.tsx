import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  CreditCard,
  ShieldCheck,
  Lock,
  Database,
  EyeOff,
  UserCheck,
  Trash2,
  Mail,
} from "lucide-react";

export const metadata = {
  title: "Kebijakan Privasi: LoyaltyCard",
  description: "Kebijakan privasi resmi dan perlindungan data pengguna platform LoyaltyCard.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100 group">
            <div className="w-8 h-8 rounded-lg bg-blue-900/10 border border-blue-900/20 flex items-center justify-center text-blue-900 dark:text-blue-400 group-hover:scale-105 transition-transform">
              <CreditCard className="w-4 h-4" />
            </div>
            <span className="text-base font-bold">LoyaltyCard</span>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 text-xs">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Beranda</span>
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-10 sm:py-14 flex-1 w-full space-y-10">
        <div className="space-y-3 border-b border-slate-200 dark:border-slate-800 pb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Perlindungan Data & Privasi</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Kebijakan Privasi
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
            Di LoyaltyCard, privasi dan kedaulatan data bisnis serta pelanggan Anda adalah prioritas mutlak kami. Dokumen ini menjelaskan secara transparan bagaimana data dikumpulkan, diproses, dan dilindungi.
          </p>
          <p className="text-[11px] text-slate-600 dark:text-slate-400">
            Terakhir diperbarui: 8 November 2026 &bull; Mematuhi prinsip UU Perlindungan Data Pribadi (UU PDP No. 27/2022)
          </p>
        </div>

        <div className="space-y-10 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          {/* Bagian 1 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-blue-900 dark:text-blue-400 shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <h2>1. Prinsip Utama Privasi Kami</h2>
            </div>
            <div className="pl-9 space-y-2 text-xs sm:text-sm">
              <p>
                1.1. <strong>Minimalisasi Data:</strong> Kami hanya mengumpulkan data yang benar-benar esensial untuk mengoperasikan kartu stempel digital. Pelanggan toko tidak dipaksa mengunduh aplikasi atau membuat akun dengan kata sandi.
              </p>
              <p>
                1.2. <strong>Bebas Pelacak & Iklan Pihak Ketiga:</strong> Kami tidak pernah menjual, menyewakan, atau memperdagangkan data Anda maupun data pelanggan Anda kepada pihak ketiga untuk kepentingan iklan terarah (*targeted ads*).
              </p>
              <p>
                1.3. <strong>Kedaulatan Merchant:</strong> Setiap data pelanggan dan kartu yang Anda terbitkan adalah milik bisnis Anda seutuhnya.
              </p>
            </div>
          </section>

          {/* Bagian 2 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-blue-900 dark:text-blue-400 shrink-0">
                <Database className="w-4 h-4" />
              </div>
              <h2>2. Data yang Dikumpulkan</h2>
            </div>
            <div className="pl-9 space-y-3 text-xs sm:text-sm">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">A. Data Pengguna Usaha (Merchant & Staf)</h3>
                <ul className="list-disc list-inside mt-1 space-y-1 pl-1">
                  <li>Alamat email untuk autentikasi dan masuk ke sistem.</li>
                  <li>Kata sandi yang disimpan dalam bentuk *hash* satu arah terenkripsi tingkat tinggi (*bcrypt/Argon2* melalui Supabase Auth).</li>
                  <li>Informasi profil usaha: Nama bisnis, logo gerai, warna tema kartu, aturan stempel target, dan deskripsi reward.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">B. Data Pelanggan Toko</h3>
                <ul className="list-disc list-inside mt-1 space-y-1 pl-1">
                  <li>Nama pelanggan atau nama panggilan untuk personalisasi kartu.</li>
                  <li>Nomor telepon pelanggan (opsional, semata-mata untuk memudahkan pencarian oleh kasir saat pelanggan tidak membawa HP).</li>
                  <li>Token kartu publik acak (192-bit) yang tidak memuat informasi pribadi sensitif secara kasat mata.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">C. Data Riwayat Transaksi & Stempel</h3>
                <ul className="list-disc list-inside mt-1 space-y-1 pl-1">
                  <li>Jumlah perolehan stempel dan siklus reward yang telah ditukarkan.</li>
                  <li>Waktu (*timestamp*) saat stempel diberikan, dibatalkan (*void*), atau reward ditukarkan.</li>
                  <li>ID staf/kasir yang memvalidasi penambahan stempel demi keperluan audit internal merchant.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Bagian 3 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-blue-900 dark:text-blue-400 shrink-0">
                <UserCheck className="w-4 h-4" />
              </div>
              <h2>3. Tujuan Penggunaan Informasi</h2>
            </div>
            <div className="pl-9 space-y-2 text-xs sm:text-sm">
              <p>
                Informasi yang dikumpulkan digunakan secara eksklusif untuk tujuan operasional berikut:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-1">
                <li>Menampilkan tampilan kartu loyalitas digital real-time kepada pelanggan saat membuka tautan atau memindai kode QR.</li>
                <li>Memfasilitasi pemindaian QR oleh kasir berwenang untuk menambah stempel secara otomatis dan aman.</li>
                <li>Menyediakan dasbor analitik ringkasan usaha dan log riwayat audit bagi pemilik bisnis.</li>
                <li>Mencegah penyalahgunaan, penipuan (*fraud*), peretasan, dan percobaan manipulasi data stempel.</li>
              </ul>
            </div>
          </section>

          {/* Bagian 4 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-blue-900 dark:text-blue-400 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h2>4. Arsitektur Keamanan & Isolasi Data Multi-Tenant</h2>
            </div>
            <div className="pl-9 space-y-2 text-xs sm:text-sm">
              <p>
                4.1. <strong>PostgreSQL Row Level Security (RLS):</strong> Kami menerapkan kebijakan isolasi database setingkat kernel basis data. Merchant A secara teknis dan matematis tidak memiliki izin (*forbidden*) untuk membaca, menulis, atau memodifikasi data milik Merchant B.
              </p>
              <p>
                4.2. <strong>Enkripsi Komunikasi:</strong> Seluruh komunikasi data antara peramban (*browser*) Anda dan server kami dienkripsi menggunakan protokol Transport Layer Security (TLS 1.3 / HTTPS).
              </p>
              <p>
                4.3. <strong>Stored Procedures Atomik (RPC):</strong> Penambahan stempel dan penukaran hadiah tidak dapat dimanipulasi secara langsung dari sisi peramban klien, melainkan diproteksi melalui fungsi basis data yang aman dari kondisi balapan (*race condition*).
              </p>
            </div>
          </section>

          {/* Bagian 5 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-blue-900 dark:text-blue-400 shrink-0">
                <EyeOff className="w-4 h-4" />
              </div>
              <h2>5. Pembagian Informasi & Pihak Ketiga</h2>
            </div>
            <div className="pl-9 space-y-2 text-xs sm:text-sm">
              <p>
                5.1. Kami hanya bekerja sama dengan penyedia infrastruktur cloud global terkemuka yang mematuhi standar sertifikasi keamanan internasional (ISO 27001, SOC 2 Type II), yaitu <strong>Supabase Inc.</strong> dan <strong>Vercel Inc.</strong> sebagai penyedia hosting basis data dan komputasi server.
              </p>
              <p>
                5.2. Kami tidak pernah membagikan data kepada pihak beriklan atau jaringan broker data mana pun.
              </p>
              <p>
                5.3. Kami hanya akan mengungkap data kepada instansi penegak hukum yang berwenang apabila diwajibkan secara tegas oleh penetapan pengadilan atau ketentuan hukum Republik Indonesia yang sah.
              </p>
            </div>
          </section>

          {/* Bagian 6 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-blue-900 dark:text-blue-400 shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <h2>6. Hak Subjek Data & Permohonan Penghapusan Akun</h2>
            </div>
            <div className="pl-9 space-y-2 text-xs sm:text-sm">
              <p>
                6.1. <strong>Hak Merchant:</strong> Pemilik usaha berhak mengubah data bisnis, memperbarui logo, mengelola daftar staf, atau meminta penutupan permanen seluruh data usaha beserta kartu pelanggannya.
              </p>
              <p>
                6.2. <strong>Hak Pelanggan:</strong> Pelanggan berhak meminta merchant tempat ia berbelanja untuk menghapus kartu dan riwayat stempelnya dari sistem kapan saja.
              </p>
              <p>
                6.3. Apabila merchant memutuskan untuk berhenti berlangganan, seluruh data kartu dan riwayat transaksi akan dihapus secara tuntas (*hard-delete*) sesuai prosedur retensi data yang berlaku.
              </p>
            </div>
          </section>

          {/* Bagian 7 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-blue-900 dark:text-blue-400 shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <h2>7. Kontak Petugas Privasi & Keamanan Data</h2>
            </div>
            <div className="pl-9 space-y-2 text-xs sm:text-sm">
              <p>
                Jika Anda memiliki pertanyaan mengenai Kebijakan Privasi ini, ingin menyampaikan pengaduan terkait perlindungan data pribadi, atau mengajukan permohonan penghapusan data, silakan hubungi kami di:
              </p>
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 text-xs">
                <p className="font-semibold text-slate-900 dark:text-slate-100">Tim Kepatuhan & Privasi Data LoyaltyCard</p>
                <p className="text-slate-600 dark:text-slate-400">Email: <span className="font-mono text-blue-900 dark:text-blue-400">tonjel209@gmail.com</span></p>
                <p className="text-slate-600 dark:text-slate-400">Waktu Tanggapan: Maksimal 2x24 jam kerja</p>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>&copy; 2026 LoyaltyCard. Hak cipta dilindungi.</p>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-blue-900 dark:hover:text-blue-300 transition">
              Syarat Layanan
            </Link>
            <Link href="/" className="hover:text-blue-900 dark:hover:text-blue-300 transition">
              Beranda
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
