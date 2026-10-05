-- Migration: 20261005000001_remove_notes_judul.sql
-- Hapus kolom judul dari tabel notes, gabungkan judul lama ke awal isi

-- 1. Untuk catatan yang judulnya tidak kosong, ubah isi menjadi judul, baris baru, lalu isi lama
update notes
set isi = case
  when isi is null or trim(isi) = '' then trim(judul)
  else trim(judul) || E'\n' || isi
end
where judul is not null and trim(judul) <> '';

-- 2. Hapus kolom judul dari tabel notes
alter table notes drop column if exists judul;
