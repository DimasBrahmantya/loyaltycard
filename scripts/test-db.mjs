import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs';
import path from 'node:path';

async function run() {
  console.log('--- Initializing Empty PostgreSQL (PGlite WASM) ---');
  const db = new PGlite();

  // 1. Setup Supabase base schemas & mock functions (auth, storage, extensions)
  console.log('1. Setting up Supabase mock primitives (roles, auth, storage, extensions)...');
  await db.exec(`
    -- Supabase roles
    do $$ begin
      if not exists (select from pg_roles where rolname = 'anon') then create role anon; end if;
      if not exists (select from pg_roles where rolname = 'authenticated') then create role authenticated; end if;
      if not exists (select from pg_roles where rolname = 'service_role') then create role service_role bypassrls; end if;
    end $$;

    grant usage on schema public to anon, authenticated, service_role;
    alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
    alter default privileges in schema public grant all on routines to anon, authenticated, service_role;
    alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;

    create schema if not exists extensions;
    create or replace function extensions.gen_random_bytes(count int) returns bytea language sql as $$
      select decode(substr(md5(random()::text || clock_timestamp()::text) || md5(random()::text), 1, count * 2), 'hex');
    $$;

    -- auth schema mock
    create schema if not exists auth;
    create table if not exists auth.users (
      id uuid primary key default gen_random_uuid(),
      email text
    );
    create or replace function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
    $$;

    -- storage schema mock
    create schema if not exists storage;
    create table if not exists storage.buckets (
      id text primary key,
      name text,
      public boolean default false
    );
    create table if not exists storage.objects (
      id uuid primary key default gen_random_uuid(),
      bucket_id text references storage.buckets(id),
      name text,
      owner uuid,
      created_at timestamptz default now()
    );
    create or replace function storage.foldername(name text) returns text[] language sql immutable as $$
      select string_to_array(name, '/');
    $$;
  `);

  // 2. Run migration 0001_init.sql
  console.log('2. Applying supabase/migrations/0001_init.sql on empty database...');
  let migrationSql = fs.readFileSync(path.resolve('supabase/migrations/0001_init.sql'), 'utf-8');
  // In pglite WASM, pgcrypto C extension is mocked above
  migrationSql = migrationSql.replace(/create extension if not exists pgcrypto with schema extensions;/i, '-- pgcrypto mocked in extensions schema');
  await db.exec(migrationSql);
  // Supabase grants all table permissions to anon & authenticated so RLS policies govern row access
  await db.exec(`
    grant all on all tables in schema public to anon, authenticated, service_role;
    grant all on all routines in schema public to anon, authenticated, service_role;
    grant all on all sequences in schema public to anon, authenticated, service_role;
  `);
  console.log('✅ Migration 0001_init.sql executed successfully without error!');

  // Verify created tables and views
  const tables = await db.query(`
    select table_name from information_schema.tables 
    where table_schema = 'public' and table_type = 'BASE TABLE'
    order by table_name;
  `);
  console.log('Public tables created:', tables.rows.map(r => r.table_name).join(', '));

  const views = await db.query(`
    select table_name from information_schema.views 
    where table_schema = 'public'
    order by table_name;
  `);
  console.log('Public views created:', views.rows.map(r => r.table_name).join(', '));

  // 3. Run test 01_rls_isolation.sql
  console.log('\n3. Running supabase/tests/01_rls_isolation.sql...');
  const test1Sql = fs.readFileSync(path.resolve('supabase/tests/01_rls_isolation.sql'), 'utf-8');
  await db.exec(test1Sql);
  console.log('✅ Test 01_rls_isolation.sql passed!');

  // 4. Run test 02_concurrency_add_stamp.sql
  console.log('\n4. Running supabase/tests/02_concurrency_add_stamp.sql...');
  const test2Sql = fs.readFileSync(path.resolve('supabase/tests/02_concurrency_add_stamp.sql'), 'utf-8');
  await db.exec(test2Sql);
  console.log('✅ Test 02_concurrency_add_stamp.sql passed!');

  // 5. Run test 03_staff_permissions.sql
  console.log('\n5. Running supabase/tests/03_staff_permissions.sql...');
  const test3Sql = fs.readFileSync(path.resolve('supabase/tests/03_staff_permissions.sql'), 'utf-8');
  await db.exec(test3Sql);
  console.log('✅ Test 03_staff_permissions.sql passed!');

  console.log('\n🎉 ALL DATABASE MIGRATION AND SQL TESTS PASSED SUCCESSFULLY!');
}

run().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
