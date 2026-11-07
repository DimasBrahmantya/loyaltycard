-- supabase/tests/01_rls_isolation.sql
-- Tes RLS: Isolasi dua tenant A dan B serta hak akses Anon
-- Sesuai LOYALTY_SPEC.md bagian 10

begin;

-- Mock environment auth jika diuji di Postgres tanpa Supabase auth schema
create schema if not exists auth;
create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text
);

-- Siapkan user untuk tes
delete from auth.users where email in ('owner_a@test.com', 'owner_b@test.com');
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'owner_a@test.com'),
  ('22222222-2222-2222-2222-222222222222', 'owner_b@test.com')
on conflict (id) do nothing;

-- 1. Setup Data: User A membuat Tenant A, User B membuat Tenant B
do $$
declare
  v_tenant_a uuid;
  v_tenant_b uuid;
  v_card_a public.cards;
  v_card_b public.cards;
begin
  -- User A membuat Tenant A & Kartu A
  perform set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
  v_tenant_a := public.create_tenant('Kopi Tenant A', 'kopi-a');
  v_card_a := public.create_card(v_tenant_a, 'Pelanggan A', '0811111111');

  -- User B membuat Tenant B & Kartu B
  perform set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);
  v_tenant_b := public.create_tenant('Barber Tenant B', 'barber-b');
  v_card_b := public.create_card(v_tenant_b, 'Pelanggan B', '0822222222');

  raise notice 'Setup selesai. Tenant A: %, Tenant B: %', v_tenant_a, v_tenant_b;
end $$;

-- 2. Uji Isolasi SELECT untuk User A
do $$
declare
  v_count int;
  v_tenant_b uuid;
  v_card_b uuid;
begin
  perform set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
  perform set_config('role', 'authenticated', true);

  select id into v_tenant_b from public.tenants where slug = 'barber-b';
  select id into v_card_b from public.cards where tenant_id = v_tenant_b;

  -- User A tidak boleh melihat Tenant B
  select count(*) into v_count from public.tenants where id = v_tenant_b;
  if v_count <> 0 then
    raise exception 'TEST GAGAL: User A bisa melihat data Tenant B!';
  end if;

  -- User A tidak boleh melihat Pelanggan Tenant B
  select count(*) into v_count from public.customers where tenant_id = v_tenant_b;
  if v_count <> 0 then
    raise exception 'TEST GAGAL: User A bisa melihat pelanggan Tenant B!';
  end if;

  -- User A tidak boleh melihat Kartu Tenant B
  select count(*) into v_count from public.cards where tenant_id = v_tenant_b;
  if v_count <> 0 then
    raise exception 'TEST GAGAL: User A bisa melihat kartu Tenant B!';
  end if;

  -- User A tidak boleh melihat Stamps Tenant B
  select count(*) into v_count from public.stamps where tenant_id = v_tenant_b;
  if v_count <> 0 then
    raise exception 'TEST GAGAL: User A bisa melihat stamps Tenant B!';
  end if;

  -- User A tidak boleh melihat Redemptions Tenant B
  select count(*) into v_count from public.redemptions where tenant_id = v_tenant_b;
  if v_count <> 0 then
    raise exception 'TEST GAGAL: User A bisa melihat redemptions Tenant B!';
  end if;

  raise notice 'SUKSES: RLS SELECT isolation antara Tenant A dan Tenant B berjalan.';
end $$;

-- 3. Uji Isolasi Direct UPDATE dari User A ke data Tenant B
do $$
declare
  v_tenant_b uuid;
  v_rows int;
begin
  perform set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
  perform set_config('role', 'authenticated', true);

  select id into v_tenant_b from public.tenants where slug = 'barber-b';

  update public.tenants set name = 'Hacked Tenant B' where id = v_tenant_b;
  get diagnostics v_rows = row_count;
  if v_rows > 0 then
    raise exception 'TEST GAGAL: User A berhasil mengupdate Tenant B!';
  end if;

  update public.customers set name = 'Hacked Pelanggan' where tenant_id = v_tenant_b;
  get diagnostics v_rows = row_count;
  if v_rows > 0 then
    raise exception 'TEST GAGAL: User A berhasil mengupdate customer Tenant B!';
  end if;

  raise notice 'SUKSES: Direct UPDATE diblokir oleh RLS.';
end $$;

-- 4. Uji Isolasi RPC: User A memanggil add_stamp / void_stamp / redeem_card pada Card B
do $$
declare
  v_tenant_b uuid;
  v_card_b uuid;
  v_caught boolean := false;
begin
  perform set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
  perform set_config('role', 'authenticated', true);

  select id into v_tenant_b from public.tenants where slug = 'barber-b';
  select id into v_card_b from public.cards where tenant_id = v_tenant_b;

  -- Test add_stamp ke Card B harus menghasilkan exception 'forbidden'
  begin
    perform public.add_stamp(v_card_b, 'Unauthorized stamp');
  exception when others then
    if sqlerrm like '%forbidden%' then
      v_caught := true;
    else
      raise exception 'TEST GAGAL: add_stamp melempar error tidak terduga: %', sqlerrm;
    end if;
  end;

  if not v_caught then
    raise exception 'TEST GAGAL: User A berhasil memanggil add_stamp pada kartu Tenant B!';
  end if;

  -- Test redeem_card ke Card B harus menghasilkan exception 'forbidden'
  v_caught := false;
  begin
    perform public.redeem_card(v_card_b);
  exception when others then
    if sqlerrm like '%forbidden%' then
      v_caught := true;
    else
      raise exception 'TEST GAGAL: redeem_card melempar error tidak terduga: %', sqlerrm;
    end if;
  end;

  if not v_caught then
    raise exception 'TEST GAGAL: User A berhasil memanggil redeem_card pada kartu Tenant B!';
  end if;

  raise notice 'SUKSES: RPC add_stamp & redeem_card menolak aksi cross-tenant dengan status forbidden.';
end $$;

-- 5. Uji Akses Anon
do $$
declare
  v_token text;
  v_count int;
  v_pub record;
begin
  select public_token into v_token from public.cards limit 1;

  -- Simulasikan role anon
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('role', 'anon', true);

  -- Anon select tabel langsung ditolak (0 rows)
  select count(*) into v_count from public.tenants;
  if v_count <> 0 then
    raise exception 'TEST GAGAL: Anon dapat membaca tabel tenants secara langsung!';
  end if;

  select count(*) into v_count from public.cards;
  if v_count <> 0 then
    raise exception 'TEST GAGAL: Anon dapat membaca tabel cards secara langsung!';
  end if;

  -- Anon memanggil get_public_card harus berhasil
  select * into v_pub from public.get_public_card(v_token);
  if v_pub.tenant_name is null then
    raise exception 'TEST GAGAL: get_public_card tidak mengembalikan data untuk anon!';
  end if;

  raise notice 'SUKSES: Anon ditolak akses tabel langsung dan berhasil memanggil get_public_card.';
end $$;

rollback;

