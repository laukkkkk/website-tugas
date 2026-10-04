import { hariTersisa, labelSisaWaktu } from './deadline.js'

export interface ReminderTugasItem {
  id?: string
  judul: string
  matkul: string
  tipe: 'individu' | 'kelompok'
  link_pengumpulan?: string | null
  deadline: string | Date
  selesai?: boolean
}

export interface ReminderKerjaanItem {
  id?: string
  judul: string
  deskripsi?: string | null
  deadline: string | Date
  selesai?: boolean
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
 * Mengambil bagian tanggal dan waktu dalam zona waktu Asia/Jakarta (WIB).
 */
export function getWibParts(dateInput: Date | string) {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  if (isNaN(date.getTime())) {
    throw new Error(`Tanggal tidak valid: ${dateInput}`)
  }

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  })

  const parts = formatter.formatToParts(date)
  const map: Record<string, string> = {}
  for (const p of parts) {
    map[p.type] = p.value
  }

  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  }

  const rawHour = parseInt(map.hour, 10)
  return {
    year: parseInt(map.year, 10),
    month: parseInt(map.month, 10),
    day: parseInt(map.day, 10),
    dayOfWeek: weekdayMap[map.weekday] ?? 0,
    hour: rawHour === 24 ? 0 : rawHour,
    minute: parseInt(map.minute, 10),
  }
}

/**
 * Menghasilkan emoji indikator warna deadline berdasarkan selisih hari.
 * Aturan AGENTS.md:
 * - < 2 hari: merah 🔴
 * - < 4 hari: kuning 🟡
 * - < 7 hari: hijau 🟢
 * - selebihnya: netral ⚪
 */
export function getIndicatorEmoji(selisihHari: number): string {
  if (selisihHari < 2) return '🔴'
  if (selisihHari < 4) return '🟡'
  if (selisihHari < 7) return '🟢'
  return '⚪'
}

/**
 * Format tanggal WIB yang ramah dibaca manusia.
 * Contoh: "Senin, 5 Oktober 2026 pukul 23:59 WIB"
 */
export function formatTanggalWib(dateInput: Date | string): string {
  const w = getWibParts(dateInput)
  const namaHari = NAMA_HARI[w.dayOfWeek]
  const namaBulan = NAMA_BULAN[w.month]
  const pad = (n: number) => String(n).padStart(2, '0')

  return `${namaHari}, ${w.day} ${namaBulan} ${w.year} pukul ${pad(w.hour)}:${pad(w.minute)} WIB`
}

/**
 * Format tanggal hari ini dalam WIB untuk baris judul reminder.
 * Contoh: "Minggu, 4 Oktober 2026"
 */
export function formatHeaderTanggalWib(dateInput: Date | string): string {
  const w = getWibParts(dateInput)
  const namaHari = NAMA_HARI[w.dayOfWeek]
  const namaBulan = NAMA_BULAN[w.month]

  return `${namaHari}, ${w.day} ${namaBulan} ${w.year}`
}

/**
 * Fungsi murni penyusun teks pesan pengingat harian.
 * Menyusun satu pesan berisi bagian tugas dan kerjaan yang belum selesai.
 * Jika keduanya kosong, mengembalikan null.
 * 
 * @param tugasList Daftar tugas yang belum selesai (diurutkan per deadline)
 * @param kerjaanList Daftar kerjaan yang belum selesai (diurutkan per deadline)
 * @param sekarang Waktu acuan saat ini (default: waktu sekarang)
 * @returns Teks pesan markdown atau null jika tidak ada item aktif
 */
export function susunPesanReminder(
  tugasList: ReminderTugasItem[],
  kerjaanList: ReminderKerjaanItem[],
  sekarang: Date = new Date()
): string | null {
  // Hanya ambil yang belum selesai (jika ada flag selesai)
  const tugasAktif = tugasList.filter((t) => t.selesai !== true)
  const kerjaanAktif = kerjaanList.filter((k) => k.selesai !== true)

  // Jika tugas dan kerjaan sama-sama kosong, jangan kirim pesan apa pun
  if (tugasAktif.length === 0 && kerjaanAktif.length === 0) {
    return null
  }

  const tanggalHeader = formatHeaderTanggalWib(sekarang)
  const sections: string[] = [`🔔 *Pengingat — ${tanggalHeader}*`]

  // Bagian TUGAS (jumlah)
  if (tugasAktif.length > 0) {
    const lines: string[] = [`📋 *TUGAS (${tugasAktif.length})*`]

    tugasAktif.forEach((t, i) => {
      const sisaHari = hariTersisa(t.deadline, sekarang)
      const labelSisa = labelSisaWaktu(sisaHari)
      const emoji = getIndicatorEmoji(sisaHari)
      const tglWib = formatTanggalWib(t.deadline)
      const tipeLabel = t.tipe === 'kelompok' ? '👥 Kelompok' : '👤 Individu'

      let itemText =
        `${i + 1}. *${t.judul}* (${t.matkul}) [${tipeLabel}]\n` +
        `   ${emoji} Deadline: ${tglWib} (${labelSisa})`

      if (t.link_pengumpulan) {
        itemText += `\n   🔗 Link: ${t.link_pengumpulan}`
      }

      lines.push(itemText)
    })

    sections.push(lines.join('\n\n'))
  }

  // Bagian KERJAAN (jumlah)
  if (kerjaanAktif.length > 0) {
    const lines: string[] = [`💼 *KERJAAN (${kerjaanAktif.length})*`]

    kerjaanAktif.forEach((k, i) => {
      const sisaHari = hariTersisa(k.deadline, sekarang)
      const labelSisa = labelSisaWaktu(sisaHari)
      const emoji = getIndicatorEmoji(sisaHari)
      const tglWib = formatTanggalWib(k.deadline)

      let itemText =
        `${i + 1}. *${k.judul}*\n` +
        `   ${emoji} Deadline: ${tglWib} (${labelSisa})`

      if (k.deskripsi) {
        itemText += `\n   📝 ${k.deskripsi}`
      }

      lines.push(itemText)
    })

    sections.push(lines.join('\n\n'))
  }

  return sections.join('\n\n───────────────\n\n')
}
