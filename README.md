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

## Struktur Folder

```text
├── api/                    # Endpoint serverless Vercel (health, tugas, kerjaan, notes, todos, bot, reminder)
├── public/                 # Static assets
├── scripts/                # Skrip bantu (misal: bot dev, set webhook)
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
├── .env.example            # Template environment variables
└── README.md               # Dokumentasi proyek
```
