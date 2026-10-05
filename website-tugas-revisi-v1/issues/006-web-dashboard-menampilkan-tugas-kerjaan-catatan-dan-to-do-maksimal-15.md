## Konteks

Baca AGENTS.md di root repo untuk konteks umum, aturan, dan skema database sebelum mulai. Issue ini adalah bagian dari batch REVISI setelah aplikasi pertama kali dideploy dan dipakai.

Saat ini dashboard hanya menampilkan daftar tugas terdekat (maksimal 3). Yang diminta: dashboard menampilkan tugas, kerjaan, catatan, dan to-do list sekaligus, dan daftar tugas aktif menampilkan maksimal 15 dengan deadline terdekat. Angka batas selain tugas adalah asumsi awal yang mudah diubah lewat satu file konstanta: kerjaan 15, catatan terbaru 5, to-do aktif 10.

## Tasks

- [ ] Buat src/config/dashboard.ts berisi konstanta batas: BATAS_TUGAS = 15, BATAS_KERJAAN = 15, BATAS_CATATAN = 5, BATAS_TODO = 10
- [ ] Pertahankan tiga kartu ringkasan di atas (Tugas belum selesai merah, Kerjaan belum selesai kuning, Deadline terdekat berwarna sesuai aturan deadline)
- [ ] Bagian 'Tugas Aktif': tugas belum selesai diurutkan dari deadline terdekat, maksimal BATAS_TUGAS. Ubah teks keterangan menjadi 'Maksimal 15 tugas aktif dengan deadline terdekat'. Jika ada lebih banyak, tampilkan baris '+ n tugas lainnya' dan tautan 'Lihat semua' ke halaman Tugas
- [ ] Bagian 'Kerjaan Aktif': kerjaan belum selesai diurutkan per deadline, maksimal BATAS_KERJAAN, dengan tautan Lihat semua
- [ ] Bagian 'Catatan Terbaru': BATAS_CATATAN catatan yang terakhir diedit, tiap kartu memakai judul turunan dari shared/catatan.ts, dengan tautan ke halaman Catatan
- [ ] Bagian 'To-do Aktif': to-do belum selesai maksimal BATAS_TODO yang bisa diceklis langsung dari dashboard, dengan tautan ke halaman Catatan dan To-do
- [ ] Pertahankan kartu pratinjau pesan Telegram jam 09.00 sebagai bagian terakhir
- [ ] Tata letak: dua kolom di laptop (tugas dan kerjaan berdampingan, catatan dan to-do berdampingan), satu kolom di HP. Tiap bagian punya keadaan kosong yang ramah
- [ ] Gunakan komponen bersama dan token warna dari issue sebelumnya sehingga tampil benar di mode terang dan gelap
- [ ] Tulis test untuk logika pemotongan dan pengurutan (misalnya 20 tugas menghasilkan 15 tugas dengan deadline terdekat plus keterangan '+ 5 tugas lainnya')

## Acceptance Criteria

Dashboard menampilkan tugas, kerjaan, catatan, dan to-do, tugas aktif dibatasi 15 dengan deadline terdekat dan ada keterangan sisanya, batas bisa diubah dari satu file, tampilan rapi di HP dan laptop, dan benar di mode terang dan gelap.

## Dependencies

[[R21]], [[R22]], [[R23]]
