-- 0003_custom_loyalty_card.sql
-- Tambah opsi kustomisasi lanjutan untuk kartu loyalitas:
-- 1. card_bg_url: gambar latar kartu kustom
-- 2. stamp_icon_url: ikon stempel kustom (opsional, fallback ke logo_url)
-- 3. stamp_color: warna stempel dan aksen ring (hex)
-- 4. stamp_has_border: toggle garis lingkar stempel

alter table public.tenants
  add column if not exists card_bg_url text,
  add column if not exists stamp_icon_url text,
  add column if not exists stamp_color text not null default '#ffffff' check (stamp_color ~ '^#[0-9a-fA-F]{6}$'),
  add column if not exists stamp_has_border boolean not null default true;

-- Update fungsi get_public_card agar mengembalikan data kustomisasi kartu ke pelanggan
drop function if exists public.get_public_card(text);

create or replace function public.get_public_card(p_token text)
returns table (
  tenant_name text,
  logo_url text,
  brand_color text,
  reward_text text,
  customer_name text,
  stamps_count int,
  stamps_required int,
  status text,
  rewards_redeemed bigint,
  card_bg_url text,
  stamp_icon_url text,
  stamp_color text,
  stamp_has_border boolean
) language sql stable security definer set search_path = public as $$
  select t.name, t.logo_url, t.brand_color, t.reward_text, c.name,
         k.stamps_count, k.stamps_required, k.status,
         (select count(*) from redemptions r where r.card_id = k.id),
         t.card_bg_url, t.stamp_icon_url, t.stamp_color, t.stamp_has_border
  from cards k
  join tenants t on t.id = k.tenant_id
  join customers c on c.id = k.customer_id
  where k.public_token = p_token
  limit 1;
$$;

grant execute on function public.get_public_card(text) to anon, authenticated;

