import React, { useState, useEffect } from 'react'
import type { Tugas, TipeTugas } from '../../types/index.js'
import {
  type TugasFormData,
  type FormErrorState,
  deadlineKeFormParts,
  gabungDeadlineToIso,
  validasiFormTugas,
} from '../../lib/tugas-helpers.js'
import { Button } from '../Button.js'

interface TugasFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (payload: {
    judul: string
    matkul: string
    tipe: TipeTugas
    link_pengumpulan: string | null
    deadline: string
  }) => Promise<void>
  tugasToEdit?: Tugas | null
}

const DEFAULT_FORM: TugasFormData = {
  judul: '',
  matkul: '',
  tipe: 'individu',
  link_pengumpulan: '',
  tanggal: '',
  jam: '23:59',
}

export function TugasFormModal({
  isOpen,
  onClose,
  onSubmit,
  tugasToEdit = null,
}: TugasFormModalProps) {
  const [form, setForm] = useState<TugasFormData>(DEFAULT_FORM)
  const [errors, setErrors] = useState<FormErrorState>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Inisialisasi data form saat modal dibuka atau tugasToEdit berubah
  useEffect(() => {
    if (!isOpen) {
      setErrors({})
      return
    }

    if (tugasToEdit) {
      const { tanggal, jam } = deadlineKeFormParts(tugasToEdit.deadline)
      setForm({
        judul: tugasToEdit.judul,
        matkul: tugasToEdit.matkul,
        tipe: tugasToEdit.tipe,
        link_pengumpulan: tugasToEdit.link_pengumpulan || '',
        tanggal,
        jam: jam || '23:59',
      })
    } else {
      // Default untuk tambah tugas baru: tanggal hari ini atau besok, jam 23:59
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
  }, [isOpen, tugasToEdit])

  if (!isOpen) return null

  const isEdit = Boolean(tugasToEdit)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validationErrors = validasiFormTugas(form)
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
        matkul: form.matkul.trim(),
        tipe: form.tipe,
        link_pengumpulan: form.link_pengumpulan.trim() || null,
        deadline: deadlineIso,
      })
      onClose()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal menyimpan tugas.'
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
              {isEdit ? 'Edit Tugas Kuliah' : 'Tambah Tugas Baru'}
            </h2>
            <p className="text-xs text-[var(--text-sub)] mt-0.5">
              {isEdit
                ? 'Perbarui detail informasi tugas kuliah Anda'
                : 'Isi informasi tugas dan tenggat waktu pengumpulan'}
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

          {/* Judul Tugas */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-sub)] mb-1.5">
              Judul Tugas <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Misal: Tugas Praktikum Algoritma Bab 4"
              value={form.judul}
              onChange={(e) => {
                setForm({ ...form, judul: e.target.value })
                if (errors.judul) setErrors({ ...errors, judul: undefined })
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-[var(--bg-input)] text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-hidden focus:ring-2 focus:ring-cyan-500 transition-all ${
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

          {/* Mata Kuliah */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-sub)] mb-1.5">
              Mata Kuliah <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Misal: Algoritma & Struktur Data"
              value={form.matkul}
              onChange={(e) => {
                setForm({ ...form, matkul: e.target.value })
                if (errors.matkul) setErrors({ ...errors, matkul: undefined })
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-[var(--bg-input)] text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-hidden focus:ring-2 focus:ring-cyan-500 transition-all ${
                errors.matkul
                  ? 'border-red-500 focus:ring-red-400'
                  : 'border-[var(--border-main)]'
              }`}
            />
            {errors.matkul && (
              <p className="mt-1 text-xs text-red-500 font-medium">
                {errors.matkul}
              </p>
            )}
          </div>

          {/* Tipe Tugas (Individu / Kelompok) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-sub)] mb-1.5">
              Tipe Tugas
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setForm({ ...form, tipe: 'individu' })}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  form.tipe === 'individu'
                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 ring-1 ring-cyan-500'
                    : 'border-[var(--border-main)] text-[var(--text-sub)] hover:bg-[var(--bg-input)]'
                }`}
              >
                <span>👤</span>
                <span>Individu</span>
              </button>

              <button
                type="button"
                onClick={() => setForm({ ...form, tipe: 'kelompok' })}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  form.tipe === 'kelompok'
                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 ring-1 ring-cyan-500'
                    : 'border-[var(--border-main)] text-[var(--text-sub)] hover:bg-[var(--bg-input)]'
                }`}
              >
                <span>👥</span>
                <span>Kelompok</span>
              </button>
            </div>
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
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-[var(--bg-input)] text-[var(--text-main)] focus:outline-hidden focus:ring-2 focus:ring-cyan-500 transition-all ${
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-main)] text-sm bg-[var(--bg-input)] text-[var(--text-main)] focus:outline-hidden focus:ring-2 focus:ring-cyan-500 transition-all"
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

          {/* Link Pengumpulan (Opsional) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-sub)] mb-1.5">
              Link Pengumpulan <span className="text-[var(--text-muted)] font-normal lowercase">(opsional)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-[var(--text-muted)]">🔗</span>
              <input
                type="url"
                placeholder="https://classroom.google.com/..."
                value={form.link_pengumpulan}
                onChange={(e) => setForm({ ...form, link_pengumpulan: e.target.value })}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[var(--border-main)] text-sm bg-[var(--bg-input)] text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-hidden focus:ring-2 focus:ring-cyan-500 transition-all"
              />
            </div>
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
              {isEdit ? 'Simpan Perubahan' : 'Tambah Tugas'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
