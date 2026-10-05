import type { Todo } from '../types/index.js'
import { getWibParts } from '../../shared/pesan-reminder.js'

const NAMA_BULAN_SINGKAT = [
  '',
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
]

/**
 * Format tanggal dan waktu dalam WIB untuk riwayat edit catatan.
 * Contoh: "4 Okt 2026, 15:30 WIB"
 */
export function formatWaktuWib(isoStr: string): string {
  try {
    const pad = (n: number) => String(n).padStart(2, '0')
    const p = getWibParts(isoStr)
    const bulan = NAMA_BULAN_SINGKAT[p.month] || ''
    return `${p.day} ${bulan} ${p.year}, ${pad(p.hour)}:${pad(p.minute)} WIB`
  } catch {
    return isoStr
  }
}

/**
 * Mengurutkan to-do:
 * 1. Yang belum selesai di atas (selesai: false)
 * 2. Yang sudah selesai di bawah (selesai: true)
 * 3. Diurutkan berdasarkan created_at descending (yang baru dibuat di atas)
 */
export function urutkanTodos(list: Todo[]): Todo[] {
  return [...list].sort((a, b) => {
    if (a.selesai !== b.selesai) {
      return a.selesai ? 1 : -1
    }
    const timeA = new Date(a.created_at).getTime()
    const timeB = new Date(b.created_at).getTime()
    return timeB - timeA
  })
}

/**
 * Validasi form catatan (hanya kolom isi).
 */
export function validasiFormNote(isi: string): { isi?: string } {
  const errors: { isi?: string } = {}
  if (!isi || !isi.trim()) {
    errors.isi = 'Isi catatan wajib diisi.'
  }
  return errors
}
