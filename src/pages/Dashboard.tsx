import { useEffect, useState, useCallback, useMemo } from 'react'
import type { Tugas, Kerjaan } from '../types/index.js'
import { apiFetch } from '../lib/api.js'
import { StatCard } from '../components/dashboard/StatCard.js'
import { TugasTerdekatList } from '../components/dashboard/TugasTerdekatList.js'
import { TelegramPreviewCard } from '../components/dashboard/TelegramPreviewCard.js'
import { useRouter } from '../context/RouterContext.js'
import { hitungDeadlineTerdekat } from '../lib/dashboard-helpers.js'

export function Dashboard() {
  const { navigate } = useRouter()
  const [tugasList, setTugasList] = useState<Tugas[]>([])
  const [kerjaanList, setKerjaanList] = useState<Kerjaan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    setError(null)

    try {
      const [tugasRes, kerjaanRes] = await Promise.all([
        apiFetch('/api/tugas?belum_selesai=true'),
        apiFetch('/api/kerjaan?belum_selesai=true'),
      ])

      if (!tugasRes.ok) {
        throw new Error(`Gagal memuat tugas (${tugasRes.status})`)
      }
      if (!kerjaanRes.ok) {
        throw new Error(`Gagal memuat kerjaan (${kerjaanRes.status})`)
      }

      const tugasData = (await tugasRes.json()) as Tugas[]
      const kerjaanData = (await kerjaanRes.json()) as Kerjaan[]

      setTugasList(Array.isArray(tugasData) ? tugasData : [])
      setKerjaanList(Array.isArray(kerjaanData) ? kerjaanData : [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan saat mengambil data.'
      setError(message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Hitung deadline terdekat dari semua tugas dan kerjaan yang belum selesai
  const deadlineInfo = useMemo(() => {
    return hitungDeadlineTerdekat(tugasList, kerjaanList)
  }, [tugasList, kerjaanList])

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-main)]">
            Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-sub)] mt-1 font-medium">
            Ringkasan status tugas, kerjaan, dan deadline terdekat Anda.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchData(true)}
          disabled={loading || refreshing}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border border-[var(--border-main)] bg-[var(--bg-card)] text-[var(--text-main)] hover:bg-[var(--bg-muted)] transition-colors shadow-2xs cursor-pointer disabled:opacity-60"
        >
          <svg
            className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-cyan-600 dark:text-cyan-400' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span>{refreshing ? 'Memperbarui...' : 'Segarkan Data'}</span>
        </button>
      </div>

      {/* Pesan Kesalahan jika ada */}
      {error && (
        <div className="p-4 rounded-xl border border-red-300 dark:border-red-800 bg-red-100 dark:bg-red-950/80 text-red-900 dark:text-red-200 text-xs sm:text-sm flex items-center justify-between gap-3 font-medium">
          <div className="flex items-center gap-2">
            <span className="text-base">⚠️</span>
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchData(true)}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-red-200 dark:bg-red-900 hover:bg-red-300 text-red-900 dark:text-red-100 transition-colors cursor-pointer"
          >
            Coba lagi
          </button>
        </div>
      )}

      {/* 3 Kartu Ringkasan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Kartu 1: Tugas belum selesai (Merah) */}
        <StatCard
          title="Tugas belum selesai"
          value={tugasList.length}
          subtext="Tugas perkuliahan yang aktif"
          icon="📋"
          color="merah"
          loading={loading}
          onClick={() => navigate('/tugas')}
        />

        {/* Kartu 2: Kerjaan belum selesai (Kuning) */}
        <StatCard
          title="Kerjaan belum selesai"
          value={kerjaanList.length}
          subtext="Kerjaan & proyek yang aktif"
          icon="💼"
          color="kuning"
          loading={loading}
          onClick={() => navigate('/kerjaan')}
        />

        {/* Kartu 3: Deadline terdekat (Warna mengikuti kelasWarna, teks labelSisaWaktu) */}
        <StatCard
          title="Deadline terdekat"
          value={deadlineInfo.label}
          subtext={deadlineInfo.subtext}
          icon="⏰"
          color={deadlineInfo.warna}
          loading={loading}
          onClick={() => {
            if (deadlineInfo.terdekat?.tipe === 'tugas') {
              navigate('/tugas')
            } else if (deadlineInfo.terdekat?.tipe === 'kerjaan') {
              navigate('/kerjaan')
            }
          }}
        />
      </div>

      {/* Grid Utama: Tugas Terdekat & Pratinjau Telegram */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kolom Kiri: Daftar Tugas Terdekat (Maksimal 3) */}
        <div className="lg:col-span-7 h-full">
          <TugasTerdekatList tugasList={tugasList} loading={loading} />
        </div>

        {/* Kolom Kanan: Pratinjau Pesan Telegram jam 09.00 */}
        <div className="lg:col-span-5 h-full">
          <TelegramPreviewCard
            tugasList={tugasList}
            kerjaanList={kerjaanList}
            loading={loading}
          />
        </div>
      </div>
    </div>
  )
}
