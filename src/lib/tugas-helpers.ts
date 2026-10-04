import type { Tugas, TipeTugas } from '../types/index.js'
import { getWibParts } from '../../shared/pesan-reminder.js'

export type FilterStatusTugas = 'semua' | 'belum_selesai' | 'selesai'

export interface TugasFormData {
  judul: string
  matkul: string
  tipe: TipeTugas
  link_pengumpulan: string
  tanggal: string // YYYY-MM-DD
  jam: string // HH:mm
}

export interface FormErrorState {
  judul?: string
  matkul?: string
  deadline?: string
  global?: string
}

/**
 * Mengubah ISO deadline string menjadi tanggal (YYYY-MM-DD) dan jam (HH:mm) WIB.
 */
export function deadlineKeFormParts(deadlineIso: string): { tanggal: string; jam: string } {
  const pad = (n: number) => String(n).padStart(2, '0')
  const p = getWibParts(deadlineIso)
  return {
    tanggal: `${p.year}-${pad(p.month)}-${pad(p.day)}`,
    jam: `${pad(p.hour)}:${pad(p.minute)}`,
  }
}

/**
 * Menggabungkan tanggal dan jam menjadi format ISO WIB (+07:00).
 * Jika jam tidak diisi, gunakan jam default 23:59.
 */
export function gabungDeadlineToIso(tanggal: string, jam?: string): string {
  const cleanTanggal = tanggal.trim()
  if (!cleanTanggal) {
    throw new Error('Tanggal deadline wajib diisi.')
  }

  const cleanJam = jam && jam.trim() ? jam.trim() : '23:59'
  // Format WIB +07:00
  const isoStr = `${cleanTanggal}T${cleanJam}:00+07:00`
  const date = new Date(isoStr)
  if (isNaN(date.getTime())) {
    throw new Error('Format tanggal atau jam deadline tidak valid.')
  }
  return date.toISOString()
}

/**
 * Mengurutkan tugas:
 * 1. Tugas belum selesai di atas, tugas selesai di bawah
 * 2. Diurutkan per deadline terdekat (ascending)
 */
export function urutkanTugas(list: Tugas[]): Tugas[] {
  return [...list].sort((a, b) => {
    if (a.selesai !== b.selesai) {
      return a.selesai ? 1 : -1
    }
    const timeA = new Date(a.deadline).getTime()
    const timeB = new Date(b.deadline).getTime()
    return timeA - timeB
  })
}

/**
 * Memfilter dan mengurutkan daftar tugas berdasarkan status dan kata kunci pencarian.
 */
export function saringTugas(
  list: Tugas[],
  filter: FilterStatusTugas,
  search = ''
): Tugas[] {
  let hasil = list

  if (filter === 'belum_selesai') {
    hasil = hasil.filter((t) => !t.selesai)
  } else if (filter === 'selesai') {
    hasil = hasil.filter((t) => t.selesai)
  }

  const q = search.trim().toLowerCase()
  if (q) {
    hasil = hasil.filter(
      (t) =>
        t.judul.toLowerCase().includes(q) ||
        t.matkul.toLowerCase().includes(q)
    )
  }

  return urutkanTugas(hasil)
}

/**
 * Validasi form tugas sebelum dikirim ke API.
 */
export function validasiFormTugas(data: TugasFormData): FormErrorState {
  const errors: FormErrorState = {}

  if (!data.judul.trim()) {
    errors.judul = 'Judul tugas wajib diisi.'
  }

  if (!data.matkul.trim()) {
    errors.matkul = 'Mata kuliah wajib diisi.'
  }

  if (!data.tanggal.trim()) {
    errors.deadline = 'Tanggal deadline wajib diisi.'
  } else {
    try {
      gabungDeadlineToIso(data.tanggal, data.jam)
    } catch (err) {
      errors.deadline = err instanceof Error ? err.message : 'Deadline tidak valid.'
    }
  }

  return errors
}
