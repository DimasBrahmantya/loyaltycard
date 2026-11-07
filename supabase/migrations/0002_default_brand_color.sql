-- 0002_default_brand_color.sql
-- Ubah nilai default kolom brand_color untuk tenant baru ke #1e3a8a (Midnight Navy)

alter table public.tenants
  alter column brand_color set default '#1e3a8a';

