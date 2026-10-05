# Daftar Issue Revisi Website Tugas (batch 2)

Nomor issue sebenarnya ditentukan GitHub saat dibuat. Kolom Kode dipakai script untuk mengisi nomor dependency secara otomatis.

| Kode | Judul | Labels | Dependencies |
|---|---|---|---|
| R21 | Web — Mode terang dan gelap menyeluruh, teks putih di mode gelap | web, revisi | - |
| R22 | Web — Warna aksen konsisten biru-cyan di semua halaman dan kontras teks tombol | web, revisi | R21 |
| R23 | Catatan — Hapus judul catatan: migrasi database, service, dan API | backend, revisi, manual | - |
| R24 | Bot — Perintah /note cukup isi catatan, tanpa simbol pemisah | bot, revisi | R23 |
| R25 | Web — Halaman Catatan tanpa judul | web, revisi | R22, R23 |
| R26 | Web — Dashboard menampilkan tugas, kerjaan, catatan, dan to-do (maksimal 15 aktif) | web, revisi | R21, R22, R23 |
| R27 | Rilis — Tes ulang seluruh revisi dan deploy | rilis, revisi | R21, R22, R23, R24, R25, R26 |
