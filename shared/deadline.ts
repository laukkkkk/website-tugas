export type KelasWarna = 'merah' | 'kuning' | 'hijau' | 'netral'

/**
 * Mengambil bagian tanggal (year, month, day) dalam zona waktu Asia/Jakarta (WIB).
 */
export function getWibCalendarParts(dateInput: Date | string): {
  year: number
  month: number
  day: number
} {
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput.trim())) {
    const [year, month, day] = dateInput.trim().split('-').map(Number)
    return { year, month, day }
  }

  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${dateInput}`)
  }

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  const formatted = formatter.format(date)
  const [year, month, day] = formatted.split('-').map(Number)
  return { year, month, day }
}

/**
 * Menghitung selisih hari kalender dalam WIB (Asia/Jakarta).
 * Nilai positif jika deadline di masa depan, 0 jika hari ini, negatif jika terlambat.
 */
export function hariTersisa(
  deadline: Date | string,
  sekarang: Date | string = new Date()
): number {
  const dParts = getWibCalendarParts(deadline)
  const sParts = getWibCalendarParts(sekarang)

  const utcDeadline = Date.UTC(dParts.year, dParts.month - 1, dParts.day)
  const utcSekarang = Date.UTC(sParts.year, sParts.month - 1, sParts.day)

  const diffMs = utcDeadline - utcSekarang
  return Math.round(diffMs / (1000 * 60 * 60 * 24))
}

/**
 * Menghasilkan label sisa waktu:
 * - n < 0: 'Terlambat n hari'
 * - n = 0: 'Hari ini'
 * - n = 1: 'Besok'
 * - n > 1: 'n hari lagi'
 */
export function labelSisaWaktu(n: number): string {
  if (n < 0) {
    return `Terlambat ${Math.abs(n)} hari`
  }
  if (n === 0) {
    return 'Hari ini'
  }
  if (n === 1) {
    return 'Besok'
  }
  return `${n} hari lagi`
}

/**
 * Menentukan warna deadline sesuai aturan AGENTS.md:
 * - kurang dari 2 hari (termasuk sudah lewat): merah
 * - kurang dari 4 hari: kuning
 * - kurang dari 7 hari: hijau
 * - selebihnya: netral
 */
export function kelasWarna(n: number): KelasWarna {
  if (n < 2) {
    return 'merah'
  }
  if (n < 4) {
    return 'kuning'
  }
  if (n < 7) {
    return 'hijau'
  }
  return 'netral'
}

/**
 * Parse deadline string. Jika hanya berisi tanggal (YYYY-MM-DD),
 * jam default diset ke 23:59:00 WIB (+07:00).
 */
export function parseDeadlineInput(input: string): Date {
  const trimmed = input.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return new Date(`${trimmed}T23:59:00+07:00`)
  }
  return new Date(trimmed)
}
