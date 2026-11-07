# LOYALTY_SPEC.md — Kartu Loyalitas Digital Multi-Tenant

Sumber kebenaran tunggal untuk proyek ini. AI agent WAJIB baca seluruh file ini sebelum menulis kode. Jika spec ambigu atau bertentangan dengan kebutuhan, berhenti dan tanya. Jangan mengarang.

## 1. Ringkasan

SaaS loyalty card untuk UMKM (kafe, barbershop, laundry, salon). Satu platform, banyak usaha (tenant). Admin usaha buat kartu untuk pelanggan, tambah stempel, lihat riwayat. Pelanggan scan QR lalu lihat kartu (read-only, tanpa login).

Aktor:
| Aktor | Login | Hak |
|---|---|---|
| Owner | ya (Supabase Auth) | Semua fitur tenant: settings, staff, kartu, stempel, hapus |
| Staff / kasir | ya | Buat kartu, tambah/batal stempel, tukar hadiah, lihat riwayat. Tidak bisa ubah settings, staff |
| Pelanggan | tidak | Lihat kartu sendiri lewat link QR `/c/[token]`, read-only |

Non-goals MVP: pembayaran / billing langganan, sistem poin nominal Rupiah, notifikasi WhatsApp, aplikasi mobile native, kartu lebih dari satu per pelanggan.

## 2. Tech Stack

- Next.js (App Router, versi stabil terbaru), TypeScript strict
- Tailwind CSS + shadcn/ui
- Supabase: Auth, Postgres, Row Level Security, Storage
- `@supabase/ssr` untuk auth server/client/middleware
- Zod untuk validasi semua input (server actions dan form)
- `react-hook-form` + `@hookform/resolvers/zod`
- `qrcode` (npm) untuk generate QR
- Deploy: Vercel + Supabase project
- Package manager: pnpm

Aturan stack:
- Mutasi data lewat Server Actions atau RPC Postgres. Tidak ada API route kecuali perlu.
- `SUPABASE_SERVICE_ROLE_KEY` hanya di server, hanya untuk invite staff. Dilarang masuk bundle client, dilarang prefix `NEXT_PUBLIC_`.
- Tidak pakai ORM. Pakai supabase-js + tipe hasil `supabase gen types typescript`.

## 3. Multi-Tenant

- Tenant = satu usaha. Tabel `tenants`.
- User ke tenant lewat `tenant_members` (role `owner` | `staff`). Satu user boleh anggota banyak tenant.
- Semua tabel bisnis punya kolom `tenant_id`. Isolasi data WAJIB lewat RLS, bukan filter di aplikasi saja.
- MVP: tenant aktif = membership pertama user. Simpan di cookie `active_tenant` agar bisa ganti nanti.

## 4. Database

Simpan sebagai `supabase/migrations/0001_init.sql`. Semua tabel di schema `public`.

```sql
create extension if not exists pgcrypto with schema extensions;

-- TENANTS
create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9-]{3,40}$'),
  logo_url text,
  brand_color text not null default '#c2410c' check (brand_color ~ '^#[0-9a-fA-F]{6}$'),
  reward_text text not null default 'Gratis 1 produk',
  stamps_required int not null default 10 check (stamps_required between 3 and 20),
  created_at timestamptz not null default now()
);

create table public.tenant_members (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','staff')),
  created_at timestamptz not null default now(),
  primary key (tenant_id, user_id)
);

-- CUSTOMERS
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  phone text,
  created_at timestamptz not null default now()
);

-- CARDS (satu kartu per pelanggan; QR tetap sama setelah tukar hadiah)
create table public.cards (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  public_token text not null unique default encode(extensions.gen_random_bytes(24), 'hex'),
  stamps_required int not null,              -- salinan dari tenants saat kartu dibuat
  stamps_count int not null default 0 check (stamps_count >= 0),
  current_cycle int not null default 1,      -- naik 1 setiap tukar hadiah
  status text not null default 'active' check (status in ('active','completed')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  check (stamps_count <= stamps_required)
);

-- STAMPS (satu baris = satu stempel; void tidak menghapus baris)
create table public.stamps (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  card_id uuid not null references public.cards(id) on delete cascade,
  cycle int not null,
  stamped_by uuid references auth.users(id),
  note text,
  created_at timestamptz not null default now(),
  voided_at timestamptz,
  voided_by uuid references auth.users(id)
);

-- REDEMPTIONS
create table public.redemptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  card_id uuid not null references public.cards(id) on delete cascade,
  cycle int not null,
  redeemed_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index on public.customers (tenant_id);
create index on public.cards (tenant_id);
create index on public.stamps (card_id);
create index on public.stamps (tenant_id, created_at desc);
create index on public.redemptions (tenant_id, created_at desc);

-- RIWAYAT TRANSAKSI (view gabungan)
create view public.transaction_history with (security_invoker = true) as
  select id, tenant_id, card_id, 'stamp'::text as type, created_at as at, stamped_by as actor, note
    from public.stamps
  union all
  select id, tenant_id, card_id, 'void', voided_at, voided_by, note
    from public.stamps where voided_at is not null
  union all
  select id, tenant_id, card_id, 'redeem', created_at, redeemed_by, null
    from public.redemptions;
```

### 4.1 Helper dan RLS

```sql
create or replace function public.is_member(tid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.tenant_members where tenant_id = tid and user_id = auth.uid());
$$;

create or replace function public.is_owner(tid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.tenant_members where tenant_id = tid and user_id = auth.uid() and role = 'owner');
$$;

alter table public.tenants enable row level security;
alter table public.tenant_members enable row level security;
alter table public.customers enable row level security;
alter table public.cards enable row level security;
alter table public.stamps enable row level security;
alter table public.redemptions enable row level security;

create policy tenants_select on public.tenants for select to authenticated using (public.is_member(id));
create policy tenants_update on public.tenants for update to authenticated using (public.is_owner(id)) with check (public.is_owner(id));

create policy members_select on public.tenant_members for select to authenticated using (public.is_member(tenant_id));
-- insert/delete member: hanya lewat server action owner (service role). Tanpa policy langsung.

create policy customers_select on public.customers for select to authenticated using (public.is_member(tenant_id));
create policy customers_insert on public.customers for insert to authenticated with check (public.is_member(tenant_id));
create policy customers_update on public.customers for update to authenticated using (public.is_member(tenant_id)) with check (public.is_member(tenant_id));
create policy customers_delete on public.customers for delete to authenticated using (public.is_owner(tenant_id));

create policy cards_select on public.cards for select to authenticated using (public.is_member(tenant_id));
create policy cards_insert on public.cards for insert to authenticated with check (public.is_member(tenant_id));
create policy cards_delete on public.cards for delete to authenticated using (public.is_owner(tenant_id));
-- update cards (stamps_count dll): TANPA policy. Hanya lewat RPC security definer.

create policy stamps_select on public.stamps for select to authenticated using (public.is_member(tenant_id));
create policy redemptions_select on public.redemptions for select to authenticated using (public.is_member(tenant_id));
-- insert/update stamps dan redemptions: TANPA policy. Hanya lewat RPC.
```

### 4.2 RPC (logika bisnis, atomik)

```sql
-- Buat tenant + jadikan pemanggil owner
create or replace function public.create_tenant(p_name text, p_slug text) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'unauthenticated'; end if;
  insert into tenants(name, slug) values (p_name, p_slug) returning id into v_id;
  insert into tenant_members(tenant_id, user_id, role) values (v_id, auth.uid(), 'owner');
  return v_id;
end $$;

-- Buat pelanggan + kartu sekaligus
create or replace function public.create_card(p_tenant uuid, p_name text, p_phone text default null)
returns public.cards language plpgsql security invoker set search_path = public as $$
declare v_customer uuid; v_req int; v_card public.cards;
begin
  select stamps_required into v_req from tenants where id = p_tenant;
  if v_req is null then raise exception 'tenant_not_found'; end if;
  insert into customers(tenant_id, name, phone) values (p_tenant, p_name, p_phone) returning id into v_customer;
  insert into cards(tenant_id, customer_id, stamps_required) values (p_tenant, v_customer, v_req) returning * into v_card;
  return v_card;
end $$;

-- Tambah stempel
create or replace function public.add_stamp(p_card uuid, p_note text default null)
returns public.cards language plpgsql security definer set search_path = public as $$
declare v_card public.cards;
begin
  select * into v_card from cards where id = p_card for update;
  if not found or not is_member(v_card.tenant_id) then raise exception 'forbidden'; end if;
  if v_card.stamps_count >= v_card.stamps_required then raise exception 'card_full'; end if;
  insert into stamps(tenant_id, card_id, cycle, stamped_by, note)
    values (v_card.tenant_id, v_card.id, v_card.current_cycle, auth.uid(), p_note);
  update cards set
    stamps_count = stamps_count + 1,
    status = case when stamps_count + 1 >= stamps_required then 'completed' else 'active' end,
    completed_at = case when stamps_count + 1 >= stamps_required then now() else completed_at end
  where id = v_card.id returning * into v_card;
  return v_card;
end $$;

-- Batalkan stempel (hanya siklus berjalan)
create or replace function public.void_stamp(p_stamp uuid)
returns public.cards language plpgsql security definer set search_path = public as $$
declare v_stamp public.stamps; v_card public.cards;
begin
  select * into v_stamp from stamps where id = p_stamp;
  if not found then raise exception 'not_found'; end if;
  select * into v_card from cards where id = v_stamp.card_id for update;
  if not is_member(v_card.tenant_id) then raise exception 'forbidden'; end if;
  if v_stamp.voided_at is not null then raise exception 'already_voided'; end if;
  if v_stamp.cycle <> v_card.current_cycle then raise exception 'old_cycle'; end if;
  update stamps set voided_at = now(), voided_by = auth.uid() where id = p_stamp;
  update cards set stamps_count = stamps_count - 1, status = 'active', completed_at = null
    where id = v_card.id returning * into v_card;
  return v_card;
end $$;

-- Tukar hadiah: reset hitungan, QR tetap
create or replace function public.redeem_card(p_card uuid)
returns public.cards language plpgsql security definer set search_path = public as $$
declare v_card public.cards;
begin
  select * into v_card from cards where id = p_card for update;
  if not found or not is_member(v_card.tenant_id) then raise exception 'forbidden'; end if;
  if v_card.status <> 'completed' then raise exception 'not_completed'; end if;
  insert into redemptions(tenant_id, card_id, cycle, redeemed_by)
    values (v_card.tenant_id, v_card.id, v_card.current_cycle, auth.uid());
  update cards set stamps_count = 0, current_cycle = current_cycle + 1, status = 'active', completed_at = null
    where id = v_card.id returning * into v_card;
  return v_card;
end $$;

-- Kartu publik untuk pelanggan: data minimal, tanpa id internal
create or replace function public.get_public_card(p_token text)
returns table (
  tenant_name text, logo_url text, brand_color text, reward_text text,
  customer_name text, stamps_count int, stamps_required int, status text, rewards_redeemed bigint
) language sql stable security definer set search_path = public as $$
  select t.name, t.logo_url, t.brand_color, t.reward_text, c.name,
         k.stamps_count, k.stamps_required, k.status,
         (select count(*) from redemptions r where r.card_id = k.id)
  from cards k
  join tenants t on t.id = k.tenant_id
  join customers c on c.id = k.customer_id
  where k.public_token = p_token
  limit 1;
$$;

-- Hak eksekusi: Supabase memberi execute ke anon secara default. Cabut eksplisit.
revoke execute on function public.create_tenant(text, text) from public, anon;
revoke execute on function public.create_card(uuid, text, text) from public, anon;
revoke execute on function public.add_stamp(uuid, text) from public, anon;
revoke execute on function public.void_stamp(uuid) from public, anon;
revoke execute on function public.redeem_card(uuid) from public, anon;
grant execute on function public.create_tenant(text, text), public.create_card(uuid, text, text),
  public.add_stamp(uuid, text), public.void_stamp(uuid), public.redeem_card(uuid) to authenticated;
grant execute on function public.get_public_card(text) to anon, authenticated;
```

### 4.3 Storage

Bucket `logos`, public read. Path file: `{tenant_id}/logo.png`. Tulis hanya owner tenant tersebut.

```sql
insert into storage.buckets (id, name, public) values ('logos', 'logos', true) on conflict do nothing;

create policy logos_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'logos' and public.is_owner(((storage.foldername(name))[1])::uuid));
create policy logos_update on storage.objects for update to authenticated
  using (bucket_id = 'logos' and public.is_owner(((storage.foldername(name))[1])::uuid));
create policy logos_delete on storage.objects for delete to authenticated
  using (bucket_id = 'logos' and public.is_owner(((storage.foldername(name))[1])::uuid));
```

## 5. Routes

| Route | Akses | Isi |
|---|---|---|
| `/` | publik | Landing singkat + tombol daftar |
| `/login`, `/register` | publik | Email + password (Supabase Auth) |
| `/onboarding` | login, belum punya tenant | Form nama usaha + slug, panggil `create_tenant` |
| `/admin` | member | Ringkasan: total kartu, stempel hari ini, kartu penuh siap tukar |
| `/admin/cards` | member | Daftar kartu, cari nama, filter status |
| `/admin/cards/new` | member | Buat pelanggan + kartu, lalu tampilkan QR |
| `/admin/cards/[id]` | member | Kartu, tombol + stempel, batal stempel, tukar hadiah, QR, riwayat kartu |
| `/admin/customers` | member | Daftar pelanggan |
| `/admin/history` | member | `transaction_history` tenant, paginasi |
| `/admin/settings` | owner | Nama, logo, warna, hadiah, jumlah stempel (hanya berlaku kartu baru) |
| `/admin/staff` | owner | Undang staff via email, hapus staff |
| `/c/[token]` | publik | Kartu read-only via `get_public_card` |

Middleware: redirect `/admin/*` ke `/login` jika belum login. Redirect ke `/onboarding` jika belum punya tenant. `/c/*` tidak boleh butuh login.

## 6. Perilaku Fitur

### 6.1 Komponen kartu (`LoyaltyCard`)
Dipakai di admin dan halaman publik. Props: `tenantName, logoUrl, brandColor, customerName, stampsCount, stampsRequired, rewardText, status`.
- Header: logo (kotak membulat) + nama usaha.
- Grid kotak stempel, 5 kolom, sebanyak `stampsRequired` (default 10 = 5x2).
- Kotak kosong: lingkaran garis putus-putus dengan nomor.
- Kotak terisi: lingkaran berwarna `brandColor`, border putih, isi logo tenant berwarna putih (CSS `filter: brightness(0) invert(1)`). Jika tenant tanpa logo, tampilkan tanda centang putih.
- Footer: nama pelanggan kiri, `n / total` kanan.
- Status `completed`: banner "Kartu penuh! Tunjukkan ke kasir: {rewardText}".
- Latar kartu: gradien dari `brandColor` ke gelap. Mobile-first, lebar maks 420px.

### 6.2 Logo
- Upload client-side: resize maks 160px sisi terpanjang, hapus background otomatis lalu simpan PNG transparan ke Storage `logos/{tenant_id}/logo.png`.
- Algoritma hapus background (`lib/utils/logo-cutout.ts`): ambil warna rata-rata 4 sudut, flood fill dari seluruh tepi, hapus piksel yang jarak warnanya (selisih absolut R+G+B) di bawah 90 dari warna latar. Alpha piksel terhapus = 0. Jika terhapus lebih dari 92% piksel, batalkan dan pakai tanpa logo. Jika sudut sudah transparan, lewati.
- Tampilkan pratinjau kartu langsung di halaman settings.
- Batas upload: tipe image/*, maks 2 MB sebelum resize.

### 6.3 Buat kartu dan QR
- Form: nama (wajib), telepon (opsional). Submit memanggil RPC `create_card`.
- Setelah sukses: dialog QR berisi `${NEXT_PUBLIC_APP_URL}/c/${public_token}`. Tombol: unduh PNG, cetak, salin link.
- QR dibuat di client dengan `qrcode`, error correction level M, margin 2, latar putih.

### 6.4 Stempel
- Tombol "+ Stempel" memanggil `add_stamp`. Disabled jika status `completed`. Gunakan optimistic update, rollback jika error.
- Error `card_full` ditampilkan sebagai pesan ramah, bukan stack trace.
- "Batal stempel" muncul pada stempel terakhir siklus berjalan, memanggil `void_stamp`, minta konfirmasi.
- "Tukar hadiah" muncul jika `completed`, konfirmasi dulu, memanggil `redeem_card`.

### 6.5 Halaman publik `/c/[token]`
- Server component, `export const dynamic = 'force-dynamic'`.
- Panggil `get_public_card` dengan anon key. Token tidak ada: tampilkan "Kartu tidak ditemukan".
- Read-only total. Tanpa tombol aksi, tanpa data tenant lain, tanpa id internal.
- Tampilkan juga "Hadiah sudah ditukar: n kali" jika n > 0.
- Header `X-Robots-Tag: noindex`. Metadata title: nama usaha.
- Rate limit sederhana per IP di middleware (misal 60 req/menit) untuk mencegah tebak token.

### 6.6 Staff
- Owner masukkan email. Server action (service role) memanggil `auth.admin.inviteUserByEmail`, lalu insert `tenant_members` role `staff`.
- Hapus staff: server action cek `is_owner`, owner tidak bisa menghapus dirinya sendiri jika owner terakhir.

## 7. Keamanan (wajib)

1. RLS aktif di semua tabel. Tes isolasi antar tenant wajib lulus (lihat bagian 10).
2. Tidak ada update langsung ke `cards`, `stamps`, `redemptions` dari client. Hanya RPC.
3. Token publik 192-bit acak (`gen_random_bytes(24)` hex). Tidak boleh berurutan atau berbasis id.
4. Service role key hanya di server, hanya di action invite staff. Dilarang di file `use client`.
5. Validasi Zod di setiap server action. Jangan percaya `tenant_id` dari client: ambil dari sesi dan cek membership.
6. Hindari `dangerouslySetInnerHTML`. SVG QR dirender dari hasil library, bukan input user.
7. Tidak ada secret di repo. `.env.local` masuk `.gitignore`. Sediakan `.env.example`.

## 8. Environment

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # server only
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 9. Struktur Folder

```
supabase/migrations/0001_init.sql
src/
  middleware.ts
  app/
    (marketing)/page.tsx
    (auth)/login/page.tsx
    (auth)/register/page.tsx
    onboarding/page.tsx
    admin/layout.tsx
    admin/page.tsx
    admin/cards/page.tsx
    admin/cards/new/page.tsx
    admin/cards/[id]/page.tsx
    admin/customers/page.tsx
    admin/history/page.tsx
    admin/settings/page.tsx
    admin/staff/page.tsx
    c/[token]/page.tsx
  components/
    loyalty-card.tsx
    stamp-grid.tsx
    qr-dialog.tsx
    ui/                       # shadcn
  actions/                    # server actions per domain: cards.ts, stamps.ts, tenant.ts, staff.ts
  lib/
    supabase/{client,server,middleware}.ts
    validators/               # zod schema
    utils/logo-cutout.ts
  types/database.ts           # hasil supabase gen types
```

## 10. Fase Kerja dan Kriteria Selesai

Kerjakan berurutan. Satu fase selesai penuh (lint + typecheck bersih) sebelum fase berikutnya.

| Fase | Isi | Selesai jika |
|---|---|---|
| 0 | Setup Next.js, Tailwind, shadcn, Supabase client, `.env.example` | `pnpm dev` jalan, `pnpm lint` dan `pnpm tsc --noEmit` bersih |
| 1 | Migrasi SQL bagian 4, generate types | Migrasi jalan di database kosong tanpa error, tipe ter-generate |
| 2 | Auth, middleware, onboarding, layout admin | Daftar, login, buat usaha, masuk `/admin`; user tanpa tenant diarahkan ke onboarding |
| 3 | Buat kartu, daftar kartu, dialog QR | Kartu baru tampil di daftar, QR bisa diunduh dan mengarah ke `/c/[token]` |
| 4 | Stempel, batal, tukar hadiah | Siklus penuh 10 stempel lalu tukar berjalan, hitungan benar, QR tetap sama |
| 5 | Halaman publik `/c/[token]` | Terbuka tanpa login di HP, read-only, token salah tampil pesan ramah |
| 6 | Riwayat, pelanggan, settings (logo, warna, hadiah), staff | Logo transparan tampil putih di stempel, staff bisa login dengan hak terbatas |
| 7 | Poles dan deploy | Deploy Vercel, tes manual semua alur di HP, README berisi cara setup |

### Tes wajib
- Isolasi RLS: dua tenant A dan B. User A tidak bisa select/update data B lewat client langsung maupun RPC (`forbidden`).
- Konkurensi: dua `add_stamp` bersamaan pada kartu dengan 9 stempel menghasilkan tepat 10, tidak 11.
- Anon: select langsung ke tabel apa pun ditolak, `get_public_card` berfungsi.
- Staff tidak bisa membuka `/admin/settings` dan `/admin/staff`.
- `void_stamp` pada stempel siklus lama ditolak (`old_cycle`).

## 11. Pengembangan Lanjutan (di luar MVP)

Billing langganan per tenant (kolom `plan`, batas jumlah kartu), subdomain per tenant, notifikasi WhatsApp saat kartu penuh, mode poin nominal, beberapa tingkat hadiah, ekspor CSV riwayat, kartu masuk Apple/Google Wallet.
