## Konteks

Baca AGENTS.md di root repo untuk konteks umum, aturan, dan skema database sebelum mulai. Issue ini adalah bagian dari batch REVISI setelah aplikasi pertama kali dideploy dan dipakai.

Karena judul catatan dihapus, form Catatan Baru di web hanya punya satu kolom isi. Daftar catatan menampilkan judul turunan dari baris pertama isi. Seluruh halaman juga harus ikut konsisten dengan warna aksen cyan dan mode gelap menyeluruh dari issue sebelumnya.

## Tasks

- [ ] Hapus kolom 'Judul catatan' dari modal Catatan Baru dan dari modal ubah catatan. Sisakan kolom 'Isi catatan' (textarea, wajib, fokus otomatis saat modal terbuka)
- [ ] Kartu catatan di daftar menampilkan judul turunan (baris pertama, tebal) lalu pratinjau sisa isi maksimal dua baris, waktu terakhir diedit, dan tautan Buka yang membuka modal ubah
- [ ] Catatan baru dan hasil ubah disimpan lewat API yang hanya memakai isi
- [ ] Terapkan komponen bersama dan token warna dari issue sebelumnya: tombol Catatan Baru dan Tambah memakai cyan tua dengan teks putih, panel to-do dan catatan tampil benar di mode gelap
- [ ] Pastikan tampilan dua kolom di laptop dan satu kolom di HP tetap rapi
- [ ] Pesan kosong ('Isi catatan wajib diisi') tampil jelas jika isi kosong

## Acceptance Criteria

Form catatan hanya punya kolom isi, daftar menampilkan judul turunan dari baris pertama, catatan yang dibuat lewat bot tampil benar di web, dan halaman ini konsisten dengan warna cyan dan mode gelap menyeluruh.

## Dependencies

[[R22]], [[R23]]
