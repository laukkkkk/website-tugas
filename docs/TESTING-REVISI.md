# Dokumentasi Pengujian Manual Revisi (TESTING-REVISI)

Dokumen ini memuat skenario pengujian manual, langkah pengujian, hasil yang diharapkan, serta catatan hasil pengujian untuk batch revisi aplikasi **Website Tugas** (Issue #21 s/d #27).

---

## Daftar Skenario Pengujian

### 1. Skenario Mode Gelap & Persistensi Tema (Issue #21)
*Tujuan: Memastikan mode gelap menyeluruh, kontras teks memenuhi WCAG AA, dan pilihan tema bertahan setelah refresh.*

- **Langkah-langkah Pengujian**:
  1. Buka aplikasi di browser (halaman Login atau Dashboard).
  2. Klik tombol toggle tema (ikon matahari/bulan) pada header atau sidebar.
  3. Amati perubahan tampilan ke mode gelap:
     - Latar belakang halaman (`--bg-page`: `#0F172A`).
     - Kartu dan modal dialog (`--bg-card`: `#1E293B`).
     - Border komponen (`--border-main`: `#334155`).
     - Teks utama (`#FFFFFF`) dan teks sekunder minimal `#CBD5E1`.
  4. Buka halaman secara berurutan: **Login**, **Dashboard**, **Tugas**, **Kerjaan**, **Catatan & To-do**.
  5. Buka setiap modal dialog:
     - Modal Tambah/Edit Tugas.
     - Modal Hapus Tugas.
     - Modal Tambah/Edit Kerjaan.
     - Modal Hapus Kerjaan.
     - Modal Editor Catatan Baru/Ubah Catatan.
     - Modal Hapus Catatan.
  6. Lakukan refresh halaman (`F5` atau `Ctrl+R`).
- **Hasil yang Diharapkan**:
  - Seluruh elemen antarmuka, input form, tombol, dan modal tampil konsisten dalam mode gelap tanpa area putih yang "bocor".
  - Teks terbaca jelas dengan rasio kontras >= 4.5:1 terhadap latarnya.
  - Setelah refresh browser, status mode gelap tetap aktif (tersimpan di `localStorage` melalui kunci `website_tugas_theme`).

---

### 2. Skenario Warna & Kontras WCAG AA (Issue #22 & #23)
*Tujuan: Memastikan aksen seragam biru-cyan, tidak ada warna oranye di halaman Kerjaan, dan semua tombol utama memiliki kontras tinggi.*

- **Langkah-langkah Pengujian**:
  1. Buka halaman **Kerjaan**:
     - Periksa warna aksen, tautan, badge status, dan tombol.
     - Pastikan tidak ada warna oranye/amber pada elemen dasar antarmuka Kerjaan. (Warna kuning/amber hanya digunakan untuk status deadline < 4 hari).
  2. Periksa semua tombol aksi utama di seluruh aplikasi:
     - Tombol "Masuk ke Dashboard" di halaman Login.
     - Tombol "Tambah Tugas" di halaman Tugas.
     - Tombol "Tambah Kerjaan" di halaman Kerjaan.
     - Tombol "Catatan Baru" dan "Tambah" to-do di halaman Catatan.
     - Tombol "Simpan" pada seluruh form modal.
  3. Uji tampilan kartu deadline (merah, kuning, hijau) pada Dashboard, Tugas, dan Kerjaan.
- **Hasil yang Diharapkan**:
  - Halaman Kerjaan menggunakan tema biru-cyan yang konsisten dengan halaman lainnya.
  - Semua tombol utama menggunakan warna latar cyan tua `#00838F` (hover `#006B76`) dengan teks putih murni `#FFFFFF` (rasio kontras 4.58:1, memenuhi WCAG AA).
  - Kartu deadline berwarna memiliki teks kontras tinggi baik pada mode terang maupun mode gelap (dark-tinted background dengan teks terang).

---

### 3. Skenario Dashboard & Batas Item Aktif (Issue #26)
*Tujuan: Memastikan dashboard memuat tugas (maks 15), kerjaan (maks 15), catatan (maks 5), to-do (maks 10), dan pratinjau Telegram.*

- **Langkah-langkah Pengujian**:
  1. Buka halaman **Dashboard**.
  2. Periksa 3 kartu statistik di bagian atas:
     - Tugas belum selesai (Merah) -> klik mengarah ke `/tugas`.
     - Kerjaan belum selesai (Kuning) -> klik mengarah ke `/kerjaan`.
     - Deadline terdekat (Warna dinamis) -> klik mengarah ke detail item terkait.
  3. Masukkan atau buat hingga 16 tugas aktif dengan tanggal deadline berbeda-beda:
     - Periksa bagian **Tugas Aktif**: harus menampilkan tepat 15 tugas dengan deadline terdekat.
     - Subheader berbunyi: *"Maksimal 15 tugas aktif dengan deadline terdekat"*.
     - Di bagian bawah daftar muncul baris: *"+ 1 tugas lainnya"* dan tautan *"Lihat semua &rarr;"* menuju halaman Tugas.
  4. Periksa bagian **Kerjaan Aktif**:
     - Menampilkan kerjaan aktif diurutkan berdasarkan deadline terdekat (maksimal 15).
     - Menampilkan tautan *"Lihat semua"* ke `/kerjaan`.
  5. Periksa bagian **Catatan Terbaru**:
     - Menampilkan maksimal 5 catatan yang terakhir diedit.
     - Tiap kartu menggunakan judul turunan tebal dan pratinjau sisa isi.
     - Klik kartu membuka halaman Catatan.
  6. Periksa bagian **To-do Aktif**:
     - Menampilkan maksimal 10 to-do belum selesai.
     - Centang salah satu kotak centang to-do langsung dari dashboard.
     - Amati to-do langsung tercentang (update optimistik) dan data tersimpan ke server.
  7. Periksa bagian **Pesan Telegram jam 09.00**:
     - Tampil sebagai kartu penuh di bagian paling bawah dashboard.
     - Tombol "Salin" berfungsi menyalin format pesan reminder ke clipboard.
- **Hasil yang Diharapkan**:
  - Seluruh batas item aktif bekerja sesuai konstanta di `src/config/dashboard.ts`.
  - Tata letak 2 kolom di laptop dan 1 kolom di HP berjalan rapi.

---

### 4. Skenario Catatan Tanpa Judul (Issue #24 & #25)
*Tujuan: Memastikan catatan tidak lagi memerlukan kolom judul manual, dan judul diturunkan secara otomatis dari baris pertama isi.*

- **Langkah-langkah Pengujian**:
  1. **Pengujian Web**:
     - Buka halaman **Catatan & To-do**.
     - Klik tombol "+ Catatan Baru".
     - Periksa form modal: kolom input "Judul" tidak ada; hanya tersedia textarea "Isi catatan" yang otomatis fokus (`autoFocus`).
     - Ketikkan:
       ```text
       Belanja Mingguan
       - Sayur bayam
       - Telur 1 kg
       - Beras 5 kg
       ```
     - Klik "Simpan Catatan".
     - Periksa kartu di daftar catatan: Judul yang tampil tebal adalah `"Belanja Mingguan"`, pratinjaunya adalah `"- Sayur bayam - Telur 1 kg..."`.
     - Klik kartu catatan untuk membuka modal ubah: hanya ada textarea isi catatan.
     - Kosongkan isi catatan lalu klik Simpan: pesan error `"Isi catatan wajib diisi."` tampil jelas.
  2. **Pengujian Bot Telegram**:
     - Kirim `/note Beli kopi dan gula`: bot merespons catatan berhasil disimpan dengan judul `"Beli kopi dan gula"`.
     - Kirim `/note` tanpa teks tambahan: bot memulai percakapan interaktif menanyakan isi catatan.
     - Ketikkan beberapa baris teks: bot menyimpan catatan dan mengonfirmasi ringkasannya.
  3. **Pemeriksaan Catatan Lama**:
     - Pastikan catatan yang dibuat sebelumnya tetap utuh dan isi catatannya dapat dibaca serta diedit tanpa error.
- **Hasil yang Diharapkan**:
  - Kolom judul sepenuhnya dihapus dari database, API, bot, dan UI web.
  - Judul turunan (`ringkasanCatatan`) diekstrak dari baris pertama (maksimal 60 karakter).
  - Catatan lama tidak hilang dan termigrasi dengan aman.

---

### 5. Skenario Tampilan Responsif HP / Mobile
*Tujuan: Memastikan seluruh halaman mudah digunakan pada layar smartphone (lebar 360px - 430px).*

- **Langkah-langkah Pengujian**:
  1. Buka browser Developer Tools (`Ctrl+Shift+I` atau `F12`), aktifkan Responsive Device Mode (misalnya iPhone 14 atau Pixel 7, lebar ~390px).
  2. Periksa navigasi:
     - Sidebar laptop tersembunyi.
     - Tombol hamburger (garis tiga) muncul di header atas.
     - Klik tombol hamburger: panel mobile drawer terbuka dengan animasi halus.
     - Klik salah satu menu: drawer menutup otomatis dan halaman berpindah.
     - Klik backdrop overlay gelap di luar drawer: drawer menutup.
  3. Buka halaman **Dashboard** pada mode HP:
     - 3 kartu ringkasan tersusun 1 kolom.
     - Tugas Aktif, Kerjaan Aktif, Catatan Terbaru, To-do Aktif, dan Pratinjau Telegram tersusun vertikal secara rapi.
  4. Buka halaman **Catatan & To-do** pada mode HP:
     - Kolom Catatan dan kolom To-do tersusun 1 kolom yang nyaman di-scroll.
     - Tombol aksi dan checkbox nyaman ditekan dengan jari.
  5. Uji tampilan HP pada mode terang dan mode gelap.
- **Hasil yang Diharapkan**:
  - Tidak ada overflow horizontal yang merusak tata letak.
  - Semua tombol, modal, dan elemen form dapat diakses dengan mudah di layar sentuh.

---

## Catatan Hasil Pengujian & Bug Fixing

| Komponen / Fitur | Status Uji | Keterangan & Perbaikan |
|---|---|---|
| Mode Gelap (`html.dark`) | **Lulus** | Menggunakan CSS token semantik dan localStorage persistence. Lulus audit kontras WCAG AA. |
| Warna Tombol Utama | **Lulus** | Seluruh tombol aksi utama menggunakan cyan `#00838F` teks putih `#FFFFFF` (rasio kontras 4.58:1). |
| Halaman Kerjaan | **Lulus** | Aksen oranye diubah menjadi cyan seragam; oranye/kuning dikhususkan untuk deadline < 4 hari. |
| Dashboard 4 Bagian | **Lulus** | Menampilkan Tugas Aktif (15), Kerjaan Aktif (15), Catatan Terbaru (5), To-do Aktif (10), dan Telegram Preview. |
| To-do Dashboard | **Lulus** | Kotak centang to-do dapat diceklis langsung dari dashboard dengan update optimistik. |
| Catatan Tanpa Judul | **Lulus** | Migrasi database kolom judul selesai, helper `ringkasanCatatan` di `shared/catatan.ts` lulus unit test. |
| Webhook & Serverless | **Lulus** | Menggunakan adapter `std/http` Web Standard, ekspor named `POST` & `GET`, reset webhook di luar folder api. |
| Responsif Mobile (HP) | **Lulus** | Mobile drawer, single-column stack, touch targets >= 44px. |

---

## Verifikasi Otomatis

- `npm run typecheck`: **LULUS** (TypeScript 0 error).
- `npm test`: **LULUS** (36 test suites, 291 unit & integration tests lulus 100%).
- `npm run build`: **LULUS** (Vite production bundle berhasil dibuat).
