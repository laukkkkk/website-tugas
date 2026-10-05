## Konteks

Baca AGENTS.md di root repo untuk konteks umum, aturan, dan skema database sebelum mulai. Issue ini adalah bagian dari batch REVISI setelah aplikasi pertama kali dideploy dan dipakai.

Pengguna ingin catatan tidak punya judul lagi, hanya isi. Alasannya judul dianggap tidak perlu dan merepotkan, terutama saat membuat catatan lewat Telegram karena harus memakai simbol pemisah untuk memisahkan judul dan isi. Setelah ini catatan hanya berisi satu kolom isi. Untuk tampilan daftar, 'judul' diturunkan otomatis dari baris pertama isi. Migrasi database harus tidak menghilangkan data: judul lama digabungkan ke baris pertama isi sebelum kolom judul dihapus. Langkah menjalankan migrasi di Supabase dikerjakan manual oleh Laukkk dengan bantuan Claude di chat, jadi bagian manual TIDAK dikerjakan AI.

## Tasks

- [ ] Buat file migrasi SQL baru di supabase/migrations (jangan ubah file migrasi lama) yang: (a) untuk catatan yang judulnya tidak kosong, ubah isi menjadi judul, baris baru, lalu isi lama; (b) menghapus kolom judul dari tabel notes
- [ ] Perbarui types dan service di server/features/notes: hanya 'isi' yang wajib dan tidak boleh kosong atau hanya spasi; hapus semua penggunaan judul. Pembuatan dan pengubahan catatan hanya menerima isi
- [ ] Perbarui endpoint api/notes dan api/notes/[id]: body POST dan PATCH hanya berisi isi. Daftar tetap diurutkan dari yang terakhir diedit (updated_at)
- [ ] Buat fungsi murni shared/catatan.ts bernama ringkasanCatatan(isi) yang mengembalikan judul turunan (baris pertama yang tidak kosong, dipotong maksimal 60 karakter dengan '...' bila lebih panjang) dan pratinjau (sisa isi setelah baris pertama, maksimal 120 karakter). Fungsi ini akan dipakai web dan bot
- [ ] Tulis test untuk service dan untuk ringkasanCatatan (isi satu baris, banyak baris, baris pertama kosong, isi sangat panjang, isi hanya spasi)
- [ ] Perbarui skema notes di AGENTS.md menjadi: id, isi, created_at, updated_at, dan tambahkan catatan bahwa judul turunan dari baris pertama isi lewat shared/catatan.ts
- [ ] Perbarui skrip atau data contoh lain yang masih memakai judul catatan jika ada

## Langkah Manual (dikerjakan Laukkk dengan bantuan Claude, JANGAN dikerjakan AI)

- [ ] Setelah file migrasi selesai ditulis, buka Supabase, SQL Editor, tempel isi file migrasi baru itu, lalu Run
- [ ] Buka Table Editor, tabel notes, dan pastikan kolom judul sudah tidak ada dan isi catatan lama masih utuh (judul lama sekarang menjadi baris pertama isi)
- [ ] Merge ke main hanya setelah migrasi dijalankan, karena kode baru tidak lagi mengenal kolom judul

## Acceptance Criteria

Migrasi baru ada dan tidak menghilangkan data judul lama, service dan API catatan hanya memakai isi, ringkasanCatatan berfungsi dan lulus test, AGENTS.md diperbarui, dan typecheck, test, serta build lulus.

## Dependencies

Tidak ada
