# Panduan Penjadwalan Pengingat Harian (cron-job.org)

Dokumen ini memuat panduan lengkap langkah demi langkah untuk mengonfigurasi pemicu pengingat harian (*daily reminder*) otomatis menggunakan layanan pihak ketiga [cron-job.org](https://cron-job.org).

---

## 1. Konteks & Arsitektur

Website Tugas memiliki endpoint serverless pengingat di `/api/reminder`. Setiap kali endpoint ini dipanggil secara sah:
1. Endpoint memverifikasi rahasia pada header `X-Reminder-Secret`.
2. Endpoint menjalankan query ke database Supabase untuk membaca seluruh **tugas** dan **kerjaan** yang belum selesai (`selesai = false`), terurut dari deadline terdekat.
3. Jika terdapat tugas atau kerjaan yang perlu diingatkan, pesan pengingat terformat rapi (lengkap dengan label sisa hari, tanggal WIB, dan emoji indikator deadline) dikirimkan langsung ke Telegram pemilik (`OWNER_CHAT_ID`).
4. Jika tidak ada tugas atau kerjaan yang belum selesai, endpoint tetap membalas respons `200 OK` tanpa mengirim pesan ke Telegram.
5. Endpoint mengembalikan respons JSON ringkas yang memuat status pengiriman (`sent`), jumlah tugas (`tugasCount`), dan jumlah kerjaan (`kerjaanCount`).

### Mengapa Menggunakan cron-job.org?
- **Presisi Waktu**: Fitur cron bawaan paket Vercel Hobby memiliki batasan dan toleransi keterlambatan eksekusi (*jitter*). cron-job.org mengeksekusi request tepat waktu.
- **Dukungan Zona Waktu**: cron-job.org mendukung pemilihan zona waktu `Asia/Jakarta (WIB)` secara langsung tanpa perlu konversi manual ke UTC.
- **Riwayat Eksekusi**: Menyediakan log riwayat pemanggilan, status HTTP, durasi respons, serta isi respons JSON untuk memudahkan pemantauan.
- **Gratis**: Paket gratis cron-job.org sudah lebih dari cukup untuk kebutuhan pemanggilan 1x sehari.

---

## 2. Spesifikasi Endpoint `/api/reminder`

| Properti | Nilai |
|---|---|
| **URL Produksi** | `https://<domain-anda>.vercel.app/api/reminder` |
| **URL Lokal** | `http://localhost:3000/api/reminder` |
| **Metode HTTP** | `GET` (didukung juga `POST`) |
| **Header Autentikasi** | `X-Reminder-Secret: <NILAI_REMINDER_SECRET>` |
| **Alternatif Header** | `Authorization: Bearer <NILAI_REMINDER_SECRET>` |

> [!NOTE]
> Nilai `<NILAI_REMINDER_SECRET>` diambil dari environment variable `REMINDER_SECRET` yang telah Anda daftarkan di dashboard Vercel.

### Format Respons JSON

#### A. Jika Terdapat Tugas / Kerjaan Aktif (`200 OK`):
```json
{
  "message": "Pengingat berhasil dikirim ke Telegram.",
  "sent": true,
  "tugasCount": 2,
  "kerjaanCount": 1
}
```

#### B. Jika Tidak Ada Tugas / Kerjaan Aktif (`200 OK`):
```json
{
  "message": "Tidak ada tugas atau kerjaan yang perlu diingatkan.",
  "sent": false,
  "tugasCount": 0,
  "kerjaanCount": 0
}
```

#### C. Jika Secret Salah / Tidak Disertakan (`401 Unauthorized`):
```json
{
  "error": "Unauthorized: invalid reminder secret"
}
```

#### D. Jika Menggunakan Metode HTTP Tidak Didukung (`405 Method Not Allowed`):
```json
{
  "error": "Method Not Allowed",
  "message": "Metode DELETE tidak didukung. Gunakan GET atau POST."
}
```

---

## 3. Langkah Demi Langkah Pembuatan Job di cron-job.org

Ikuti langkah-langkah berikut untuk menjadwalkan pengingat:

### Langkah 1: Buat Akun & Masuk
1. Kunjungi [https://cron-job.org](https://cron-job.org).
2. Jika belum punya akun, klik **Sign Up** dan lakukan verifikasi email.
3. Masuk (*Log In*) ke dashboard akun cron-job.org Anda.

### Langkah 2: Buat Cronjob Baru
1. Di dashboard, klik menu **Cronjobs** pada bilah navigasi atas/samping.
2. Klik tombol **Create Cronjob** (biasanya tombol biru/hijau di kanan atas).

### Langkah 3: Konfigurasi URL dan Metode
1. **Title**: Masukkan nama yang deskriptif, contoh: `Website Tugas - Reminder 09.00 WIB`.
2. **URL**: Masukkan URL endpoint produksi Anda:
   ```text
   https://<domain-anda>.vercel.app/api/reminder
   ```
   *(Ganti `<domain-anda>` dengan domain deployment Vercel Anda, misalnya `website-tugas.vercel.app`)*.
3. **Request Method**: Pilih `GET`.

### Langkah 4: Konfigurasi Jadwal (09.00 WIB)
1. Pada bagian **Schedule**, pilih mode **Every day** (Harian).
2. Atur jam dan menit:
   - Jam: `09`
   - Menit: `00`
3. Pada pilihan **Timezone**, cari dan pilih:
   ```text
   Asia/Jakarta (GMT+07:00)
   ```
   *(Pilihan ini memastikan cron berjalan pukul 09.00 WIB setiap harinya)*.

### Langkah 5: Tambahkan Header `X-Reminder-Secret`
1. Gulir ke bagian **Advanced** / **Headers**.
2. Klik **Add header** atau **Edit headers**.
3. Masukkan:
   - **Header name**: `X-Reminder-Secret`
   - **Header value**: Masukkan nilai token `REMINDER_SECRET` yang ada pada pengaturan Vercel Anda.
4. *(Opsional)* Pada bagian **Failure notification**, Anda dapat mencentang notifikasi via email jika panggilan gagal dieksekusi.

### Langkah 6: Simpan Job
1. Periksa kembali URL, jadwal, timezone, dan header.
2. Klik tombol **Create** / **Save** untuk menyimpan job.

---

## 4. Cara Melakukan Tes Manual

Ada dua cara untuk menguji apakah endpoint dan integrasi Telegram berfungsi dengan baik:

### Cara 1: Menguji Langsung dari cron-job.org
1. Buka daftar **Cronjobs** di cron-job.org.
2. Temukan cronjob `Website Tugas - Reminder 09.00 WIB` yang baru dibuat.
3. Klik tombol aksi (ikon titik tiga atau tombol play/test: **Test run** / **Execute now**).
4. Buka tab **History** pada detail cronjob tersebut:
   - Periksa **Status**: Harus `200` (OK).
   - Periksa **Response body**: Memuat JSON ringkas dengan nilai `sent`, `tugasCount`, dan `kerjaanCount`.
5. Buka aplikasi **Telegram**:
   - Jika ada tugas/kerjaan yang belum selesai, bot Telegram akan langsung mengirimkan pesan ringkasan pengingat ke chat Anda.
   - Jika semua tugas/kerjaan sudah selesai, bot tidak mengirim pesan dan response body cron-job.org akan menunjukkan `"sent": false`.

### Cara 2: Menguji Lewat Terminal Menggunakan cURL

Jalankan perintah cURL berikut pada terminal komputer Anda:

```bash
curl -i -X GET \
  -H "X-Reminder-Secret: <NILAI_REMINDER_SECRET>" \
  https://<domain-anda>.vercel.app/api/reminder
```

**Hasil yang diharapkan (ada tugas aktif):**
```http
HTTP/2 200
content-type: application/json; charset=utf-8

{"message":"Pengingat berhasil dikirim ke Telegram.","sent":true,"tugasCount":1,"kerjaanCount":0}
```

**Untuk pengujian di lingkungan lokal (Local Development):**
Pastikan dev server berjalan (`npx vercel dev` pada port 3000):
```bash
curl -i -X GET \
  -H "X-Reminder-Secret: <NILAI_REMINDER_SECRET>" \
  http://localhost:3000/api/reminder
```

---

## 5. Cara Mematikan atau Menghentikan Job

Jika Anda ingin menghentikan pengingat harian (misalnya saat libur semester atau pemeliharaan sistem), ada beberapa cara:

### A. Menonaktifkan Sementara (Disable / Pause)
1. Buka dashboard [cron-job.org](https://cron-job.org) > **Cronjobs**.
2. Cari job pengingat Anda.
3. Geser toggle switch status dari **Enabled** menjadi **Disabled**, atau klik tombol edit dan hapus centang opsi **Enabled**.
4. Job tidak akan dijalankan lagi sampai Anda mengaktifkannya kembali.

### B. Menghapus Job Secara Permanen (Delete)
1. Buka dashboard [cron-job.org](https://cron-job.org) > **Cronjobs**.
2. Klik tombol menu (ikon titik tiga) di samping kanan job.
3. Pilih opsi **Delete**.
4. Konfirmasi penghapusan.

### C. Menonaktifkan Darurat dari Vercel (Server-side Revocation)
Jika Anda kehilangan akses ke akun cron-job.org:
1. Buka dashboard project di Vercel: **Settings** > **Environment Variables**.
2. Ubah nilai `REMINDER_SECRET` menjadi string baru, atau hapus variabel tersebut, lalu lakukan redeploy.
3. Setiap request dari cron-job.org dengan secret lama akan otomatis ditolak dengan `401 Unauthorized` sehingga bot tidak akan mengirim pesan apa pun.

---

## 6. Pemecahan Masalah (Troubleshooting)

| Masalah | Kemungkinan Penyebab | Solusi |
|---|---|---|
| **Status 401 Unauthorized** | Header `X-Reminder-Secret` salah atau belum disetel di cron-job.org | Samakan nilai header pada cron-job.org dengan variabel `REMINDER_SECRET` di Vercel. |
| **Status 500 Internal Server Error** | `OWNER_CHAT_ID` belum disetel atau kredensial database/bot bermasalah | Periksa tab **Logs** di Vercel dashboard. Pastikan `OWNER_CHAT_ID`, `BOT_TOKEN`, dan `SUPABASE_SERVICE_ROLE_KEY` valid. |
| **Status 200 tapi tidak ada pesan Telegram** | Tidak ada tugas atau kerjaan yang berstatus belum selesai | Periksa respons JSON: jika `"sent": false` dan `"tugasCount": 0`, ini adalah perilaku normal (bot tidak akan mengirim pesan kosong). |
| **Pesan reminder terkirim di jam yang salah** | Timezone di cron-job.org belum diatur ke `Asia/Jakarta` | Edit cronjob, pastikan Timezone dipilih `Asia/Jakarta (GMT+07:00)` dan jam disetel ke `09:00`. |
