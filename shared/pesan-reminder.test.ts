import { describe, it, expect } from 'vitest'
import {
  susunPesanReminder,
  formatTanggalWib,
  formatHeaderTanggalWib,
  getIndicatorEmoji,
  type ReminderTugasItem,
  type ReminderKerjaanItem,
} from './pesan-reminder.js'

describe('susunPesanReminder (shared/pesan-reminder.ts)', () => {
  // Waktu acuan tetap: Minggu, 4 Oktober 2026 pukul 09:00:00 WIB
  const fixedNow = new Date('2026-10-04T09:00:00+07:00')

  const sampleTugas: ReminderTugasItem[] = [
    {
      judul: 'Makalah AI',
      matkul: 'Kecerdasan Buatan',
      tipe: 'kelompok',
      link_pengumpulan: 'https://classroom.google.com/c/123',
      deadline: '2026-10-05T23:59:00+07:00', // Besok (1 hari lagi)
      selesai: false,
    },
    {
      judul: 'Tugas Kalkulus',
      matkul: 'Kalkulus 2',
      tipe: 'individu',
      link_pengumpulan: null,
      deadline: '2026-10-07T23:59:00+07:00', // 3 hari lagi
      selesai: false,
    },
  ]

  const sampleKerjaan: ReminderKerjaanItem[] = [
    {
      judul: 'Revisi Desain',
      deskripsi: 'Perbaiki padding dan font ukuran',
      deadline: '2026-10-04T18:00:00+07:00', // Hari ini
      selesai: false,
    },
    {
      judul: 'Deploy Staging',
      deskripsi: null,
      deadline: '2026-10-10T12:00:00+07:00', // 6 hari lagi
      selesai: false,
    },
  ]

  it('mengembalikan null jika tugas dan kerjaan sama-sama kosong', () => {
    const result = susunPesanReminder([], [], fixedNow)
    expect(result).toBeNull()
  })

  it('mengembalikan null jika semua item bertanda selesai = true', () => {
    const tugasSelesai = sampleTugas.map((t) => ({ ...t, selesai: true }))
    const kerjaanSelesai = sampleKerjaan.map((k) => ({ ...k, selesai: true }))

    const result = susunPesanReminder(tugasSelesai, kerjaanSelesai, fixedNow)
    expect(result).toBeNull()
  })

  it('menyusun pesan dengan kedua bagian ketika tugas dan kerjaan ada', () => {
    const result = susunPesanReminder(sampleTugas, sampleKerjaan, fixedNow)

    expect(result).not.toBeNull()
    expect(result).toContain('Pengingat — Minggu, 4 Oktober 2026')

    // Bagian Tugas
    expect(result).toContain('TUGAS (2)')
    expect(result).toContain('1. *Makalah AI* (Kecerdasan Buatan) [👥 Kelompok]')
    expect(result).toContain('🔴 Deadline: Senin, 5 Oktober 2026 pukul 23:59 WIB (Besok)')
    expect(result).toContain('🔗 Link: https://classroom.google.com/c/123')
    expect(result).toContain('2. *Tugas Kalkulus* (Kalkulus 2) [👤 Individu]')
    expect(result).toContain('🟡 Deadline: Rabu, 7 Oktober 2026 pukul 23:59 WIB (3 hari lagi)')

    // Bagian Kerjaan
    expect(result).toContain('KERJAAN (2)')
    expect(result).toContain('1. *Revisi Desain*')
    expect(result).toContain('📝 Perbaiki padding dan font ukuran')
    expect(result).toContain('🔴 Deadline: Minggu, 4 Oktober 2026 pukul 18:00 WIB (Hari ini)')
    expect(result).toContain('2. *Deploy Staging*')
    expect(result).toContain('🟢 Deadline: Sabtu, 10 Oktober 2026 pukul 12:00 WIB (6 hari lagi)')
  })

  it('hanya menampilkan bagian Tugas jika Kerjaan kosong', () => {
    const result = susunPesanReminder(sampleTugas, [], fixedNow)

    expect(result).not.toBeNull()
    expect(result).toContain('TUGAS (2)')
    expect(result).not.toContain('KERJAAN')
  })

  it('hanya menampilkan bagian Kerjaan jika Tugas kosong', () => {
    const result = susunPesanReminder([], sampleKerjaan, fixedNow)

    expect(result).not.toBeNull()
    expect(result).toContain('KERJAAN (2)')
    expect(result).not.toContain('TUGAS')
  })

  it('memfilter item yang sudah selesai sehingga tidak muncul dalam pesan', () => {
    const tugasMixed: ReminderTugasItem[] = [
      sampleTugas[0], // selesai: false
      { ...sampleTugas[1], selesai: true }, // selesai: true
    ]
    const kerjaanMixed: ReminderKerjaanItem[] = [
      { ...sampleKerjaan[0], selesai: true },
      sampleKerjaan[1], // selesai: false
    ]

    const result = susunPesanReminder(tugasMixed, kerjaanMixed, fixedNow)

    expect(result).not.toBeNull()
    expect(result).toContain('TUGAS (1)')
    expect(result).toContain('Makalah AI')
    expect(result).not.toContain('Tugas Kalkulus')

    expect(result).toContain('KERJAAN (1)')
    expect(result).toContain('Deploy Staging')
    expect(result).not.toContain('Revisi Desain')
  })

  it('helper getIndicatorEmoji mengembalikan emoji sesuai aturan hari tersisa', () => {
    expect(getIndicatorEmoji(-1)).toBe('🔴') // terlambat
    expect(getIndicatorEmoji(0)).toBe('🔴') // hari ini (< 2 hari)
    expect(getIndicatorEmoji(1)).toBe('🔴') // besok (< 2 hari)
    expect(getIndicatorEmoji(2)).toBe('🟡') // 2 hari lagi (< 4 hari)
    expect(getIndicatorEmoji(3)).toBe('🟡') // 3 hari lagi (< 4 hari)
    expect(getIndicatorEmoji(4)).toBe('🟢') // 4 hari lagi (< 7 hari)
    expect(getIndicatorEmoji(6)).toBe('🟢') // 6 hari lagi (< 7 hari)
    expect(getIndicatorEmoji(7)).toBe('⚪') // >= 7 hari
    expect(getIndicatorEmoji(14)).toBe('⚪')
  })

  it('helper formatHeaderTanggalWib memformat tanggal header dengan benar', () => {
    const formatted = formatHeaderTanggalWib(fixedNow)
    expect(formatted).toBe('Minggu, 4 Oktober 2026')
  })

  it('helper formatTanggalWib memformat tanggal dan jam dengan benar', () => {
    const formatted = formatTanggalWib(fixedNow)
    expect(formatted).toBe('Minggu, 4 Oktober 2026 pukul 09:00 WIB')
  })
})
