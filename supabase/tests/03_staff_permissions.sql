-- supabase/tests/03_staff_permissions.sql
-- Tes hak akses Staff vs Owner
-- Sesuai LOYALTY_SPEC.md bagian 7 & 10:
-- Staff bisa: buat kartu, tambah/batal stempel, tukar hadiah, lihat riwayat
-- Staff TIDAK bisa: ubah settings/tenant, hapus data pelanggan/kartu, kelola anggota/staff

begin;

-- Mock environment auth jika diuji di Postgres tanpa Supabase auth schema
create schema if not exists auth;
create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text
);

delete from auth.users where email in ('owner_biz@test.com', 'staff_biz@test.com');
insert into auth.users (id, email) values
  ('33333333-3333-3333-3333-333333333333', 'owner_biz@test.com'),
  ('44444444-4444-4444-4444-444444444444', 'staff_biz@test.com')
on conflict (id) do nothing;

-- 1. Owner membuat tenant
set local role authenticated;
select set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333333', true);
select public.create_tenant('Kafe Staff Test', 'kafe-staff');

-- 2. Service role menambahkan user sebagai staff (simulasi action invite oleh server service role)
set local role service_role;
insert into public.tenant_members (tenant_id, user_id, role)
select id, '44444444-4444-4444-4444-444444444444', 'staff'
from public.tenants where slug = 'kafe-staff';

-- 3. Pengujian hak akses menggunakan sesi Staff (role: authenticated, sub: staff user)
set local role authenticated;
select set_config('request.jwt.claim.sub', '44444444-4444-4444-4444-444444444444', true);

do $$
declare
  v_tenant uuid;
  v_card public.cards;
  v_stamp public.stamps;
  v_rows int;
  v_is_owner boolean;
  v_is_member boolean;
begin
  select id into v_tenant from public.tenants where slug = 'kafe-staff';

  -- Verifikasi helper functions
  select public.is_owner(v_tenant) into v_is_owner;
  select public.is_member(v_tenant) into v_is_member;

  if v_is_owner is true then
    raise exception 'TEST GAGAL: Staff terdeteksi sebagai owner!';
  end if;

  if v_is_member is not true then
    raise exception 'TEST GAGAL: Staff tidak terdeteksi sebagai member!';
  end if;

  -- 4. Uji Staff mencoba UPDATE tabel tenants (Pengaturan usaha) -> DITOLAK RLS
  update public.tenants set name = 'Hacked by Staff' where id = v_tenant;
  get diagnostics v_rows = row_count;
  if v_rows > 0 then
    raise exception 'TEST GAGAL: Staff berhasil mengubah data tenants!';
  end if;

  -- 5. Uji Staff membuat kartu (Staff berhak) -> SUKSES
  v_card := public.create_card(v_tenant, 'Pelanggan Toko');
  if v_card.id is null then
    raise exception 'TEST GAGAL: Staff gagal membuat kartu!';
  end if;

  -- 6. Uji Staff menambah stempel (Staff berhak) -> SUKSES
  v_card := public.add_stamp(v_card.id, 'Stempel oleh staff');
  if v_card.stamps_count <> 1 then
    raise exception 'TEST GAGAL: Staff gagal menambah stempel!';
  end if;

  -- 7. Uji Staff membatalkan stempel (Staff berhak) -> SUKSES
  select * into v_stamp from public.stamps where card_id = v_card.id limit 1;
  v_card := public.void_stamp(v_stamp.id);
  if v_card.stamps_count <> 0 then
    raise exception 'TEST GAGAL: Staff gagal membatalkan stempel!';
  end if;

  -- 8. Uji Staff mencoba DELETE kartu (Hanya owner yang boleh) -> DITOLAK RLS
  delete from public.cards where id = v_card.id;
  get diagnostics v_rows = row_count;
  if v_rows > 0 then
    raise exception 'TEST GAGAL: Staff berhasil menghapus kartu!';
  end if;

  -- 9. Uji Staff mencoba DELETE pelanggan (Hanya owner yang boleh) -> DITOLAK RLS
  delete from public.customers where id = v_card.customer_id;
  get diagnostics v_rows = row_count;
  if v_rows > 0 then
    raise exception 'TEST GAGAL: Staff berhasil menghapus pelanggan!';
  end if;

  raise notice 'SUKSES: Hak akses Staff sesuai spec (bisa mutasi kartu/stempel, dilarang ubah tenant/hapus data).';
end $$;

rollback;
