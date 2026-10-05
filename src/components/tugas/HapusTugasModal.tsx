import { useState } from 'react'
import type { Tugas } from '../../types/index.js'
import { Button } from '../Button.js'

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
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={isDeleting}
          >
            Batal
          </Button>

          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={handleConfirm}
            isLoading={isDeleting}
          >
            Hapus Sekarang
          </Button>
        </div>
      </div>
    </div>
  )
}
