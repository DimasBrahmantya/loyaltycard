import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  CreditCard,
  ShieldCheck,
  FileText,
  Users,
  Gift,
  AlertTriangle,
  Scale,
  Mail,
} from "lucide-react";

export const metadata = {
  title: "Syarat dan Ketentuan Layanan: LoyaltyCard",
  description: "Syarat dan ketentuan resmi penggunaan platform kartu loyalitas digital LoyaltyCard.",
};

export default function TermsPage() {
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
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-900 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Dokumen Resmi Layanan</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Syarat dan Ketentuan Layanan
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
            Selamat datang di LoyaltyCard. Perjanjian ini mengatur hak dan kewajiban hukum antara pihak pengelola platform, pemilik usaha (merchant), staf/kasir, dan pelanggan akhir yang menggunakan layanan kami.
          </p>
          <p className="text-[11px] text-slate-600 dark:text-slate-400">
            Terakhir diperbarui: 8 November 2026 &bull; Berlaku efektif sejak tanggal dipublikasikan
          </p>
        </div>

        <div className="space-y-10 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          {/* Bagian 1 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-blue-900 dark:text-blue-400 shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <h2>1. Ketentuan Umum & Ruang Lingkup Layanan</h2>
            </div>
            <div className="pl-9 space-y-2 text-xs sm:text-sm">
              <p>
                1.1. <strong>LoyaltyCard</strong> (&quot;Kami&quot; atau &quot;Platform&quot;) adalah penyedia solusi perangkat lunak berbasis cloud (*Software-as-a-Service*) yang memfasilitasi pembuatan, pengelolaan, dan pencatatan kartu stempel loyalitas digital multi-tenant bagi pelaku usaha (&quot;Merchant&quot;).
              </p>
              <p>
                1.2. Dengan mendaftar, mengakses, atau menggunakan layanan LoyaltyCard (baik melalui panel admin maupun tautan kartu publik), Anda menyatakan telah membaca, memahami, dan menyetujui seluruh ketentuan yang tercantum dalam dokumen ini.
              </p>
              <p>
                1.3. Jika Anda bertindak atas nama badan usaha atau kemitraan, Anda menyatakan memiliki wewenang hukum penuh untuk mengikat entitas tersebut pada syarat layanan ini.
              </p>
            </div>
          </section>

          {/* Bagian 2 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-blue-900 dark:text-blue-400 shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <h2>2. Pendaftaran Akun, Peran, dan Tanggung Jawab Staf</h2>
            </div>
            <div className="pl-9 space-y-2 text-xs sm:text-sm">
              <p>
                2.1. <strong>Akun Pemilik (Owner):</strong> Pendaftar pertama berhak mengatur identitas bisnis, logo, jumlah stempel target, jenis hadiah, serta mengundang staf tambahan ke dalam akun usaha.
              </p>
              <p>
                2.2. <strong>Akun Staf / Kasir:</strong> Staf yang diundang memiliki izin terbatas untuk memvalidasi kartu, menambah stempel melalui pemindaian QR code kasir, membatalkan stempel pada siklus berjalan, dan memproses penukaran reward pelanggan.
              </p>
              <p>
                2.3. <strong>Keamanan Kredensial:</strong> Pengguna wajib menjaga kerahasiaan kata sandi dan token akses akun. Segala transaksi stempel yang dilakukan melalui akun kasir yang sah dianggap sebagai tindakan resmi yang sah dari merchant terkait.
              </p>
              <p>
                2.4. Merchant bertanggung jawab penuh untuk segera menonaktifkan atau menghapus akun staf yang sudah tidak bekerja pada unit usahanya.
              </p>
            </div>
          </section>

          {/* Bagian 3 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-blue-900 dark:text-blue-400 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h2>3. Mekanisme Penerbitan Stempel & Anti-Kecurangan</h2>
            </div>
            <div className="pl-9 space-y-2 text-xs sm:text-sm">
              <p>
                3.1. Penambahan stempel digital hanya dapat dilakukan oleh kasir terautentikasi melalui fitur pemindai QR kasir resmi atau input manual di dashboard kasir.
              </p>
              <p>
                3.2. Pelanggan dilarang keras mencoba memanipulasi parameter URL, merekayasa kode token, atau menggunakan skrip otomatis untuk menghasilkan stempel tanpa transaksi belanja yang sah di gerai merchant.
              </p>
              <p>
                3.3. Setiap upaya manipulasi data stempel, penipuan, atau pelanggaran akses basis data akan mengakibatkan pemblokiran token kartu secara permanen dan dapat dilaporkan kepada pihak yang berwajib sesuai peraturan perundang-undangan.
              </p>
              <p>
                3.4. Kasir berhak membatalkan (*void*) stempel jika terjadi kesalahan input atau pembatalan transaksi pembelian barang/jasa dalam waktu yang wajar.
              </p>
            </div>
          </section>

          {/* Bagian 4 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-blue-900 dark:text-blue-400 shrink-0">
                <Gift className="w-4 h-4" />
              </div>
              <h2>4. Penukaran Hadiah & Batasan Tanggung Jawab Merchant</h2>
            </div>
            <div className="pl-9 space-y-2 text-xs sm:text-sm">
              <p>
                4.1. <strong>Kewajiban Merchant:</strong> Pemberian hadiah fisik, produk gratis, voucher, atau diskon yang dijanjikan pada kartu loyalitas sepenuhnya menjadi tanggung jawab masing-masing Merchant.
              </p>
              <p>
                4.2. <strong>Peran LoyaltyCard:</strong> Platform hanya bertindak sebagai media pencatatan digital dan sistem verifikasi stempel. LoyaltyCard tidak memegang kepemilikan barang fisik dan tidak bertanggung jawab atas kegagalan pemenuhan hadiah fisik oleh pihak merchant kepada pelanggan.
              </p>
              <p>
                4.3. Segala bentuk sengketa antara pelanggan dan merchant mengenai kualitas produk, ketersediaan stok hadiah, atau masa berlaku promosi diselesaikan secara langsung antara pelanggan dan merchant bersangkutan.
              </p>
            </div>
          </section>

          {/* Bagian 5 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-blue-900 dark:text-blue-400 shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h2>5. Ketersediaan Layanan & Pemeliharaan Sistem</h2>
            </div>
            <div className="pl-9 space-y-2 text-xs sm:text-sm">
              <p>
                5.1. Kami berkomitmen untuk menjaga ketersediaan layanan secara maksimal dengan standar infrastruktur teknologi tinggi. Namun, Kami tidak menjamin bahwa layanan akan bebas dari interupsi sementara akibat pemeliharaan jaringan, pembaruan perangkat lunak, atau gangguan penyedia hulu (ISP/Cloud).
              </p>
              <p>
                5.2. Dalam batas yang diizinkan hukum, LoyaltyCard tidak bertanggung jawab atas kerugian tidak langsung, kehilangan potensi keuntungan bisnis, atau gangguan operasional toko yang timbul dari kendala koneksi internet lokal di pihak pengguna.
              </p>
            </div>
          </section>

          {/* Bagian 6 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-blue-900 dark:text-blue-400 shrink-0">
                <Scale className="w-4 h-4" />
              </div>
              <h2>6. Hak Kekayaan Intelektual</h2>
            </div>
            <div className="pl-9 space-y-2 text-xs sm:text-sm">
              <p>
                6.1. Seluruh kode program, desain antarmuka, algoritma, merek dagang, dan dokumentasi LoyaltyCard adalah hak milik eksklusif pengembang LoyaltyCard dan dilindungi undang-undang hak cipta.
              </p>
              <p>
                6.2. Logo, nama dagang, dan materi merek yang diunggah oleh Merchant tetap menjadi hak milik penuh masing-masing Merchant. Merchant memberikan lisensi non-eksklusif kepada Platform untuk menampilkan aset tersebut semata-mata demi keperluan rendering kartu loyalitas.
              </p>
            </div>
          </section>

          {/* Bagian 7 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-blue-900 dark:text-blue-400 shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <h2>7. Perubahan Ketentuan & Saluran Kontak</h2>
            </div>
            <div className="pl-9 space-y-2 text-xs sm:text-sm">
              <p>
                7.1. Kami berhak memperbarui dokumen Syarat dan Ketentuan ini dari waktu ke waktu untuk menyesuaikan dengan pengembangan fitur atau regulasi hukum yang berlaku. Pembaruan akan diumumkan melalui halaman ini.
              </p>
              <p>
                7.2. Apabila Anda memiliki pertanyaan, klarifikasi hukum, atau kendala terkait ketentuan layanan ini, silakan hubungi tim kami melalui:
              </p>
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 text-xs">
                <p className="font-semibold text-slate-900 dark:text-slate-100">Dukungan Pengguna & Kepatuhan Legal LoyaltyCard</p>
                <p className="text-slate-600 dark:text-slate-400">Email: <span className="font-mono text-blue-900 dark:text-blue-400">tonjel209@gmail.com</span></p>
                <p className="text-slate-600 dark:text-slate-400">Waktu Operasional Bantuan: Senin - Sabtu (08.00 - 17.00 WIB)</p>
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
            <Link href="/privacy" className="hover:text-blue-900 dark:hover:text-blue-300 transition">
              Kebijakan Privasi
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
