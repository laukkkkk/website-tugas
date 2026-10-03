-- Migration: 20261003000001_initial_schema.sql
-- Setup tabel tugas, kerjaan, notes, todos, bot_sessions, indeks, dan Row Level Security (RLS)

-- Extension pgcrypto untuk gen_random_uuid()
create extension if not exists "pgcrypto";

-- 1. Tabel Tugas
create table if not exists tugas (
  id uuid primary key default gen_random_uuid(),
  judul text not null,
  matkul text not null,
  tipe text not null check (tipe in ('individu', 'kelompok')),
  link_pengumpulan text,
  deadline timestamptz not null,
  selesai boolean not null default false,
  created_at timestamptz not null default now()
);

-- 2. Tabel Kerjaan
create table if not exists kerjaan (
  id uuid primary key default gen_random_uuid(),
  judul text not null,
  deskripsi text,
  deadline timestamptz not null,
  selesai boolean not null default false,
  created_at timestamptz not null default now()
);

-- 3. Tabel Notes
create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  judul text not null,
  isi text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. Tabel Todos
create table if not exists todos (
  id uuid primary key default gen_random_uuid(),
  teks text not null,
  selesai boolean not null default false,
  created_at timestamptz not null default now()
);

-- 5. Tabel Bot Sessions
create table if not exists bot_sessions (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Function & Trigger untuk otomatis memperbarui updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_update_notes_updated_at on notes;
create trigger trigger_update_notes_updated_at
  before update on notes
  for each row
  execute function update_updated_at_column();

drop trigger if exists trigger_update_bot_sessions_updated_at on bot_sessions;
create trigger trigger_update_bot_sessions_updated_at
  before update on bot_sessions
  for each row
  execute function update_updated_at_column();

-- Indeks kolom deadline dan selesai pada tugas dan kerjaan
create index if not exists idx_tugas_deadline on tugas (deadline);
create index if not exists idx_tugas_selesai on tugas (selesai);
create index if not exists idx_tugas_selesai_deadline on tugas (selesai, deadline);

create index if not exists idx_kerjaan_deadline on kerjaan (deadline);
create index if not exists idx_kerjaan_selesai on kerjaan (selesai);
create index if not exists idx_kerjaan_selesai_deadline on kerjaan (selesai, deadline);

-- Aktifkan Row Level Security (RLS) di semua tabel
alter table tugas enable row level security;
alter table kerjaan enable row level security;
alter table notes enable row level security;
alter table todos enable row level security;
alter table bot_sessions enable row level security;

-- Policy: hanya mengizinkan role authenticated untuk membaca dan menulis
drop policy if exists "Authenticated users can manage tugas" on tugas;
create policy "Authenticated users can manage tugas"
  on tugas for all to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated users can manage kerjaan" on kerjaan;
create policy "Authenticated users can manage kerjaan"
  on kerjaan for all to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated users can manage notes" on notes;
create policy "Authenticated users can manage notes"
  on notes for all to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated users can manage todos" on todos;
create policy "Authenticated users can manage todos"
  on todos for all to authenticated
  using (true)
  with check (true);

-- Untuk bot_sessions tidak dibuat policy sama sekali,
-- sehingga hanya service role key (yang melewati RLS) yang dapat mengaksesnya.
