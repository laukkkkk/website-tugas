import type { Tugas, Kerjaan } from '../types/index.js'
import {
  hariTersisa,
  labelSisaWaktu,
  kelasWarna,
  type KelasWarna,
} from '../../shared/deadline.js'
import { formatTanggalWib } from '../../shared/pesan-reminder.js'

export interface ItemDeadline {
  tipe: 'tugas' | 'kerjaan'
  judul: string
  deadline: string
  matkul?: string
}

export interface DeadlineTerdekatResult {
  terdekat: ItemDeadline | null
  label: string
  warna: KelasWarna
  subtext: string
}

/**
 * Mencari deadline terdekat dari seluruh tugas dan kerjaan yang belum selesai,
 * serta menghasilkan label, kelas warna, dan subteks informatif.
 */
export function hitungDeadlineTerdekat(
  tugasList: Tugas[],
  kerjaanList: Kerjaan[],
  sekarang: Date = new Date()
): DeadlineTerdekatResult {
  const items: ItemDeadline[] = [
    ...tugasList
      .filter((t) => t.selesai !== true)
      .map((t) => ({
        tipe: 'tugas' as const,
        judul: t.judul,
        deadline: t.deadline,
        matkul: t.matkul,
      })),
    ...kerjaanList
      .filter((k) => k.selesai !== true)
      .map((k) => ({
        tipe: 'kerjaan' as const,
        judul: k.judul,
        deadline: k.deadline,
      })),
  ]

  if (items.length === 0) {
    return {
      terdekat: null,
      label: '-',
      warna: 'netral',
      subtext: 'Tidak ada tugas atau kerjaan aktif',
    }
  }

  // Urutkan deadline dari yang paling awal
  items.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
  const terdekat = items[0]

  const sisa = hariTersisa(terdekat.deadline, sekarang)
  const warna = kelasWarna(sisa)
  const label = labelSisaWaktu(sisa)
  const prefix = terdekat.tipe === 'tugas' ? 'Tugas' : 'Kerjaan'
  const tgl = formatTanggalWib(terdekat.deadline)

  return {
    terdekat,
    label,
    warna,
    subtext: `${prefix}: ${terdekat.judul} • ${tgl}`,
  }
}

/**
 * Mengambil maksimal n tugas belum selesai untuk widget Tugas Terdekat.
 */
export function ambilTugasTerdekat(tugasList: Tugas[], max = 3): Tugas[] {
  return tugasList
    .filter((t) => t.selesai !== true)
    .slice(0, max)
}
