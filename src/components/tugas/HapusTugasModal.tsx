import { useState } from 'react'
import type { Tugas } from '../../types/index.js'

interface HapusTugasModalProps {
  tugas: Tugas | null
  isOpen: boolean
  onClose: () => void
  onConfirm: (tugas: Tugas) => Promise<void>
}

export function HapusTugasModal({
  tugas,
  isOpen,
  onClose,
  onConfirm,
}: HapusTugasModalProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen || !tugas) return null

  const handleConfirm = async () => {
    setIsDeleting(true)
    setError(null)
    try {
      await onConfirm(tugas)
      onClose()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal menghapus tugas.'
      setError(message)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-[var(--bg-card)] rounded-3xl border border-[var(--border-main)] shadow-2xl overflow-hidden p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center text-xl mb-4">
          🗑️
        </div>

        <h3 className="text-lg font-bold text-[var(--text-main)]">
          Hapus Tugas Kuliah?
        </h3>

        <p className="text-xs sm:text-sm text-[var(--text-sub)] mt-2 leading-relaxed">
          Apakah Anda yakin ingin menghapus tugas{' '}
          <strong className="text-[var(--text-main)]">
            &ldquo;{tugas.judul}&rdquo;
          </strong>{' '}
          ({tugas.matkul})? Tindakan ini tidak dapat dibatalkan.
        </p>

        {error && (
          <div className="mt-3 p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300 text-xs">
            {error}
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-[var(--border-main)] bg-[var(--bg-input)] text-[var(--text-main)] hover:bg-[var(--bg-page)] transition-colors cursor-pointer disabled:opacity-50"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="px-4.5 py-2 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white transition-all shadow-xs cursor-pointer flex items-center gap-2 disabled:opacity-60"
          >
            {isDeleting && (
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            <span>Hapus Sekarang</span>
          </button>
        </div>
      </div>
    </div>
  )
}
