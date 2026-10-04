import { useEffect, useState, useCallback, useMemo } from 'react'
import type { Kerjaan } from '../types/index.js'
import { apiFetch } from '../lib/api.js'
import {
  type FilterStatusKerjaan,
  saringKerjaan,
} from '../lib/kerjaan-helpers.js'
import { KerjaanItem } from '../components/kerjaan/KerjaanItem.js'
import { KerjaanFormModal } from '../components/kerjaan/KerjaanFormModal.js'
import { HapusKerjaanModal } from '../components/kerjaan/HapusKerjaanModal.js'

export function Kerjaan() {
  const [kerjaanList, setKerjaanList] = useState<Kerjaan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Filter & Search
  const [filter, setFilter] = useState<FilterStatusKerjaan>('semua')
  const [search, setSearch] = useState('')

  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [kerjaanToEdit, setKerjaanToEdit] = useState<Kerjaan | null>(null)
  const [kerjaanToDelete, setKerjaanToDelete] = useState<Kerjaan | null>(null)

  const showNotification = (msg: string) => {
    setSuccessMessage(msg)
    setTimeout(() => {
      setSuccessMessage((curr) => (curr === msg ? null : curr))
    }, 3500)
  }

  const fetchKerjaan = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch('/api/kerjaan')
      if (!res.ok) {
        throw new Error(`Gagal memuat daftar kerjaan (${res.status})`)
      }
      const data = (await res.json()) as Kerjaan[]
      setKerjaanList(Array.isArray(data) ? data : [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan jaringan.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchKerjaan()
  }, [fetchKerjaan])

  // Ceklis Toggle Selesai (Update Optimistik)
  const handleToggleSelesai = async (kerjaan: Kerjaan) => {
    const statusBaru = !kerjaan.selesai

    setKerjaanList((prev) =>
      prev.map((item) =>
        item.id === kerjaan.id ? { ...item, selesai: statusBaru } : item
      )
    )

    try {
      const res = await apiFetch(`/api/kerjaan/${kerjaan.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ selesai: statusBaru }),
      })

      if (!res.ok) {
        throw new Error(`Gagal mengubah status kerjaan (${res.status})`)
      }

      showNotification(
        statusBaru
          ? `Kerjaan "${kerjaan.judul}" ditandai selesai! 🎉`
          : `Kerjaan "${kerjaan.judul}" dikembalikan ke belum selesai.`
      )
    } catch (err) {
      // Rollback jika gagal
      setKerjaanList((prev) =>
        prev.map((item) =>
          item.id === kerjaan.id ? { ...item, selesai: !statusBaru } : item
        )
      )
      const message = err instanceof Error ? err.message : 'Gagal memperbarui status.'
      setError(message)
    }
  }

  // Simpan Form (Tambah Baru / Edit)
  const handleFormSubmit = async (payload: {
    judul: string
    deskripsi: string | null
    deadline: string
  }) => {
    if (kerjaanToEdit) {
      // Edit Kerjaan
      const res = await apiFetch(`/api/kerjaan/${kerjaanToEdit.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.message || `Gagal mengubah kerjaan (${res.status})`)
      }
      const updated = (await res.json()) as Kerjaan
      setKerjaanList((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      )
      showNotification('Kerjaan berhasil diperbarui!')
    } else {
      // Tambah Kerjaan Baru
      const res = await apiFetch('/api/kerjaan', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.message || `Gagal menambahkan kerjaan (${res.status})`)
      }
      const baru = (await res.json()) as Kerjaan
      setKerjaanList((prev) => [baru, ...prev])
      showNotification('Kerjaan baru berhasil ditambahkan!')
    }
  }

  // Hapus Kerjaan
  const handleConfirmHapus = async (kerjaan: Kerjaan) => {
    const res = await apiFetch(`/api/kerjaan/${kerjaan.id}`, {
      method: 'DELETE',
    })
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(errorData.message || `Gagal menghapus kerjaan (${res.status})`)
    }
    setKerjaanList((prev) => prev.filter((item) => item.id !== kerjaan.id))
    showNotification(`Kerjaan "${kerjaan.judul}" berhasil dihapus.`)
  }

  // Filter dan Pencarian
  const filteredList = useMemo(() => {
    return saringKerjaan(kerjaanList, filter, search)
  }, [kerjaanList, filter, search])

  const belumSelesaiCount = useMemo(
    () => kerjaanList.filter((k) => !k.selesai).length,
    [kerjaanList]
  )
  const selesaiCount = useMemo(
    () => kerjaanList.filter((k) => k.selesai).length,
    [kerjaanList]
  )

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Halaman & Tombol Tambah */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Daftar Kerjaan & Proyek
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Pantau proyek penting, pekerjaan sampingan, dan tenggat waktu penyelesaian.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setKerjaanToEdit(null)
            setIsFormOpen(true)
          }}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          <span>Tambah Kerjaan</span>
        </button>
      </div>

      {/* Banner Pesan Sukses */}
      {successMessage && (
        <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm flex items-center justify-between gap-3 shadow-2xs transition-all animate-fadeIn">
          <div className="flex items-center gap-2">
            <span>✅</span>
            <span className="font-medium">{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Banner Error jika ada */}
      {error && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/40 dark:border-red-900/60 text-red-800 dark:text-red-200 text-xs sm:text-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-base">⚠️</span>
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={fetchKerjaan}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-red-100 dark:bg-red-900/60 hover:bg-red-200 text-red-900 dark:text-red-100 transition-colors cursor-pointer"
          >
            Coba lagi
          </button>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5 pb-2">
        {/* Filter Tabs */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setFilter('semua')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filter === 'semua'
                ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Semua ({kerjaanList.length})
          </button>

          <button
            type="button"
            onClick={() => setFilter('belum_selesai')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filter === 'belum_selesai'
                ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Belum Selesai ({belumSelesaiCount})
          </button>

          <button
            type="button"
            onClick={() => setFilter('selesai')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filter === 'selesai'
                ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Selesai ({selesaiCount})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative sm:w-72">
          <svg
            className="w-4 h-4 absolute left-3 top-3 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Cari judul atau deskripsi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500 shadow-2xs"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Kontainer Daftar Kerjaan */}
      <div className="space-y-3">
        {loading ? (
          // Skeleton Loader
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-pulse space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-md bg-slate-200 dark:bg-slate-800"></div>
                  <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
                </div>
                <div className="h-3 w-32 bg-slate-200 dark:bg-slate-800 rounded-md ml-8"></div>
                <div className="h-5 w-40 bg-slate-200 dark:bg-slate-800 rounded-full ml-8"></div>
              </div>
            ))}
          </div>
        ) : filteredList.length === 0 ? (
          // Keadaan Kosong
          <div className="py-16 px-4 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center text-3xl mb-3">
              💼
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              {search
                ? 'Tidak ada kerjaan yang cocok'
                : filter === 'selesai'
                ? 'Belum ada kerjaan yang selesai'
                : 'Belum ada kerjaan tercatat'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mt-1">
              {search
                ? `Tidak ditemukan kerjaan dengan kata kunci "${search}".`
                : filter === 'selesai'
                ? 'Kerjaan atau proyek yang telah Anda tandai selesai akan muncul di sini.'
                : 'Catat tugas proyek atau pekerjaan pentingmu dengan menekan tombol "Tambah Kerjaan" di atas.'}
            </p>

            {!search && filter !== 'selesai' && (
              <button
                type="button"
                onClick={() => {
                  setKerjaanToEdit(null)
                  setIsFormOpen(true)
                }}
                className="mt-4 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
              >
                + Tambah Kerjaan Sekarang
              </button>
            )}
          </div>
        ) : (
          // List Item Kerjaan
          filteredList.map((kerjaan) => (
            <KerjaanItem
              key={kerjaan.id}
              kerjaan={kerjaan}
              onToggleSelesai={handleToggleSelesai}
              onEdit={(k) => {
                setKerjaanToEdit(k)
                setIsFormOpen(true)
              }}
              onHapus={(k) => setKerjaanToDelete(k)}
            />
          ))
        )}
      </div>

      {/* Modal Form Tambah / Edit */}
      <KerjaanFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setKerjaanToEdit(null)
        }}
        onSubmit={handleFormSubmit}
        kerjaanToEdit={kerjaanToEdit}
      />

      {/* Modal Konfirmasi Hapus */}
      <HapusKerjaanModal
        isOpen={Boolean(kerjaanToDelete)}
        kerjaan={kerjaanToDelete}
        onClose={() => setKerjaanToDelete(null)}
        onConfirm={handleConfirmHapus}
      />
    </div>
  )
}
