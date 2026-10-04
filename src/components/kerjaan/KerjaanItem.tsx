import React, { useState } from 'react'
import type { Kerjaan } from '../../types/index.js'
import { hariTersisa, labelSisaWaktu, kelasWarna } from '../../../shared/deadline.js'
import { formatTanggalWib } from '../../../shared/pesan-reminder.js'
import { COLOR_SCHEMES } from '../../lib/colors.js'

interface KerjaanItemProps {
  kerjaan: Kerjaan
  onToggleSelesai: (kerjaan: Kerjaan) => Promise<void>
  onEdit: (kerjaan: Kerjaan) => void
  onHapus: (kerjaan: Kerjaan) => void
}

export function KerjaanItem({
  kerjaan,
  onToggleSelesai,
  onEdit,
  onHapus,
}: KerjaanItemProps) {
  const [isToggling, setIsToggling] = useState(false)

  const sisa = hariTersisa(kerjaan.deadline)
  const warna = kelasWarna(sisa)
  const label = labelSisaWaktu(sisa)
  const scheme = COLOR_SCHEMES[warna]
  const tglWib = formatTanggalWib(kerjaan.deadline)

  const handleCheckboxChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation()
    setIsToggling(true)
    try {
      await onToggleSelesai(kerjaan)
    } finally {
      setIsToggling(false)
    }
  }

  return (
    <div
      className={`group relative p-4 sm:p-5 rounded-2xl border transition-all duration-200 ${
        kerjaan.selesai
          ? 'bg-slate-50/60 dark:bg-slate-900/30 border-slate-200/60 dark:border-slate-800/60 opacity-80'
          : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-800/80 shadow-xs'
      }`}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        {/* Checkbox Ceklis */}
        <div className="pt-0.5 shrink-0">
          <label className="relative flex items-center justify-center cursor-pointer">
            <input
              type="checkbox"
              checked={kerjaan.selesai}
              disabled={isToggling}
              onChange={handleCheckboxChange}
              className="sr-only peer"
              aria-label={`Tandai ${kerjaan.judul} sebagai ${kerjaan.selesai ? 'belum selesai' : 'selesai'}`}
            />
            <div
              className={`w-5 h-5 sm:w-6 sm:h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                kerjaan.selesai
                  ? 'bg-amber-500 border-amber-500 text-white'
                  : 'border-slate-300 dark:border-slate-600 hover:border-amber-500 bg-white dark:bg-slate-800'
              } ${isToggling ? 'opacity-50 animate-pulse' : ''}`}
            >
              {kerjaan.selesai && (
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

        {/* Konten Utama Baris Kerjaan */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 flex-1 pr-2">
              {/* Judul Kerjaan */}
              <h3
                className={`text-sm sm:text-base font-bold break-words transition-all ${
                  kerjaan.selesai
                    ? 'line-through text-slate-400 dark:text-slate-500'
                    : 'text-slate-900 dark:text-white'
                }`}
              >
                {kerjaan.judul}
              </h3>

              {/* Deskripsi (jika ada) */}
              {kerjaan.deskripsi && (
                <p className="text-xs font-normal text-slate-600 dark:text-slate-400 mt-1 whitespace-pre-wrap break-words leading-relaxed">
                  {kerjaan.deskripsi}
                </p>
              )}
            </div>

            {/* Tombol Aksi (Edit & Hapus) */}
            <div className="shrink-0 flex items-center gap-1 sm:opacity-90 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => onEdit(kerjaan)}
                title="Edit kerjaan"
                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 dark:hover:text-amber-400 transition-colors cursor-pointer"
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
                onClick={() => onHapus(kerjaan)}
                title="Hapus kerjaan"
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition-colors cursor-pointer"
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

          {/* Badges Baris Bawah: Tanggal & Deadline */}
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
            {/* Tanggal Deadline WIB */}
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 text-xs">
              <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {tglWib}
            </span>

            {/* Badge Deadline Berwarna dengan Label Sisa Waktu */}
            <div>
              <span
                className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                  kerjaan.selesai
                    ? 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                    : scheme.badge
                }`}
              >
                {kerjaan.selesai ? 'Selesai' : label}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
