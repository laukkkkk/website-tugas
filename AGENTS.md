# Website Tugas

Website pengingat tugas dan kerjaan pribadi (satu pengguna) dengan bot Telegram.

## Stack
- Web: React + Vite + TypeScript + Tailwind CSS
- Backend dan bot: Node.js + TypeScript, serverless function Vercel di folder /api
- Bot Telegram: grammY, mode webhook
- Database dan login: Supabase (PostgreSQL + Supabase Auth)
- Hosting: satu project Vercel
- Pemicu reminder: cron-job.org

## Struktur folder
- /src : aplikasi React
- /api : endpoint Vercel (tugas, kerjaan, notes, todos, bot, reminder)
- /server/features/tugas, kerjaan, notes, todos : types dan service per fitur. Dipakai bersama oleh API dan bot
- /server/lib : klien Supabase, auth, util tanggal
- /shared : fungsi murni yang dipakai server dan web (mis. deadline.ts)
- /supabase/migrations : file SQL
- /scripts : skrip bantu (dev bot, set webhook)

## Aturan penting
- Satu pengguna saja. Bot hanya merespons OWNER_CHAT_ID. Web hanya satu akun, tanpa fitur daftar.
- Zona waktu selalu Asia/Jakarta (WIB). Deadline disimpan sebagai timestamptz.
- Jika deadline hanya berisi tanggal, jam default 23:59 WIB.
- Service role key, token bot, dan rahasia lain TIDAK BOLEH ada di kode frontend. Semua lewat environment variables.
- Logika data hanya ada di /server/features. API dan bot sama-sama memanggil service di sana, jangan menduplikasi logika.
- Fitur baru nanti (mis. keuangan) harus bisa ditambah dengan menambah folder fitur baru tanpa mengubah fitur lama.
- Tugas dan kerjaan punya reminder. Notes dan to-do TIDAK punya reminder.

## Skema database
- tugas: id (uuid pk), judul (text, wajib), matkul (text, wajib), tipe ('individu' atau 'kelompok'), link_pengumpulan (text, boleh kosong), deadline (timestamptz, wajib), selesai (boolean, default false), created_at
- kerjaan: id (uuid pk), judul (wajib), deskripsi (text), deadline (timestamptz, wajib), selesai (default false), created_at
- notes: id, judul, isi, created_at, updated_at
- todos: id, teks, selesai (default false), created_at
- bot_sessions: key (text pk), value (jsonb), updated_at. Menyimpan state percakapan bot karena serverless tidak menyimpan memori antar request

## Aturan warna deadline (web dan teks bot)
Berdasarkan selisih hari dari sekarang (WIB):
- kurang dari 2 hari: merah
- kurang dari 4 hari: kuning
- kurang dari 7 hari: hijau
- selebihnya: netral
- sudah lewat: merah dengan label "Terlambat n hari"
Label sisa waktu: "Hari ini", "Besok", "n hari lagi".

## Desain web
- Mode terang dan gelap menyeluruh di seluruh aplikasi menggunakan class-based dark mode (`html.dark`) dan token CSS semantik (`--bg-page`, `--bg-card`, `--bg-input`, `--text-main`, `--text-sub`, `--border-main`, dll).
- Mode terang: dasar putih/slate-50, warna kedua cyan (latar sidebar sekitar #E0F7FA, tombol utama #00838F / #00ACC1, teks aksen #00606B, teks utama #0F172A).
- Mode gelap: latar halaman sekitar #0F172A, kartu sekitar #1E293B, border sekitar #334155. Teks utama harus putih terang (#FFFFFF), teks sekunder minimal #CBD5E1 (tidak boleh redup).
- Seluruh kombinasi teks dan latar belakang wajib memenuhi standar rasio kontras WCAG AA (>= 4.5:1).
- Kartu ringkasan dan badge deadline (merah, kuning, hijau) harus memiliki varian mode gelap dengan latar belakang gelap bertinta (dark tinted) dan teks kontras tinggi.
- Laptop: sidebar kiri. HP: sidebar tersembunyi, dibuka lewat tombol garis tiga.
- Daftar tugas dan kerjaan diurutkan per deadline (bukan per mata kuliah). Yang selesai turun ke bawah dan judulnya dicoret.
- Semua halaman, modal, form, dan fitur baru WAJIB menggunakan token warna semantik, tidak boleh menggunakan warna teks/latar hardcoded yang mengabaikan tema gelap.

## Environment variables
SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (server saja), VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (web), BOT_TOKEN, OWNER_CHAT_ID, TELEGRAM_WEBHOOK_SECRET, REMINDER_SECRET
