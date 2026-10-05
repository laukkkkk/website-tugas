import React, { useState, useEffect, useRef } from 'react'
import type { Note } from '../../types/index.js'
import { formatWaktuWib, validasiFormNote } from '../../lib/catatan-helpers.js'
import { Button } from '../Button.js'

interface NoteEditorModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (payload: { isi: string }) => Promise<void>
  onDelete?: (note: Note) => void
  note?: Note | null
}

export function NoteEditorModal({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  note = null,
}: NoteEditorModalProps) {
  const [isi, setIsi] = useState('')
  const [errors, setErrors] = useState<{ isi?: string; global?: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!isOpen) {
      setErrors({})
      return
    }

    if (note) {
      setIsi(note.isi)
    } else {
      setIsi('')
    }
    setErrors({})

    // Fokus otomatis ke textarea saat modal terbuka
    const timer = setTimeout(() => {
      textareaRef.current?.focus()
    }, 50)
    return () => clearTimeout(timer)
  }, [isOpen, note])

  if (!isOpen) return null

  const isEdit = Boolean(note)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validationErrors = validasiFormNote(isi)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsSubmitting(true)
    setErrors({})

    try {
      await onSubmit({
        isi: isi.trim(),
      })
      onClose()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal menyimpan catatan.'
      setErrors({ global: message })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-[var(--bg-card)] rounded-3xl border border-[var(--border-main)] shadow-2xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border-main)] bg-[var(--bg-page)]/50">
          <div>
            <h2 className="text-lg font-bold text-[var(--text-main)]">
              {isEdit ? 'Buka Catatan' : 'Catatan Baru'}
            </h2>
            {isEdit && note?.updated_at && (
              <p className="text-xs text-[var(--text-sub)] mt-0.5">
                Terakhir diedit: {formatWaktuWib(note.updated_at)}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-input)] transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errors.global && (
            <div className="p-3.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300 text-xs">
              ⚠️ {errors.global}
            </div>
          )}

          {/* Isi Catatan */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-sub)] mb-1.5">
              Isi Catatan <span className="text-red-500">*</span>
            </label>
            <textarea
              ref={textareaRef}
              autoFocus
              rows={12}
              placeholder="Tuliskan catatan, ide, atau referensimu di sini..."
              value={isi}
              onChange={(e) => {
                setIsi(e.target.value)
                if (errors.isi) setErrors({ ...errors, isi: undefined })
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-[var(--bg-input)] text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-hidden focus:ring-2 focus:ring-cyan-500 transition-all font-sans leading-relaxed resize-y ${
                errors.isi
                  ? 'border-red-500 focus:ring-red-400'
                  : 'border-[var(--border-main)]'
              }`}
            />
            {errors.isi && (
              <p className="mt-1 text-xs text-red-500 font-medium">
                {errors.isi}
              </p>
            )}
          </div>

          {/* Tombol Aksi */}
          <div className="pt-3 flex items-center justify-between border-t border-[var(--border-main)]">
            <div>
              {isEdit && onDelete && note && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(note)}
                  className="text-red-600 dark:text-red-400 hover:bg-red-500/10"
                >
                  Hapus Catatan
                </Button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Batal
              </Button>

              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isSubmitting}
                isLoading={isSubmitting}
              >
                {isEdit ? 'Simpan Catatan' : 'Tambah Catatan'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
