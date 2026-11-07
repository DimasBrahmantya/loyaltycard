# LoyaltyCard — Kartu Loyalitas Digital Multi-Tenant

SaaS kartu loyalitas digital berbasis web untuk UMKM (kafe, barbershop, laundry, salon). Satu platform multi-tenant: Admin usaha membuat kartu untuk pelanggan, menambah stempel, menukar hadiah, dan mengelola staf. Pelanggan dapat memindai kode QR untuk melihat kartu stempel mereka secara real-time langsung melalui browser tanpa perlu instal aplikasi atau membuat akun.

---

## 🚀 Fitur Utama

- **Multi-Tenant Terisolasi**: Setiap usaha memiliki data terpisah yang diamankan langsung di level database menggunakan PostgreSQL Row Level Security (RLS).
- **Akses Publik Tanpa Login**: Pelanggan mengakses kartu melalui URL unik dengan token acak 192-bit (`/c/[token]`).
- **Pemberian & Pembatalan Stempel Atomik**: Transaksi stempel dan penukaran hadiah ditangani melalui PostgreSQL Stored Procedures (RPC) yang aman dari *race condition*.
- **Role-Based Access Control**:
  - **Owner**: Akses penuh ke seluruh fitur, pengaturan usaha (nama, logo, warna tema, hadiah), dan undang/hapus staf.
  - **Staff / Kasir**: Dapat membuat kartu pelanggan, menambah stempel, membatalkan stempel siklus berjalan, dan menukar hadiah. Tidak dapat mengubah pengaturan atau mengelola staf.
- **Kustomisasi Brand**: Unggah logo usaha dengan fitur *auto-cutout* (menghapus latar belakang otomatis) langsung di browser dan pratinjau kartu *real-time*.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org) (App Router) + TypeScript Strict Mode
- **Styling**: Tailwind CSS + shadcn/ui
- **Database & Auth**: [Supabase](https://supabase.com) (PostgreSQL, Row Level Security, Auth, Storage)
- **State & Validasi**: Server Actions, Zod, React Hook Form
- **QR Code**: `qrcode`
- **Testing Database**: `@electric-sql/pglite` (WASM PostgreSQL in-memory)
- **Deployment**: Vercel + Supabase

---

## 📋 Prasyarat

- Node.js versi 20+
- Package manager: `pnpm` (`npm install -g pnpm`)
- Akun dan project aktif di [Supabase](https://supabase.com)

---

## ⚙️ Panduan Setup Lokal

### 1. Clone & Install Dependency

```bash
git clone <url-repository>
cd loyaltycard
pnpm install
```

### 2. Konfigurasi Environment Variables

Salin file `.env.example` menjadi `.env.local`:

```bash
cp .env.example .env.local
```

Isi variabel environment berikut dengan kredensial project Supabase Anda:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key # HANYA DI SERVER
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> ⚠️ **PENTING**: `SUPABASE_SERVICE_ROLE_KEY` hanya digunakan di sisi server untuk mengundang staf baru melalui API Admin Supabase. Jangan pernah mengekspos kunci ini ke client atau repository.

### 3. Migrasi Database Supabase

1. Buka dashboard project Supabase Anda.
2. Masuk ke menu **SQL Editor**.
3. Buka file `supabase/migrations/0001_init.sql` dari project ini, salin seluruh isinya, dan jalankan (Run) di SQL Editor.
4. Migrasi ini otomatis membuat:
   - Tabel: `tenants`, `tenant_members`, `customers`, `cards`, `stamps`, `redemptions`.
   - Views: `transaction_history`.
   - RLS Policies & Helper Functions: `is_member()`, `is_owner()`.
   - Stored Procedures (RPC): `create_tenant`, `create_card`, `add_stamp`, `void_stamp`, `redeem_card`, `get_public_card`.
   - Storage Bucket `logos` beserta kebijakan akses RLS-nya.

### 4. Menjalankan Tes Database & Keamanan

Project ini menyertakan suite pengujian SQL otomatis menggunakan PostgreSQL PGlite (WASM) tanpa perlu koneksi internet:

```bash
pnpm test:db
```

Tes ini memverifikasi:
- **01_rls_isolation.sql**: Isolasi RLS antar-tenant A dan B, penolakan akses select/update silang tenant, penolakan akses langsung untuk anon, dan verifikasi `get_public_card`.
- **02_concurrency_add_stamp.sql**: Pengujian batas stempel (10 stempel), proteksi konkurensi (penolakan stempel ke-11 dengan `card_full`), reset kartu pada penukaran hadiah, serta penolakan `void_stamp` pada siklus lama (`old_cycle`).
- **03_staff_permissions.sql**: Pengujian pembatasan peran staf (staf dilarang mengubah data tenant, dilarang menghapus kartu/pelanggan, namun berhak menambah/membatalkan stempel).

### 5. Menjalankan Aplikasi di Mode Pengembangan

```bash
pnpm dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser Anda:
- `/login` & `/register`: Autentikasi pengguna.
- `/onboarding`: Pendaftaran usaha pertama kali bagi pengguna baru.
- `/admin`: Dashboard ringkasan usaha, manajemen kartu, pelanggan, dan riwayat transaksi.
- `/admin/settings` & `/admin/staff`: Pengaturan brand dan manajemen staf (hanya untuk owner).
- `/c/[token]`: Tampilan kartu loyalitas digital pelanggan (read-only, responsive mobile-first).

---

## 🚢 Panduan Deploy ke Vercel

1. Push kode ke repository GitHub / GitLab.
2. Buka [Vercel Dashboard](https://vercel.com) dan klik **Add New Project**.
3. Import repository project `loyaltycard`.
4. Pada bagian **Environment Variables**, tambahkan 4 variabel yang sama persis seperti di `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL` (arahkan ke domain produksi Vercel Anda, misal: `https://loyaltycard-app.vercel.app`)
5. Klik **Deploy**.
6. Setelah deployment selesai, buka project Supabase Anda:
   - Masuk ke **Authentication -> URL Configuration**.
   - Tambahkan URL domain Vercel Anda ke **Site URL** dan **Redirect URLs**.

---

## 🔒 Checklist Keamanan

- [x] RLS aktif di seluruh tabel database publik.
- [x] Tidak ada update langsung ke tabel `cards`, `stamps`, `redemptions` dari client (wajib melalui RPC).
- [x] Token kartu publik dibuat acak 192-bit (`extensions.gen_random_bytes(24)`).
- [x] Validasi Zod diterapkan di setiap Server Action.
- [x] Kredensial `SUPABASE_SERVICE_ROLE_KEY` tidak muncul di client bundle atau file bertanda `"use client"`.
- [x] Header `X-Robots-Tag: noindex` dan rate-limiting IP diterapkan pada rute publik `/c/*`.
- [x] Sanitasi output HTML untuk mencegah kerentanan injection pada fitur cetak QR.
