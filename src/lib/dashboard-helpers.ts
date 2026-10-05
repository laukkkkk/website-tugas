import type { Tugas, Kerjaan, Note, Todo } from '../types/index.js'
import {
  hariTersisa,
  labelSisaWaktu,
  kelasWarna,
  type KelasWarna,
} from '../../shared/deadline.js'
import { formatTanggalWib } from '../../shared/pesan-reminder.js'
import {
  BATAS_TUGAS,
  BATAS_KERJAAN,
  BATAS_CATATAN,
  BATAS_TODO,
} from '../config/dashboard.js'

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

export interface HasilPotong<T> {
  items: T[]
  totalAktif: number
  sisa: number
  keteranganSisa: string | null
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
 * Memotong dan mengurutkan tugas aktif (belum selesai) dari deadline terdekat.
 */
export function potongTugasAktif(
  tugasList: Tugas[],
  batas: number = BATAS_TUGAS
): HasilPotong<Tugas> {
  const aktif = tugasList
    .filter((t) => t.selesai !== true)
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())

  const items = aktif.slice(0, batas)
  const sisa = Math.max(0, aktif.length - items.length)

  return {
    items,
    totalAktif: aktif.length,
    sisa,
    keteranganSisa: sisa > 0 ? `+ ${sisa} tugas lainnya` : null,
  }
}

/**
 * Memotong dan mengurutkan kerjaan aktif (belum selesai) dari deadline terdekat.
 */
export function potongKerjaanAktif(
  kerjaanList: Kerjaan[],
  batas: number = BATAS_KERJAAN
): HasilPotong<Kerjaan> {
  const aktif = kerjaanList
    .filter((k) => k.selesai !== true)
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())

  const items = aktif.slice(0, batas)
  const sisa = Math.max(0, aktif.length - items.length)

  return {
    items,
    totalAktif: aktif.length,
    sisa,
    keteranganSisa: sisa > 0 ? `+ ${sisa} kerjaan lainnya` : null,
  }
}

/**
 * Memotong dan mengurutkan catatan terbaru berdasarkan waktu terakhir diedit (updated_at / created_at descending).
 */
export function potongCatatanTerbaru(
  notesList: Note[],
  batas: number = BATAS_CATATAN
): HasilPotong<Note> {
  const terurut = [...notesList].sort((a, b) => {
    const timeA = new Date(a.updated_at || a.created_at).getTime()
    const timeB = new Date(b.updated_at || b.created_at).getTime()
    return timeB - timeA
  })

  const items = terurut.slice(0, batas)
  const sisa = Math.max(0, terurut.length - items.length)

  return {
    items,
    totalAktif: terurut.length,
    sisa,
    keteranganSisa: sisa > 0 ? `+ ${sisa} catatan lainnya` : null,
  }
}

/**
 * Memotong dan mengurutkan to-do aktif (belum selesai).
 */
export function potongTodosAktif(
  todosList: Todo[],
  batas: number = BATAS_TODO
): HasilPotong<Todo> {
  const aktif = todosList
    .filter((t) => t.selesai !== true)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  const items = aktif.slice(0, batas)
  const sisa = Math.max(0, aktif.length - items.length)

  return {
    items,
    totalAktif: aktif.length,
    sisa,
    keteranganSisa: sisa > 0 ? `+ ${sisa} to-do lainnya` : null,
  }
}

/**
 * Mengambil maksimal n tugas belum selesai untuk widget Tugas Terdekat (kompatibilitas).
 */
export function ambilTugasTerdekat(tugasList: Tugas[], max = 3): Tugas[] {
  return potongTugasAktif(tugasList, max).items
}
