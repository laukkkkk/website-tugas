# Website Tugas

Website pengingat tugas dan kerjaan pribadi (satu pengguna) dengan bot Telegram.

## Cara Menjalankan Lokal

Pastikan Node.js (>= 18) telah terpasang.

1. **Pasang dependensi:**
   ```bash
   npm install
   ```

2. **Salin environment variable:**
   ```bash
   cp .env.example .env
   ```
   Isi konfigurasi pada file `.env` sesuai kebutuhan (lihat `.env.example`).

3. **Jalankan development server dengan Vercel CLI:**
   ```bash
   npx vercel dev
   ```
   Atau jika hanya ingin menjalankan frontend React:
   ```bash
   npm run dev
   ```

   Buka [http://localhost:3000](http://localhost:3000) (atau port yang diberikan Vercel/Vite).
   Endpoint serverless dapat diakses melalui:
   - [http://localhost:3000/api/health](http://localhost:3000/api/health)

## Menjalankan Unit Test

Proyek menggunakan [Vitest](https://vitest.dev) untuk unit testing:

```bash
npm test
```

Untuk menjalankan Vitest dalam mode watch (interaktif):
```bash
npx vitest
```

## Panduan Deploy ke Vercel

Proyek ini dirancang untuk dideploy sebagai satu project terpadu di Vercel (Frontend React + Serverless Functions di `/api`).

### 1. Daftar Environment Variables di Vercel

Isi variabel-variabel berikut di menu **Settings > Environment Variables** pada project Vercel Anda (pilih environment: **Production**):

| Nama Variabel | Digunakan Oleh | Keterangan |
|---|---|---|
| `SUPABASE_URL` | Serverless API | URL project Supabase (`https://<project-ref>.supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Serverless API | Kunci admin Supabase (**RAHASIA**, jangan beri prefix `VITE_`) |
| `VITE_SUPABASE_URL` | Frontend Web | URL project Supabase untuk browser client |
| `VITE_SUPABASE_ANON_KEY` | Frontend Web | Public Anon Key Supabase untuk autentikasi browser |
| `BOT_TOKEN` | Bot & Webhook | Token bot Telegram yang didapat dari `@BotFather` |
| `OWNER_CHAT_ID` | Bot Telegram | ID chat Telegram pemilik (bot hanya memproses pesan dari ID ini) |
| `TELEGRAM_WEBHOOK_SECRET` | Webhook Bot | String acak untuk memvalidasi header `X-Telegram-Bot-Api-Secret-Token` |
| `REMINDER_SECRET` | Reminder Cron | Token rahasia bearer untuk memproteksi endpoint `/api/reminder` |

### 2. Pengaturan Project Vercel

- **Framework Preset**: Vite
- **Build Command**: `tsc -b && vite build` (atau kosongkan, otomatis mengikuti `vercel.json`)
- **Output Directory**: `dist`
- Konfigurasi routing SPA dan pengecualian endpoint serverless `/api` telah otomatis diatur di [vercel.json](file:///d:/CODINGAN/Wesbite%20Tugas/vercel.json).

### 3. Pendaftaran Webhook Telegram

Setelah proses deploy Vercel selesai dan domain produksi aktif, daftarkan webhook bot Telegram menggunakan skrip:

```bash
# Daftarkan webhook ke domain produksi
npm run webhook:set https://<project-anda>.vercel.app

# Untuk memeriksa status webhook saat ini
npm run webhook:info

# Untuk menghapus webhook jika ingin kembali ke mode polling lokal
npm run webhook:del
```

### 4. Pemicu Pengingat Harian (cron-job.org)

Untuk mengaktifkan pengingat jam 09.00 WIB setiap hari:
1. Buat cron job baru di [cron-job.org](https://cron-job.org).
2. **URL**: `https://<project-anda>.vercel.app/api/reminder`
3. **Metode**: `GET`
4. **Jadwal**: Setiap hari pukul 09.00 WIB (02.00 UTC) `0 2 * * *`
5. **Headers**:
   - `Authorization`: `Bearer <REMINDER_SECRET>`

### 5. Audit Keamanan Bundle Frontend

Jalankan pengecekan keamanan untuk memastikan tidak ada kunci rahasia server yang bocor ke file bundle client:

```bash
npm run cek:rahasia
# atau
bash scripts/cek-rahasia.sh
```

## Struktur Folder

```text
├── api/                    # Endpoint serverless Vercel (health, tugas, kerjaan, notes, todos, bot, reminder)
├── public/                 # Static assets
├── scripts/                # Skrip bantu (misal: bot dev, set webhook, audit rahasia)
├── server/
│   ├── features/           # Logika bisnis dan domain service
│   │   ├── tugas/          # Types dan service tugas
│   │   ├── kerjaan/        # Types dan service kerjaan
│   │   ├── notes/          # Types dan service catatan
│   │   └── todos/          # Types dan service to-do
│   └── lib/                # Klien Supabase, auth, util tanggal
├── shared/                 # Fungsi murni yang dipakai bersama server dan web (misal: deadline.ts)
├── src/                    # Aplikasi frontend React + Tailwind CSS
├── supabase/
│   └── migrations/         # File SQL migrasi database Supabase
├── AGENTS.md               # Pedoman konteks untuk pengembangan & agen AI
├── vercel.json             # Konfigurasi deployment & SPA rewrites Vercel
├── .env.example            # Template environment variables
└── README.md               # Dokumentasi proyek
```

