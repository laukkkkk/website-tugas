## Konteks

Baca AGENTS.md di root repo untuk konteks umum, aturan, dan skema database sebelum mulai. Issue ini adalah bagian dari batch REVISI setelah aplikasi pertama kali dideploy dan dipakai.

Saat ini membuat catatan lewat bot memakai format dengan judul, pemisah, lalu isi, dan itu merepotkan karena harus mengetik simbol pemisah. Setelah judul catatan dihapus, perintah /note cukup menerima isi catatan saja.

## Tasks

- [ ] Ubah /note: teks setelah perintah langsung menjadi isi catatan. Contoh: /note jangan lupa buat template capcut. Hapus parsing simbol pemisah khusus untuk catatan. Perintah /tugas dan /kerjaan jalan pintasnya TIDAK diubah
- [ ] Jika /note dikirim tanpa teks, bot membalas 'Tulis isi catatannya' dan menyimpan pesan berikutnya sebagai isi memakai bot_sessions (kedaluwarsa dan /batal berlaku seperti alur lain)
- [ ] Konfirmasi setelah menyimpan menampilkan judul turunan dan pratinjau dari shared/catatan.ts
- [ ] Ubah /notes: daftar menampilkan judul turunan (baris pertama isi) pada tiap tombol atau baris, ketuk untuk melihat isi lengkap. Tombol hapus dengan konfirmasi tetap ada
- [ ] Perbarui teks /help dan daftar command bot. Beri tahu Laukkk teks deskripsi baru untuk /setcommands di BotFather: 'note - Tambah catatan (cukup ketik isinya)' (JANGAN mengubah BotFather sendiri)
- [ ] Perbarui test handler catatan

## Acceptance Criteria

Perintah /note isi catatan menyimpan catatan tanpa simbol pemisah, /note tanpa teks menanyakan isi lalu menyimpannya, /notes menampilkan judul turunan, perintah /tugas dan /kerjaan tidak berubah, dan test lulus.

## Dependencies

[[R23]]
