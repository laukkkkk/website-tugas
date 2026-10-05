## Konteks

Baca AGENTS.md di root repo untuk konteks umum, aturan, dan skema database sebelum mulai. Issue ini adalah bagian dari batch REVISI setelah aplikasi pertama kali dideploy dan dipakai.

Masalah di versi sekarang: halaman Tugas memakai aksen biru-cyan, tetapi halaman Kerjaan memakai oranye (tombol Tambah Kerjaan dan tab aktif) dan kartu kerjaan berborder kuning. Teks di tombol berlatar cyan juga berwarna gelap sehingga terasa samar. Yang diminta: semua halaman memakai aksen biru-cyan yang sama, dan teks tombol berlatar warna berwarna putih. Catatan teknis: putih di atas cyan terang (#00ACC1) kontrasnya rendah (sekitar 2,9 banding 1) sehingga sulit dibaca. Karena itu latar tombol utama memakai cyan yang lebih tua agar teks putih tetap terbaca jelas.

## Tasks

- [ ] Buat satu set komponen bersama (Button, Tabs, Card, Badge, Input) di src/components dan pakai di semua halaman, supaya tidak ada gaya warna per halaman
- [ ] Tombol utama (Tambah Tugas, Tambah Kerjaan, Catatan Baru, Tambah, Tambah Catatan, Simpan, Masuk ke Dashboard): latar cyan tua sekitar #00838F (hover sekitar #006B76), teks putih, kontras minimal 4,5 banding 1
- [ ] Hapus semua oranye dari halaman Kerjaan: tombol Tambah Kerjaan, warna tab aktif (Semua, Belum Selesai, Selesai), dan border kuning pada kartu kerjaan (ganti dengan border netral seperti kartu tugas)
- [ ] Tab filter dan elemen terpilih lain di semua halaman memakai aksen cyan yang sama. Cincin fokus input juga cyan
- [ ] Warna semantik TETAP dipertahankan dan tidak diubah menjadi cyan: kartu 'Tugas belum selesai' merah, 'Kerjaan belum selesai' kuning, badge dan kartu deadline (merah, kuning, hijau sesuai aturan), serta tombol hapus atau aksi berbahaya berwarna merah
- [ ] Terapkan aturan teks di semua komponen berlatar berwarna: latar gelap atau berwarna tua berarti teks putih atau terang, latar terang berarti teks gelap. Periksa satu per satu: tombol, badge, tab aktif, item menu aktif di sidebar, dan tooltip
- [ ] Perluas tes kontras dari issue mode gelap untuk mencakup pasangan teks putih pada tombol aksen
- [ ] Perbarui bagian 'Desain web' di AGENTS.md: satu aksen cyan untuk semua halaman, tombol utama memakai cyan tua dengan teks putih, dan warna semantik hanya untuk status dan deadline

## Acceptance Criteria

Halaman Tugas, Kerjaan, Catatan dan To-do, serta Dashboard memakai aksen biru-cyan yang sama, tidak ada oranye tersisa, semua teks di tombol berlatar warna berwarna putih dan terbaca jelas, warna semantik status dan deadline tetap, dan tes kontras lulus di mode terang dan gelap.

## Dependencies

[[R21]]
