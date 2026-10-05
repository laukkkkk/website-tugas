## Konteks

Baca AGENTS.md di root repo untuk konteks umum, aturan, dan skema database sebelum mulai. Issue ini adalah bagian dari batch REVISI setelah aplikasi pertama kali dideploy dan dipakai.

Masalah di versi sekarang: saat mode gelap diaktifkan, hanya sidebar atau navbar yang berubah gelap, sedangkan isi halaman (dashboard, kartu, daftar, form, modal) tetap terang. Di sidebar gelap, teks menu (Tugas, Kerjaan, Catatan) juga terlalu samar. Yang diminta: mode gelap berlaku untuk SELURUH aplikasi, teks di mode gelap berwarna putih atau terang yang jelas, dan semua warna diperiksa supaya tidak samar. Prinsipnya: latar gelap berarti teks terang, latar terang berarti teks gelap.

## Tasks

- [ ] Audit semua file di src yang memakai warna tertulis langsung (bg-white, text-slate-*, border-gray-*, dsb.) di semua halaman: Login, Dashboard, Tugas, Kerjaan, Catatan dan To-do, serta semua modal, form, input, placeholder, tab filter, kotak pencarian, kartu, badge, keadaan kosong, dan loading
- [ ] Ganti dengan token warna semantik (variabel CSS) yang punya dua set nilai, terang dan gelap, misalnya: latar halaman, latar kartu, teks utama, teks sekunder, border, aksen, dan teks di atas aksen. Daftarkan token di konfigurasi Tailwind sehingga komponen cukup memakai nama token
- [ ] Aktifkan mode gelap berbasis class pada elemen html (kelas 'dark'). Default mengikuti pengaturan sistem (prefers-color-scheme). Tombol ganti tema di sidebar menyimpan pilihan pengguna ke localStorage dan pilihan itu menang atas pengaturan sistem
- [ ] Tambahkan skrip kecil di index.html yang memasang kelas dark sebelum React dirender supaya tidak ada kilatan tema terang saat halaman dimuat
- [ ] Nilai warna mode gelap: latar halaman gelap (sekitar #0F172A), latar kartu sedikit lebih terang (sekitar #1E293B), teks utama putih (#FFFFFF), teks sekunder terang (minimal #CBD5E1, tidak boleh lebih redup), border cukup terlihat. Ikon dan teks menu sidebar juga harus terang dan jelas
- [ ] Pastikan semua teks (termasuk teks kecil, placeholder, label tab, badge, dan teks di kartu ringkasan) mencapai kontras minimal 4,5 banding 1 terhadap latarnya di kedua mode. Kartu ringkasan merah, kuning, dan badge deadline merah, kuning, hijau tetap berwarna semantik tetapi versi gelapnya memakai latar gelap bernuansa warna itu dengan teks terang
- [ ] Buat tes kecil (vitest) yang menghitung rasio kontras WCAG untuk pasangan token utama (teks utama pada latar, teks sekunder pada kartu, teks pada aksen, teks pada badge) di mode terang dan gelap, dan gagal jika ada yang di bawah 4,5
- [ ] Perbarui bagian 'Desain web' di AGENTS.md: mode gelap berlaku menyeluruh, memakai token warna, teks gelap-terang mengikuti latar, dan semua halaman baru wajib memakai token

## Acceptance Criteria

Saat mode gelap dinyalakan, SELURUH aplikasi berubah gelap (bukan hanya sidebar), semua teks terlihat jelas dan berwarna putih atau terang, tidak ada elemen yang tetap terang sendirian, pilihan tema tersimpan setelah refresh, tidak ada kilatan tema terang saat dimuat, dan tes kontras lulus.

## Dependencies

Tidak ada
