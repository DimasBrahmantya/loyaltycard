-- supabase/tests/02_concurrency_add_stamp.sql
-- Tes logika bisnis, batas stamps_count, konkurensi add_stamp, void_stamp, dan redeem_card
-- Sesuai LOYALTY_SPEC.md bagian 10

begin;

-- Mock environment auth jika diuji di Postgres tanpa Supabase auth schema
create schema if not exists auth;
create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text
);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'owner_test@test.com')
on conflict (id) do nothing;

do $$
declare
  v_tenant uuid;
  v_card public.cards;
  v_stamp_cycle1 public.stamps;
  v_stamp_cycle2 public.stamps;
  v_caught boolean := false;
  i int;
begin
  -- Set sesi user
  perform set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
  perform set_config('role', 'authenticated', true);

  -- 1. Buat tenant (default stamps_required = 10) dan kartu
  v_tenant := public.create_tenant('Kopi Konkurensi', 'kopi-konkurensi');
  v_card := public.create_card(v_tenant, 'Pelanggan Konkurensi');

  if v_card.stamps_count <> 0 or v_card.stamps_required <> 10 or v_card.status <> 'active' then
    raise exception 'TEST GAGAL: Inisialisasi kartu tidak sesuai spec!';
  end if;

  -- 2. Tambah 9 stempel berturut-turut
  for i in 1..9 loop
    v_card := public.add_stamp(v_card.id, 'Stempel ' || i);
  end loop;

  if v_card.stamps_count <> 9 or v_card.status <> 'active' then
    raise exception 'TEST GAGAL: stamps_count setelah 9 stempel harus 9 dan status active, tapi didapat: % / %',
      v_card.stamps_count, v_card.status;
  end if;

  -- Simpan salah satu stempel dari siklus 1 untuk pengujian void_stamp lintas siklus nanti
  select * into v_stamp_cycle1 from public.stamps where card_id = v_card.id order by created_at asc limit 1;

  -- 3. Stempel ke-10 (mencapai stamps_required)
  v_card := public.add_stamp(v_card.id, 'Stempel ke-10 (penuh)');
  if v_card.stamps_count <> 10 or v_card.status <> 'completed' or v_card.completed_at is null then
    raise exception 'TEST GAGAL: Pada stempel ke-10 status harus completed dan completed_at terisi!';
  end if;

  -- 4. Uji Penolakan Stempel ke-11 (Simulasi Race Condition / Concurrency):
  -- Karena add_stamp menggunakan SELECT ... FOR UPDATE pada kartu,
  -- transaksi kedua yang mencoba add_stamp setelah kartu mencapai batas (10)
  -- dijamin membaca stamps_count = 10 dan melempar exception 'card_full'.
  v_caught := false;
  begin
    perform public.add_stamp(v_card.id, 'Stempel ke-11 ilegal');
  exception when others then
    if sqlerrm like '%card_full%' then
      v_caught := true;
    else
      raise exception 'TEST GAGAL: Error stempel ke-11 bukan card_full: %', sqlerrm;
    end if;
  end;

  if not v_caught then
    raise exception 'TEST GAGAL: add_stamp berhasil menambah stempel ke-11 melebihi stamps_required!';
  end if;

  -- Verifikasi ulang bahwa count tetap tepat 10 (tidak boleh 11)
  select * into v_card from public.cards where id = v_card.id;
  if v_card.stamps_count <> 10 then
    raise exception 'TEST GAGAL: stamps_count melebihi batas: %', v_card.stamps_count;
  end if;

  raise notice 'SUKSES: Batas konkurensi kartu penuh (tepat 10, tolak stempel ke-11 dengan card_full) terpenuhi.';

  -- 5. Uji Tukar Hadiah (Redeem)
  -- Tukar hadiah saat status 'completed':
  -- reset stamps_count = 0, current_cycle = 2, status = 'active', completed_at = null
  v_card := public.redeem_card(v_card.id);
  if v_card.stamps_count <> 0 or v_card.current_cycle <> 2 or v_card.status <> 'active' or v_card.completed_at is not null then
    raise exception 'TEST GAGAL: redeem_card tidak me-reset kartu dengan benar: %', row_to_json(v_card);
  end if;

  -- Coba redeem lagi saat kartu belum penuh (harus raise 'not_completed')
  v_caught := false;
  begin
    perform public.redeem_card(v_card.id);
  exception when others then
    if sqlerrm like '%not_completed%' then
      v_caught := true;
    else
      raise exception 'TEST GAGAL: redeem_card kedua melempar error tidak terduga: %', sqlerrm;
    end if;
  end;

  if not v_caught then
    raise exception 'TEST GAGAL: redeem_card berhasil pada kartu yang belum completed!';
  end if;

  raise notice 'SUKSES: redeem_card mereset kartu ke siklus 2 dan menolak redeem saat belum completed.';

  -- 6. Uji void_stamp pada stempel siklus lama (harus ditolak dengan 'old_cycle')
  v_caught := false;
  begin
    perform public.void_stamp(v_stamp_cycle1.id);
  exception when others then
    if sqlerrm like '%old_cycle%' then
      v_caught := true;
    else
      raise exception 'TEST GAGAL: void_stamp siklus lama melempar error selain old_cycle: %', sqlerrm;
    end if;
  end;

  if not v_caught then
    raise exception 'TEST GAGAL: void_stamp berhasil membatalkan stempel dari siklus sebelumnya!';
  end if;

  raise notice 'SUKSES: void_stamp menolak pembatalan stempel siklus lama dengan old_cycle.';

  -- 7. Uji void_stamp pada stempel siklus berjalan
  -- Tambah stempel di siklus 2
  v_card := public.add_stamp(v_card.id, 'Stempel siklus 2');
  select * into v_stamp_cycle2 from public.stamps where card_id = v_card.id and cycle = 2 order by created_at desc limit 1;

  v_card := public.void_stamp(v_stamp_cycle2.id);
  if v_card.stamps_count <> 0 then
    raise exception 'TEST GAGAL: void_stamp tidak mengurangi stamps_count!';
  end if;

  -- Coba void stempel yang sama lagi (harus 'already_voided')
  v_caught := false;
  begin
    perform public.void_stamp(v_stamp_cycle2.id);
  exception when others then
    if sqlerrm like '%already_voided%' then
      v_caught := true;
    else
      raise exception 'TEST GAGAL: void_stamp kedua melempar error selain already_voided: %', sqlerrm;
    end if;
  end;

  if not v_caught then
    raise exception 'TEST GAGAL: void_stamp berhasil pada stempel yang sudah di-void!';
  end if;

  raise notice 'SUKSES: void_stamp siklus berjalan mengurangi hitungan dan menolak void ganda dengan already_voided.';
end $$;

rollback;

