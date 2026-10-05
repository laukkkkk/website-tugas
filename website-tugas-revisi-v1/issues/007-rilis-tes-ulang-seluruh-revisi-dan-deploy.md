## Konteks

Baca AGENTS.md di root repo untuk konteks umum, aturan, dan skema database sebelum mulai. Issue ini adalah bagian dari batch REVISI setelah aplikasi pertama kali dideploy dan dipakai.

Pengecekan akhir untuk semua revisi sebelum dianggap selesai.

## Tasks

- [ ] Buat docs/TESTING-REVISI.md berisi skenario tes manual dengan langkah dan hasil yang diharapkan
- [ ] Skenario mode gelap: nyalakan mode gelap lalu buka Login, Dashboard, Tugas, Kerjaan, Catatan dan To-do, dan semua modal. Semuanya harus gelap dan teksnya jelas. Refresh halaman, pilihan tema harus bertahan
- [ ] Skenario warna: tidak ada oranye di halaman Kerjaan, semua tombol utama cyan tua dengan teks putih, kartu merah dan kuning serta badge deadline tetap berwarna
- [ ] Skenario dashboard: tambahkan 16 tugas aktif, dashboard hanya menampilkan 15 dengan deadline terdekat plus keterangan '+ 1 tugas lainnya'. Kerjaan, catatan, dan to-do tampil
- [ ] Skenario catatan: buat catatan lewat bot dengan /note isinya, lewat /note tanpa teks, dan lewat web. Semuanya tampil dengan judul turunan yang benar. Pastikan catatan lama masih ada
- [ ] Skenario HP: cek semua halaman di lebar HP pada mode terang dan gelap
- [ ] Perbaiki bug yang ditemukan dan catat hasilnya di docs/TESTING-REVISI.md
- [ ] Pastikan npm run typecheck, npm test, dan npm run build lulus, lalu push ke main supaya Vercel men-deploy ulang

## Acceptance Criteria

Semua skenario lolos di deployment produksi dan tidak ada bug terbuka dari daftar skenario.

## Dependencies

[[R21]], [[R22]], [[R23]], [[R24]], [[R25]], [[R26]]
