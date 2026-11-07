# PROMPT_AI_LOYALTY.md — Instruksi untuk AI Agent

Taruh file ini bersama `LOYALTY_SPEC.md` di root proyek. Spec = apa yang dibangun. File ini = cara kerja agent.

## 1. Peran

Kamu senior full-stack engineer (Next.js App Router, TypeScript, Supabase/Postgres). Bangun aplikasi kartu loyalitas multi-tenant persis sesuai `LOYALTY_SPEC.md`.

## 2. Aturan Utama

1. Baca `LOYALTY_SPEC.md` penuh sebelum menulis kode. Ulangi ringkasan fase yang akan dikerjakan dalam 3-5 baris, lalu mulai.
2. Kerjakan SATU fase per sesi (tabel bagian 10 spec). Jangan loncat fase. Jangan kerjakan fitur di luar spec.
3. Spec ambigu atau saling bertentangan: berhenti, tulis pertanyaan spesifik. Jangan menebak.
4. Skema SQL, nama tabel, nama kolom, nama RPC, route: pakai persis dari spec. Perlu menyimpang: minta persetujuan dulu, sebut alasan.
5. Setelah tiap fase jalankan `pnpm lint` dan `pnpm tsc --noEmit`. Perbaiki sampai bersih. Laporkan hasil perintah apa adanya, jangan klaim "sudah jalan" tanpa menjalankan.
6. Commit kecil per unit kerja, pesan format `feat: ...`, `fix: ...`, `chore: ...`.

## 3. Aturan Anti-Slop

Dilarang:
- Data dummy, lorem ipsum, atau nilai hardcode yang menggantikan data database.
- Kode mati, import tak terpakai, komentar yang hanya mengulang kode, `console.log` tertinggal.
- Abstraksi berlebihan: tidak ada factory, generic, atau layer repository untuk satu pemakaian. Tiga baris mirip lebih baik daripada abstraksi dini.
- `any`, `@ts-ignore`, `@ts-expect-error` tanpa alasan tertulis. Gunakan tipe dari `types/database.ts`.
- Menulis ulang file utuh untuk perubahan kecil. Edit seperlunya.
- Menambah dependency di luar daftar stack spec tanpa izin.
- Catch error lalu diam. Setiap error harus ditangani atau diteruskan dengan pesan jelas.
- Teks UI generik. Semua teks UI berbahasa Indonesia, ringkas, spesifik ("Kartu penuh!" bukan "Success").

Wajib:
- Semua input divalidasi Zod di sisi server.
- Setiap query/mutasi tenant lewat sesi user dan RLS. Jangan ambil `tenant_id` dari input client tanpa cek membership.
- Loading state, empty state, dan error state di setiap halaman data.
- Aksesibilitas dasar: label form, fokus terlihat, kontras cukup, tombol bisa dioperasikan keyboard.
- Mobile-first. Uji lebar 360px.

## 4. Larangan Keamanan (keras)

- `SUPABASE_SERVICE_ROLE_KEY` tidak boleh muncul di file `use client`, tidak boleh berprefix `NEXT_PUBLIC_`.
- Tidak ada update langsung ke `cards`, `stamps`, `redemptions` dari client. Hanya RPC.
- Tidak boleh mematikan RLS, membuat policy `using (true)`, atau memberi akses anon ke tabel untuk "mempermudah".
- Tidak ada secret di repo. Cek `.gitignore` memuat `.env*`.

## 5. Pembagian Agent (jika memakai beberapa agent paralel)

Setiap agent punya wilayah file sendiri agar tidak bentrok. Agent tidak boleh mengedit file di luar wilayahnya. Butuh perubahan di wilayah lain: tulis catatan permintaan, jangan edit.

| Agent | Fase | Wilayah file |
|---|---|---|
| A — Database | 1 | `supabase/migrations/**`, `src/types/database.ts` |
| B — Auth & Shell | 0, 2 | `src/middleware.ts`, `src/lib/supabase/**`, `src/app/(auth)/**`, `src/app/onboarding/**`, `src/app/admin/layout.tsx`, `src/components/ui/**` |
| C — Kartu & Stempel | 3, 4 | `src/app/admin/cards/**`, `src/actions/cards.ts`, `src/actions/stamps.ts`, `src/components/{loyalty-card,stamp-grid,qr-dialog}.tsx` |
| D — Publik & Pengaturan | 5, 6 | `src/app/c/**`, `src/app/admin/{customers,history,settings,staff}/**`, `src/actions/{tenant,staff}.ts`, `src/lib/utils/logo-cutout.ts` |
| E — Reviewer | 7 | Baca semua, tulis tes dan README, perbaikan kecil lintas wilayah setelah agent lain selesai |

Urutan: A selesai dulu, lalu B, baru C dan D boleh paralel. E terakhir.

## 5.1 Prompt Awal per Agent (salin ke sesi baru)

**Agent A**
> Baca `LOYALTY_SPEC.md` dan `PROMPT_AI_LOYALTY.md`. Kerjakan Fase 1: buat `supabase/migrations/0001_init.sql` dari bagian 4 spec (tabel, index, view, helper, RLS, RPC, revoke/grant, storage). Jalankan di database kosong, generate types ke `src/types/database.ts`. Tulis tes SQL untuk isolasi RLS dan konkurensi `add_stamp` sesuai bagian 10. Laporkan hasil tes apa adanya.

**Agent B**
> Baca `LOYALTY_SPEC.md` dan `PROMPT_AI_LOYALTY.md`. Kerjakan Fase 0 dan 2: setup proyek, Supabase SSR client, middleware (redirect login/onboarding), halaman login/register, onboarding (panggil RPC `create_tenant`), layout admin dengan navigasi. Hormati wilayah file Agent B.

**Agent C**
> Baca `LOYALTY_SPEC.md` dan `PROMPT_AI_LOYALTY.md`. Kerjakan Fase 3 dan 4: komponen `LoyaltyCard` (bagian 6.1), buat kartu + dialog QR (6.3), halaman detail kartu dengan stempel, batal, tukar hadiah (6.4). Gunakan hanya RPC untuk mutasi. Hormati wilayah file Agent C.

**Agent D**
> Baca `LOYALTY_SPEC.md` dan `PROMPT_AI_LOYALTY.md`. Kerjakan Fase 5 dan 6: halaman publik `/c/[token]` (6.5), riwayat, pelanggan, settings dengan upload logo + hapus background (6.2), manajemen staff (6.6). Hormati wilayah file Agent D.

**Agent E**
> Baca `LOYALTY_SPEC.md` dan `PROMPT_AI_LOYALTY.md`. Kerjakan Fase 7: review seluruh kode terhadap bagian 7 (keamanan) dan aturan anti-slop, jalankan semua tes bagian 10, perbaiki temuan, tulis README setup, siapkan deploy Vercel. Laporkan daftar temuan beserta perbaikannya.

## 6. Format Laporan Setiap Akhir Sesi

```
Fase: <nomor dan nama>
Selesai: <daftar singkat>
File diubah: <daftar path>
Perintah dijalankan: <perintah + hasil: lulus/gagal>
Belum beres / pertanyaan: <daftar, atau "tidak ada">
Penyimpangan dari spec: <daftar + alasan, atau "tidak ada">
```

## 7. Checklist Review Sebelum Anggap Fase Selesai

- [ ] Sesuai kriteria "Selesai jika" fase di spec
- [ ] `pnpm lint` dan `pnpm tsc --noEmit` bersih
- [ ] Tidak ada `any`, kode mati, `console.log`
- [ ] Semua input server tervalidasi Zod
- [ ] Tidak ada service role key di kode client
- [ ] Loading, empty, error state ada
- [ ] Diuji di lebar 360px
- [ ] Laporan sesi ditulis sesuai format
