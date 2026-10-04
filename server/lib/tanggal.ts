/**
 * Modul parser dan penanggalan zona waktu Asia/Jakarta (WIB / UTC+7).
 */

export class DeadlineParseError extends Error {
  constructor(message: string = 'Format deadline tidak dapat dipahami.') {
    super(message)
    this.name = 'DeadlineParseError'
  }
}

const BULAN_MAP: Record<string, number> = {
  jan: 1,
  januari: 1,
  feb: 2,
  februari: 2,
  mar: 3,
  maret: 3,
  apr: 4,
  april: 4,
  mei: 5,
  jun: 6,
  juni: 6,
  jul: 7,
  juli: 7,
  agu: 8,
  agt: 8,
  agust: 8,
  agustus: 8,
  sep: 9,
  sept: 9,
  september: 9,
  okt: 10,
  oktober: 10,
  nov: 11,
  november: 11,
  des: 12,
  desember: 12,
}

const HARI_MAP: Record<string, number> = {
  minggu: 0,
  ahad: 0,
  senin: 1,
  selasa: 2,
  rabu: 3,
  kamis: 4,
  jumat: 5,
  "jum'at": 5,
  sabtu: 6,
}

const NAMA_HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const NAMA_BULAN = [
  '',
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
]

/**
 * Mengambil komponen tanggal dan waktu dalam zona waktu Asia/Jakarta (WIB).
 */
export function getWibDetails(date: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    weekday: 'long',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  }).formatToParts(date)

  const map: Record<string, string> = {}
  for (const p of parts) {
    map[p.type] = p.value
  }

  const weekdayMap: Record<string, number> = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  }

  const rawHour = parseInt(map.hour, 10)
  return {
    year: parseInt(map.year, 10),
    month: parseInt(map.month, 10),
    day: parseInt(map.day, 10),
    dayOfWeek: weekdayMap[map.weekday] ?? 0,
    hour: rawHour === 24 ? 0 : rawHour,
    minute: parseInt(map.minute, 10),
    second: parseInt(map.second, 10),
  }
}

/**
 * Memeriksa apakah kombinasi tanggal (year, month, day) valid di kalender.
 */
export function isValidCalendarDay(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1 || day > 31) return false
  const maxDay = new Date(Date.UTC(year, month, 0)).getUTCDate()
  return day <= maxDay
}

/**
 * Membuat Date object dari tahun, bulan, hari, jam, dan menit dalam zona Asia/Jakarta (WIB, +07:00).
 */
export function createWibDate(
  year: number,
  month: number,
  day: number,
  hour: number = 23,
  minute: number = 59
): Date {
  if (!isValidCalendarDay(year, month, day)) {
    throw new DeadlineParseError(`Tanggal ${day}/${month}/${year} tidak valid di kalender.`)
  }
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    throw new DeadlineParseError(`Waktu ${hour}:${minute} tidak valid.`)
  }

  const pad = (n: number) => String(n).padStart(2, '0')
  const isoStr = `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00+07:00`
  const dateObj = new Date(isoStr)
  if (isNaN(dateObj.getTime())) {
    throw new DeadlineParseError(`Gagal membuat tanggal valid untuk ${isoStr}.`)
  }
  return dateObj
}

/**
 * Menambahkan sejumlah hari kalender dari tanggal dasar kalender.
 */
function addDaysCalendar(
  baseYear: number,
  baseMonth: number,
  baseDay: number,
  daysToAdd: number
): { year: number; month: number; day: number } {
  const utc = new Date(Date.UTC(baseYear, baseMonth - 1, baseDay + daysToAdd))
  return {
    year: utc.getUTCFullYear(),
    month: utc.getUTCMonth() + 1,
    day: utc.getUTCDate(),
  }
}

/**
 * Parser deadline berzona WIB yang fleksibel.
 * Menerima:
 * - 'hari ini', 'besok', 'lusa'
 * - Nama hari: 'senin', 'selasa', dst. (hari itu berikutnya)
 * - Format tanggal: '5 okt', '5 oktober', '5/10', '05/10', '5-10'
 * - Jam opsional: '5 okt 14.00', 'besok 20:00', '14.00'
 * - Standar ISO/YYYY-MM-DD: '2026-10-05', '2026-10-05 14:00'
 * 
 * Aturan:
 * - Tanpa jam berarti 23:59 WIB.
 * - Jika tahun tidak ditulis pakai tahun berjalan.
 * - Jika tanggal sudah lewat tahun ini, otomatis pakai tahun depan.
 * 
 * @param input Teks deadline yang dimasukkan pengguna
 * @param now Waktu acuan saat ini (default: waktu sekarang)
 * @returns Date dalam UTC (dengan representasi WIB)
 */
export function parseDeadlineWib(input: string, now: Date = new Date()): Date {
  if (!input || typeof input !== 'string') {
    throw new DeadlineParseError('Input deadline tidak boleh kosong.')
  }

  let text = input.trim().toLowerCase().replace(/\s+/g, ' ')
  if (!text) {
    throw new DeadlineParseError('Input deadline tidak boleh kosong.')
  }

  const nowWib = getWibDetails(now)

  // 1. Ekstrak jam opsional
  let hour = 23
  let minute = 59
  let hasCustomTime = false

  // Pola jam: "pukul 14.00", "jam 14:00", "14.00", "14:00", atau "jam 14"
  const timeRegexColonOrDot = /(?:(?:pukul|jam)\s+)?\b([01]?\d|2[0-3])[:.]([0-5]\d)\b/i
  const timeWordOnly = /\b(?:pukul|jam)\s+([01]?\d|2[0-3])\b/i

  const matchTime = text.match(timeRegexColonOrDot)
  if (matchTime) {
    hour = parseInt(matchTime[1], 10)
    minute = parseInt(matchTime[2], 10)
    hasCustomTime = true
    text = text.replace(matchTime[0], '').trim().replace(/\s+/g, ' ')
  } else {
    const matchTimeWord = text.match(timeWordOnly)
    if (matchTimeWord) {
      hour = parseInt(matchTimeWord[1], 10)
      minute = 0
      hasCustomTime = true
      text = text.replace(matchTimeWord[0], '').trim().replace(/\s+/g, ' ')
    }
  }

  // Jika input aslinya HANYA jam (misal "14.00" atau "jam 14"), tanggal default adalah hari ini
  if (hasCustomTime && !text) {
    let target = createWibDate(nowWib.year, nowWib.month, nowWib.day, hour, minute)
    // Jika jam hari ini sudah lewat, maka target adalah besok pada jam yang sama
    if (target.getTime() <= now.getTime()) {
      const nextDay = addDaysCalendar(nowWib.year, nowWib.month, nowWib.day, 1)
      target = createWibDate(nextDay.year, nextDay.month, nextDay.day, hour, minute)
    }
    return target
  }

  // 2. Format YYYY-MM-DD standar (misal 2026-10-05)
  const isoPattern = /^(\d{4})-(\d{2})-(\d{2})$/
  const isoMatch = text.match(isoPattern)
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10)
    const m = parseInt(isoMatch[2], 10)
    const d = parseInt(isoMatch[3], 10)
    return createWibDate(y, m, d, hour, minute)
  }

  // 3. Relatif: 'hari ini', 'besok', 'lusa'
  if (text === 'hari ini') {
    return createWibDate(nowWib.year, nowWib.month, nowWib.day, hour, minute)
  }
  if (text === 'besok') {
    const d = addDaysCalendar(nowWib.year, nowWib.month, nowWib.day, 1)
    return createWibDate(d.year, d.month, d.day, hour, minute)
  }
  if (text === 'lusa') {
    const d = addDaysCalendar(nowWib.year, nowWib.month, nowWib.day, 2)
    return createWibDate(d.year, d.month, d.day, hour, minute)
  }

  // 4. Nama hari: 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'
  if (text in HARI_MAP) {
    const targetDay = HARI_MAP[text]
    // Hari itu berikutnya: jika targetDay sama dengan hari ini, jadikan 7 hari ke depan (+7)
    let diff = (targetDay - nowWib.dayOfWeek + 7) % 7
    if (diff === 0) {
      diff = 7
    }
    const d = addDaysCalendar(nowWib.year, nowWib.month, nowWib.day, diff)
    return createWibDate(d.year, d.month, d.day, hour, minute)
  }

  // 5. Format numerik: '5/10', '05/10', '5-10', '05-10', opsional dengan tahun '5/10/2026'
  const numericSlashPattern = /^(\d{1,2})[/-](\d{1,2})(?:[/-](\d{4}))?$/
  const numMatch = text.match(numericSlashPattern)
  if (numMatch) {
    const day = parseInt(numMatch[1], 10)
    const month = parseInt(numMatch[2], 10)
    const explicitYear = numMatch[3] ? parseInt(numMatch[3], 10) : undefined

    let year = explicitYear ?? nowWib.year
    if (!explicitYear) {
      let candidate = createWibDate(year, month, day, hour, minute)
      // Jika sudah lewat tahun ini, gunakan tahun depan
      if (candidate.getTime() <= now.getTime()) {
        year += 1
      }
    }
    return createWibDate(year, month, day, hour, minute)
  }

  // 6. Format teks nama bulan: '5 okt', '5 oktober', '05 november 2026'
  const textMonthPattern = /^(\d{1,2})\s+([a-z']+)(?:\s+(\d{4}))?$/
  const textMatch = text.match(textMonthPattern)
  if (textMatch) {
    const day = parseInt(textMatch[1], 10)
    const monthName = textMatch[2]
    const explicitYear = textMatch[3] ? parseInt(textMatch[3], 10) : undefined

    if (!(monthName in BULAN_MAP)) {
      throw new DeadlineParseError(`Nama bulan "${monthName}" tidak dikenali.`)
    }

    const month = BULAN_MAP[monthName]
    let year = explicitYear ?? nowWib.year

    if (!explicitYear) {
      let candidate = createWibDate(year, month, day, hour, minute)
      // Jika sudah lewat tahun ini, gunakan tahun depan
      if (candidate.getTime() <= now.getTime()) {
        year += 1
      }
    }
    return createWibDate(year, month, day, hour, minute)
  }

  // Jika tidak cocok dengan format mana pun:
  throw new DeadlineParseError(
    `Format deadline "${input}" tidak dikenali. Contoh yang didukung: 'hari ini', 'besok', 'lusa', 'senin', '5 okt', '5 oktober', '5/10', atau tambahkan jam seperti '5 okt 14.00' (default 23:59 WIB).`
  )
}

/**
 * Format tanggal WIB yang rapi dan mudah dibaca manusia.
 * Contoh: "Senin, 5 Oktober 2026 pukul 14:00 WIB"
 */
export function formatDeadlineHumanWib(dateInput: Date | string): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  const w = getWibDetails(date)
  const namaHari = NAMA_HARI[w.dayOfWeek]
  const namaBulan = NAMA_BULAN[w.month]
  const pad = (n: number) => String(n).padStart(2, '0')

  return `${namaHari}, ${w.day} ${namaBulan} ${w.year} pukul ${pad(w.hour)}:${pad(w.minute)} WIB`
}
