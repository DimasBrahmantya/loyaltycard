-- 0001_init.sql
-- Inisialisasi skema database kartu loyalitas digital multi-tenant sesuai LOYALTY_SPEC.md bagian 4

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

-- 4.1 Helper dan RLS
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

-- 4.2 RPC (logika bisnis, atomik)

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

-- 4.3 Storage
insert into storage.buckets (id, name, public) values ('logos', 'logos', true) on conflict do nothing;

create policy logos_select on storage.objects for select to public
  using (bucket_id = 'logos');
create policy logos_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'logos' and public.is_owner(((storage.foldername(name))[1])::uuid));
create policy logos_update on storage.objects for update to authenticated
  using (bucket_id = 'logos' and public.is_owner(((storage.foldername(name))[1])::uuid))
  with check (bucket_id = 'logos' and public.is_owner(((storage.foldername(name))[1])::uuid));
create policy logos_delete on storage.objects for delete to authenticated
  using (bucket_id = 'logos' and public.is_owner(((storage.foldername(name))[1])::uuid));
