import { useState } from 'react'
import { hariTersisa, labelSisaWaktu, kelasWarna, type KelasWarna } from '../shared/deadline'

interface SampleItem {
  id: string
  judul: string
  tipe: 'tugas' | 'kerjaan'
  kategori: string
  deadline: string
}

const sampleItems: SampleItem[] = [
  {
    id: '1',
    judul: 'Makalah Sistem Terdistribusi',
    tipe: 'tugas',
    kategori: 'Sistem Terdistribusi',
    deadline: new Date(Date.now() + 0 * 86400000).toISOString().split('T')[0], // Hari ini
  },
  {
    id: '2',
    judul: 'Laporan Praktikum Jaringan Komputer',
    tipe: 'tugas',
    kategori: 'Jarkom',
    deadline: new Date(Date.now() + 1 * 86400000).toISOString().split('T')[0], // Besok
  },
  {
    id: '3',
    judul: 'Revisi UI Desain Dashboard Klien',
    tipe: 'kerjaan',
    kategori: 'Freelance',
    deadline: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0], // 3 hari lagi
  },
  {
    id: '4',
    judul: 'Deploy Staging & Integrasi Supabase',
    tipe: 'kerjaan',
    kategori: 'Project A',
    deadline: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0], // 5 hari lagi
  },
  {
    id: '5',
    judul: 'Review Proposal Skripsi Bab 1',
    tipe: 'tugas',
    kategori: 'Tugas Akhir',
    deadline: new Date(Date.now() + 9 * 86400000).toISOString().split('T')[0], // 9 hari lagi
  },
  {
    id: '6',
    judul: 'Kuis Teori Graf (Sudah lewat)',
    tipe: 'tugas',
    kategori: 'Matematika Diskrit',
    deadline: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0], // Terlambat 2 hari
  },
]

function getBadgeStyle(warna: KelasWarna): string {
  switch (warna) {
    case 'merah':
      return 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-900'
    case 'kuning':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
    case 'hijau':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
    case 'netral':
    default:
      return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
  }
}

export default function App() {
  const [testDate, setTestDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const kalkulasiHari = hariTersisa(testDate)
  const labelKalkulasi = labelSisaWaktu(kalkulasiHari)
  const warnaKalkulasi = kelasWarna(kalkulasiHari)

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased font-sans">
      {/* Mobile Header Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[#e0f7fa] dark:bg-slate-900 border-b border-cyan-200 dark:border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-[#00acc1] flex items-center justify-center text-white font-bold text-lg">
            T
          </div>
          <span className="font-bold text-[#00606b] dark:text-cyan-400 text-lg">
            Website Tugas
          </span>
        </div>
        <button
          type="button"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg bg-white/70 dark:bg-slate-800 text-[#00606b] dark:text-cyan-400 border border-cyan-200 dark:border-slate-700 focus:outline-none"
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'block' : 'hidden'
        } md:block md:w-64 bg-[#e0f7fa] dark:bg-slate-900 border-r border-cyan-200 dark:border-slate-800 p-5 shrink-0 transition-all`}
      >
        <div className="hidden md:flex items-center space-x-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-[#00acc1] flex items-center justify-center text-white font-bold text-xl shadow-md">
            WT
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#00606b] dark:text-cyan-400 leading-tight">
              Website Tugas
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400">Pengingat & Kerjaan</p>
          </div>
        </div>

        <nav className="space-y-1.5 text-sm font-medium">
          <a
            href="#dashboard"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#00acc1] text-white shadow-sm font-semibold"
          >
            <span>📊</span> Dashboard
          </a>
          <a
            href="#tugas"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-cyan-100/70 dark:hover:bg-slate-800 transition-colors"
          >
            <span>📚</span> Daftar Tugas
          </a>
          <a
            href="#kerjaan"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-cyan-100/70 dark:hover:bg-slate-800 transition-colors"
          >
            <span>💼</span> Daftar Kerjaan
          </a>
          <a
            href="#notes"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-cyan-100/70 dark:hover:bg-slate-800 transition-colors"
          >
            <span>📝</span> Notes & Todos
          </a>
        </nav>

        <div className="mt-8 pt-6 border-t border-cyan-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Zona Waktu: <b>WIB (UTC+7)</b></span>
          </div>
          <div>Mode: <b>Single User</b></div>
          <div>Bot Telegram: <b>grammY Webhook</b></div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 max-w-6xl overflow-y-auto">
        {/* Header Status */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 mb-6 border-b border-slate-200 dark:border-slate-800 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-100 text-[#00606b] dark:bg-cyan-950 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00acc1]"></span>
              Issue #1 — Fondasi Repo Selesai
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Dashboard Pengingat Tugas & Kerjaan
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
              Kerangka Vite + React + TypeScript + Tailwind CSS siap berjalan lokal dan di-deploy ke Vercel.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/api/health"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Tes /api/health
            </a>
          </div>
        </div>

        {/* 3 Metric Cards as per AGENTS.md:
            - Tugas belum selesai (Merah)
            - Kerjaan belum selesai (Kuning)
            - Deadline terdekat (Warna deadline)
        */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <div className="p-5 rounded-xl border border-red-200 dark:border-red-900 bg-red-50/70 dark:bg-red-950/20 shadow-sm">
            <div className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase tracking-wider">
              Tugas Belum Selesai
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-red-600 dark:text-red-400">4</span>
              <span className="text-xs text-red-600/80 dark:text-red-300">tugas aktif</span>
            </div>
            <p className="text-xs text-red-700/80 dark:text-red-300 mt-2">
              Kartu status warna merah sesuai pedoman AGENTS.md
            </p>
          </div>

          <div className="p-5 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/70 dark:bg-amber-950/20 shadow-sm">
            <div className="text-xs font-semibold text-amber-800 dark:text-amber-400 uppercase tracking-wider">
              Kerjaan Belum Selesai
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-amber-600 dark:text-amber-400">2</span>
              <span className="text-xs text-amber-700/80 dark:text-amber-300">pekerjaan aktif</span>
            </div>
            <p className="text-xs text-amber-700/80 dark:text-amber-300 mt-2">
              Kartu status warna kuning sesuai pedoman AGENTS.md
            </p>
          </div>

          <div className="p-5 rounded-xl border border-cyan-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div className="text-xs font-semibold text-[#00606b] dark:text-cyan-400 uppercase tracking-wider">
              Deadline Terdekat
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-800 dark:text-slate-100">Hari ini</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${getBadgeStyle('merah')}`}>
                Merah
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Makalah Sistem Terdistribusi (23:59 WIB)
            </p>
          </div>
        </div>

        {/* Interactive Deadline Tester Section */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Uji Interaktif Util Deadline (shared/deadline.ts)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Menghitung selisih hari kalender dalam WIB (Asia/Jakarta) dengan aturan warna otomatis.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="test-date" className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Pilih Tanggal:
              </label>
              <input
                id="test-date"
                type="date"
                value={testDate}
                onChange={(e) => setTestDate(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#00acc1]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Selisih Hari (n)</span>
              <span className="text-2xl font-bold font-mono text-[#00606b] dark:text-cyan-400">
                {kalkulasiHari >= 0 ? `+${kalkulasiHari}` : kalkulasiHari} hari
              </span>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Label Sisa Waktu</span>
              <span className="text-xl font-bold text-slate-800 dark:text-slate-200">
                {labelKalkulasi}
              </span>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Kelas Warna</span>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getBadgeStyle(warnaKalkulasi)}`}>
                {warnaKalkulasi}
              </span>
            </div>
          </div>

          {/* Quick preset buttons */}
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Uji Nilai Batas Cepat:</span>
            {[
              { label: 'n = -1 (Terlambat)', offset: -1 },
              { label: 'n = 0 (Hari ini)', offset: 0 },
              { label: 'n = 1 (Besok)', offset: 1 },
              { label: 'n = 2 (Kuning)', offset: 2 },
              { label: 'n = 3 (Kuning)', offset: 3 },
              { label: 'n = 4 (Hijau)', offset: 4 },
              { label: 'n = 6 (Hijau)', offset: 6 },
              { label: 'n = 7 (Netral)', offset: 7 },
            ].map((preset) => {
              const target = new Date(Date.now() + preset.offset * 86400000).toISOString().split('T')[0]
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setTestDate(target)}
                  className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-cyan-100 dark:hover:bg-slate-700 transition"
                >
                  {preset.label}
                </button>
              )
            })}
          </div>
        </section>

        {/* Sample List Showcase */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Preview Daftar Tugas & Kerjaan
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Diurutkan berdasarkan deadline dengan badge warna deadline dinamis.
              </p>
            </div>
            <button
              type="button"
              className="px-3.5 py-1.5 rounded-lg bg-[#00acc1] hover:bg-[#0097a7] text-white text-xs font-semibold shadow-sm transition"
            >
              + Tambah Tugas
            </button>
          </div>

          <div className="space-y-3">
            {sampleItems.map((item) => {
              const n = hariTersisa(item.deadline)
              const label = labelSisaWaktu(n)
              const warna = kelasWarna(n)
              const isOverdue = n < 0

              return (
                <div
                  key={item.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-lg border transition-all ${
                    isOverdue
                      ? 'bg-red-50/40 dark:bg-red-950/20 border-red-200 dark:border-red-900'
                      : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-cyan-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-slate-300 text-[#00acc1] focus:ring-[#00acc1]"
                    />
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {item.judul}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        <span className="capitalize font-medium text-[#00606b] dark:text-cyan-400">
                          {item.tipe}
                        </span>
                        <span>•</span>
                        <span>{item.kategori}</span>
                        <span>•</span>
                        <span>Deadline: {item.deadline} 23:59 WIB</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 sm:mt-0 flex items-center gap-2 self-end sm:self-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getBadgeStyle(warna)}`}>
                      {label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </main>
    </div>
  )
}
