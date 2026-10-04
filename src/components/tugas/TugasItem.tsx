import React, { useState } from 'react'
import type { Tugas } from '../../types/index.js'
import { hariTersisa, labelSisaWaktu, kelasWarna } from '../../../shared/deadline.js'
import { formatTanggalWib } from '../../../shared/pesan-reminder.js'
import { COLOR_SCHEMES } from '../../lib/colors.js'

interface TugasItemProps {
  tugas: Tugas
  onToggleSelesai: (tugas: Tugas) => Promise<void>
  onEdit: (tugas: Tugas) => void
  onHapus: (tugas: Tugas) => void
}

export function TugasItem({
  tugas,
  onToggleSelesai,
  onEdit,
  onHapus,
}: TugasItemProps) {
  const [isToggling, setIsToggling] = useState(false)

  const sisa = hariTersisa(tugas.deadline)
  const warna = kelasWarna(sisa)
  const label = labelSisaWaktu(sisa)
  const scheme = COLOR_SCHEMES[warna]
  const tglWib = formatTanggalWib(tugas.deadline)

  const handleCheckboxChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation()
    setIsToggling(true)
    try {
      await onToggleSelesai(tugas)
    } finally {
      setIsToggling(false)
    }
  }

  return (
    <div
      className={`group relative p-4 sm:p-5 rounded-2xl border transition-all duration-200 ${
        tugas.selesai
          ? 'bg-[var(--bg-page)]/80 border-[var(--border-main)]/60 opacity-80'
          : 'bg-[var(--bg-card)] border-[var(--border-main)] hover:border-cyan-500/50 shadow-xs'
      }`}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        {/* Checkbox Ceklis */}
        <div className="pt-0.5 shrink-0">
          <label className="relative flex items-center justify-center cursor-pointer">
            <input
              type="checkbox"
              checked={tugas.selesai}
              disabled={isToggling}
              onChange={handleCheckboxChange}
              className="sr-only peer"
              aria-label={`Tandai ${tugas.judul} sebagai ${tugas.selesai ? 'belum selesai' : 'selesai'}`}
            />
            <div
              className={`w-5 h-5 sm:w-6 sm:h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                tugas.selesai
                  ? 'bg-cyan-600 border-cyan-600 text-white'
                  : 'border-[var(--border-main)] hover:border-cyan-500 bg-[var(--bg-input)]'
              } ${isToggling ? 'opacity-50 animate-pulse' : ''}`}
            >
              {tugas.selesai && (
                <svg
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </label>
        </div>

        {/* Konten Utama Baris Tugas */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 flex-1 pr-2">
              {/* Judul & Mata Kuliah */}
              <div className="flex items-center gap-2 flex-wrap">
                <h3
                  className={`text-sm sm:text-base font-bold break-words transition-all ${
                    tugas.selesai
                      ? 'line-through text-[var(--text-muted)]'
                      : 'text-[var(--text-main)]'
                  }`}
                >
                  {tugas.judul}
                </h3>

                {/* Ikon Link Pengumpulan */}
                {tugas.link_pengumpulan && (
                  <a
                    href={tugas.link_pengumpulan}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Buka link pengumpulan tugas"
                    className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/20 transition-colors shrink-0"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                )}
              </div>

              {/* Mata Kuliah */}
              <p className="text-xs font-medium text-[var(--text-sub)] mt-0.5">
                {tugas.matkul}
              </p>
            </div>

            {/* Tombol Aksi (Edit & Hapus) */}
            <div className="shrink-0 flex items-center gap-1 sm:opacity-90 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => onEdit(tugas)}
                title="Edit tugas"
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-cyan-600 hover:bg-cyan-500/10 dark:hover:text-cyan-400 transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>

              <button
                type="button"
                onClick={() => onHapus(tugas)}
                title="Hapus tugas"
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-600 hover:bg-red-500/10 dark:hover:text-red-400 transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Badges Baris Bawah: Tipe & Deadline */}
          <div className="mt-3 pt-3 border-t border-[var(--border-main)] flex flex-wrap items-center justify-between gap-2 text-xs">
            {/* Badge Tipe Tugas */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[var(--bg-input)] text-[var(--text-sub)] border border-[var(--border-main)] font-medium text-[11px]">
                {tugas.tipe === 'kelompok' ? '👥 Kelompok' : '👤 Individu'}
              </span>

              {/* Tanggal Deadline WIB */}
              <span className="text-[var(--text-sub)] flex items-center gap-1.5 text-xs">
                <svg className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {tglWib}
              </span>
            </div>

            {/* Badge Deadline Berwarna dengan Label Sisa Waktu */}
            <div>
              <span
                className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                  tugas.selesai
                    ? 'bg-[var(--bg-input)] text-[var(--text-muted)] border-[var(--border-main)]'
                    : scheme.badge
                }`}
              >
                {tugas.selesai ? 'Selesai' : label}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
