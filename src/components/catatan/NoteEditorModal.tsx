import React, { useState, useEffect } from 'react'
import type { Note } from '../../types/index.js'
import { formatWaktuWib, validasiFormNote } from '../../lib/catatan-helpers.js'

interface NoteEditorModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (payload: { judul: string; isi: string }) => Promise<void>
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
  const [judul, setJudul] = useState('')
  const [isi, setIsi] = useState('')
  const [errors, setErrors] = useState<{ judul?: string; isi?: string; global?: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setErrors({})
      return
    }

    if (note) {
      setJudul(note.judul)
      setIsi(note.isi)
    } else {
      setJudul('')
      setIsi('')
    }
    setErrors({})
  }, [isOpen, note])

  if (!isOpen) return null

  const isEdit = Boolean(note)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validationErrors = validasiFormNote(judul, isi)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsSubmitting(true)
    setErrors({})

    try {
      await onSubmit({
        judul: judul.trim(),
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {isEdit ? 'Buka Catatan' : 'Catatan Baru'}
            </h2>
            {isEdit && note?.updated_at && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Terakhir diedit: {formatWaktuWib(note.updated_at)}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errors.global && (
            <div className="p-3.5 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs">
              ⚠️ {errors.global}
            </div>
          )}

          {/* Judul Catatan */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Judul Catatan <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Misal: Rangkuman Materi Pertemuan 5"
              value={judul}
              onChange={(e) => {
                setJudul(e.target.value)
                if (errors.judul) setErrors({ ...errors, judul: undefined })
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-cyan-500 transition-all ${
                errors.judul
                  ? 'border-red-400 focus:ring-red-400'
                  : 'border-slate-300 dark:border-slate-700'
              }`}
            />
            {errors.judul && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium">
                {errors.judul}
              </p>
            )}
          </div>

          {/* Isi Catatan */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Isi Catatan <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={10}
              placeholder="Tuliskan catatan, ide, atau referensimu di sini..."
              value={isi}
              onChange={(e) => {
                setIsi(e.target.value)
                if (errors.isi) setErrors({ ...errors, isi: undefined })
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-cyan-500 transition-all font-sans leading-relaxed resize-y ${
                errors.isi
                  ? 'border-red-400 focus:ring-red-400'
                  : 'border-slate-300 dark:border-slate-700'
              }`}
            />
            {errors.isi && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium">
                {errors.isi}
              </p>
            )}
          </div>

          {/* Tombol Aksi */}
          <div className="pt-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
            <div>
              {isEdit && onDelete && note && (
                <button
                  type="button"
                  onClick={() => onDelete(note)}
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                >
                  Hapus Catatan
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-[#00acc1] text-slate-950 hover:bg-[#0097a7] transition-all shadow-xs cursor-pointer flex items-center gap-2 disabled:opacity-60"
              >
                {isSubmitting && (
                  <svg className="w-3.5 h-3.5 animate-spin text-slate-950" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                <span>{isEdit ? 'Simpan Catatan' : 'Tambah Catatan'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
