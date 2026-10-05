import { useState } from 'react'
import type { Kerjaan } from '../../types/index.js'
import { Button } from '../Button.js'

interface HapusKerjaanModalProps {
  kerjaan: Kerjaan | null
  isOpen: boolean
  onClose: () => void
  onConfirm: (kerjaan: Kerjaan) => Promise<void>
}

export function HapusKerjaanModal({
  kerjaan,
  isOpen,
  onClose,
  onConfirm,
}: HapusKerjaanModalProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen || !kerjaan) return null

  const handleConfirm = async () => {
    setIsDeleting(true)
    setError(null)
    try {
      await onConfirm(kerjaan)
      onClose()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal menghapus kerjaan.'
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
          Hapus Kerjaan / Proyek?
        </h3>

        <p className="text-xs sm:text-sm text-[var(--text-sub)] mt-2 leading-relaxed">
          Apakah Anda yakin ingin menghapus kerjaan{' '}
          <strong className="text-[var(--text-main)]">
            &ldquo;{kerjaan.judul}&rdquo;
          </strong>? Tindakan ini tidak dapat dibatalkan.
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
