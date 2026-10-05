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
import { Button, Tabs, Card, Input } from '../components/index.js'

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
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-main)]">
            Daftar Kerjaan & Proyek
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-sub)] mt-1">
            Pantau proyek penting, pekerjaan sampingan, dan tenggat waktu penyelesaian.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => {
            setKerjaanToEdit(null)
            setIsFormOpen(true)
          }}
          leftIcon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
          }
          className="self-start sm:self-auto"
        >
          Tambah Kerjaan
        </Button>
      </div>

      {/* Banner Pesan Sukses */}
      {successMessage && (
        <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm flex items-center justify-between gap-3 shadow-2xs transition-all animate-fadeIn">
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
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-800 dark:text-red-200 text-xs sm:text-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-base">⚠️</span>
            <span>{error}</span>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchKerjaan}
            className="bg-red-500/20 hover:bg-red-500/30 text-red-900 dark:text-red-100 border-transparent"
          >
            Coba lagi
          </Button>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5 pb-2">
        {/* Filter Tabs */}
        <Tabs
          tabs={[
            { id: 'semua', label: 'Semua', count: kerjaanList.length },
            { id: 'belum_selesai', label: 'Belum Selesai', count: belumSelesaiCount },
            { id: 'selesai', label: 'Selesai', count: selesaiCount },
          ]}
          activeTab={filter}
          onChange={(tabId) => setFilter(tabId as FilterStatusKerjaan)}
        />

        {/* Search Input */}
        <div className="sm:w-72">
          <Input
            type="text"
            placeholder="Cari judul atau deskripsi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            }
            rightIcon={
              search ? (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="hover:text-[var(--text-main)] cursor-pointer"
                >
                  ✕
                </button>
              ) : undefined
            }
          />
        </div>
      </div>

      {/* Kontainer Daftar Kerjaan */}
      <div className="space-y-3">
        {loading ? (
          // Skeleton Loader
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card
                key={i}
                className="p-5 animate-pulse space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-md bg-slate-200 dark:bg-slate-800"></div>
                  <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
                </div>
                <div className="h-3 w-32 bg-slate-200 dark:bg-slate-800 rounded-md ml-8"></div>
                <div className="h-5 w-40 bg-slate-200 dark:bg-slate-800 rounded-full ml-8"></div>
              </Card>
            ))}
          </div>
        ) : filteredList.length === 0 ? (
          // Keadaan Kosong
          <Card className="py-16 px-4 border-dashed bg-[var(--bg-card)]/40 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center text-3xl mb-3">
              💼
            </div>
            <h3 className="text-base font-bold text-[var(--text-main)]">
              {search
                ? 'Tidak ada kerjaan yang cocok'
                : filter === 'selesai'
                ? 'Belum ada kerjaan yang selesai'
                : 'Belum ada kerjaan tercatat'}
            </h3>
            <p className="text-xs sm:text-sm text-[var(--text-sub)] max-w-sm mt-1">
              {search
                ? `Tidak ditemukan kerjaan dengan kata kunci "${search}".`
                : filter === 'selesai'
                ? 'Kerjaan atau proyek yang telah Anda tandai selesai akan muncul di sini.'
                : 'Catat tugas proyek atau pekerjaan pentingmu dengan menekan tombol "Tambah Kerjaan" di atas.'}
            </p>

            {!search && filter !== 'selesai' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setKerjaanToEdit(null)
                  setIsFormOpen(true)
                }}
                className="mt-4"
              >
                + Tambah Kerjaan Sekarang
              </Button>
            )}
          </Card>
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
