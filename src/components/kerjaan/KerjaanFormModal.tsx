import React, { useState, useEffect } from 'react'
import type { Kerjaan } from '../../types/index.js'
import {
  type KerjaanFormData,
  type KerjaanFormErrorState,
  deadlineKeFormParts,
  gabungDeadlineToIso,
  validasiFormKerjaan,
} from '../../lib/kerjaan-helpers.js'
import { Button } from '../Button.js'

interface KerjaanFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (payload: {
    judul: string
    deskripsi: string | null
    deadline: string
  }) => Promise<void>
  kerjaanToEdit?: Kerjaan | null
}

const DEFAULT_FORM: KerjaanFormData = {
  judul: '',
  deskripsi: '',
  tanggal: '',
  jam: '23:59',
}

export function KerjaanFormModal({
  isOpen,
  onClose,
  onSubmit,
  kerjaanToEdit = null,
}: KerjaanFormModalProps) {
  const [form, setForm] = useState<KerjaanFormData>(DEFAULT_FORM)
  const [errors, setErrors] = useState<KerjaanFormErrorState>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setErrors({})
      return
    }

    if (kerjaanToEdit) {
      const { tanggal, jam } = deadlineKeFormParts(kerjaanToEdit.deadline)
      setForm({
        judul: kerjaanToEdit.judul,
        deskripsi: kerjaanToEdit.deskripsi || '',
        tanggal,
        jam: jam || '23:59',
      })
    } else {
      const now = new Date()
      const pad = (n: number) => String(n).padStart(2, '0')
      const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
      setForm({
        ...DEFAULT_FORM,
        tanggal: todayStr,
        jam: '23:59',
      })
    }
    setErrors({})
  }, [isOpen, kerjaanToEdit])

  if (!isOpen) return null

  const isEdit = Boolean(kerjaanToEdit)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validationErrors = validasiFormKerjaan(form)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsSubmitting(true)
    setErrors({})

    try {
      const deadlineIso = gabungDeadlineToIso(form.tanggal, form.jam)
      await onSubmit({
        judul: form.judul.trim(),
        deskripsi: form.deskripsi.trim() || null,
        deadline: deadlineIso,
      })
      onClose()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal menyimpan kerjaan.'
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
        className="relative w-full max-w-lg bg-[var(--bg-card)] rounded-3xl border border-[var(--border-main)] shadow-2xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border-main)] bg-[var(--bg-page)]/50">
          <div>
            <h2 className="text-lg font-bold text-[var(--text-main)]">
              {isEdit ? 'Edit Kerjaan / Proyek' : 'Tambah Kerjaan Baru'}
            </h2>
            <p className="text-xs text-[var(--text-sub)] mt-0.5">
              {isEdit
                ? 'Perbarui detail kerjaan atau proyek Anda'
                : 'Isi informasi kerjaan dan batas waktu penyelesaian'}
            </p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4.5">
          {errors.global && (
            <div className="p-3.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <span>⚠️</span>
              <span>{errors.global}</span>
            </div>
          )}

          {/* Judul Kerjaan */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-sub)] mb-1.5">
              Judul Kerjaan <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Misal: Revisi Proposal Klien PT Maju"
              value={form.judul}
              onChange={(e) => {
                setForm({ ...form, judul: e.target.value })
                if (errors.judul) setErrors({ ...errors, judul: undefined })
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-[var(--bg-input)] text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-hidden focus:ring-2 focus:ring-cyan-600 dark:focus:ring-cyan-500 transition-all ${
                errors.judul
                  ? 'border-red-500 focus:ring-red-400'
                  : 'border-[var(--border-main)]'
              }`}
            />
            {errors.judul && (
              <p className="mt-1 text-xs text-red-500 font-medium">
                {errors.judul}
              </p>
            )}
          </div>

          {/* Deskripsi Kerjaan */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-sub)] mb-1.5">
              Deskripsi <span className="text-[var(--text-muted)] font-normal lowercase">(opsional)</span>
            </label>
            <textarea
              rows={3}
              placeholder="Jelaskan detail apa saja yang harus diselesaikan..."
              value={form.deskripsi}
              onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-main)] text-sm bg-[var(--bg-input)] text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-hidden focus:ring-2 focus:ring-cyan-600 dark:focus:ring-cyan-500 transition-all resize-none"
            />
          </div>

          {/* Deadline: Tanggal dan Jam */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-sub)] mb-1.5">
              Deadline (Tenggat Waktu) <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <input
                  type="date"
                  value={form.tanggal}
                  onChange={(e) => {
                    setForm({ ...form, tanggal: e.target.value })
                    if (errors.deadline) setErrors({ ...errors, deadline: undefined })
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-[var(--bg-input)] text-[var(--text-main)] focus:outline-hidden focus:ring-2 focus:ring-cyan-600 dark:focus:ring-cyan-500 transition-all ${
                    errors.deadline
                      ? 'border-red-500 focus:ring-red-400'
                      : 'border-[var(--border-main)]'
                  }`}
                />
              </div>

              <div>
                <input
                  type="time"
                  value={form.jam}
                  onChange={(e) => setForm({ ...form, jam: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-main)] text-sm bg-[var(--bg-input)] text-[var(--text-main)] focus:outline-hidden focus:ring-2 focus:ring-cyan-600 dark:focus:ring-cyan-500 transition-all"
                />
                <span className="text-[11px] text-[var(--text-muted)] mt-1 block">Default: 23:59 WIB</span>
              </div>
            </div>
            {errors.deadline && (
              <p className="mt-1 text-xs text-red-500 font-medium">
                {errors.deadline}
              </p>
            )}
          </div>

          {/* Tombol Aksi Form */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-[var(--border-main)]">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Batal
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
            >
              {isEdit ? 'Simpan Perubahan' : 'Tambah Kerjaan'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
