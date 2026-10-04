import { describe, it, expect } from 'vitest'
import {
  parseDeadlineWib,
  getWibDetails,
  DeadlineParseError,
  formatDeadlineHumanWib,
} from './tanggal.js'

describe('parseDeadlineWib', () => {
  // Waktu acuan tetap: Sabtu, 3 Oktober 2026 pukul 10:00:00 WIB
  // 2026-10-03T10:00:00+07:00 -> 2026-10-03T03:00:00Z
  const fixedNow = new Date('2026-10-03T10:00:00+07:00')

  it('mem-parse "hari ini" dengan default jam 23:59 WIB', () => {
    const result = parseDeadlineWib('hari ini', fixedNow)
    const wib = getWibDetails(result)

    expect(wib.year).toBe(2026)
    expect(wib.month).toBe(10)
    expect(wib.day).toBe(3)
    expect(wib.hour).toBe(23)
    expect(wib.minute).toBe(59)
  })

  it('mem-parse "besok" dengan default jam 23:59 WIB', () => {
    const result = parseDeadlineWib('besok', fixedNow)
    const wib = getWibDetails(result)

    expect(wib.year).toBe(2026)
    expect(wib.month).toBe(10)
    expect(wib.day).toBe(4)
    expect(wib.hour).toBe(23)
    expect(wib.minute).toBe(59)
  })

  it('mem-parse "lusa" dengan default jam 23:59 WIB', () => {
    const result = parseDeadlineWib('lusa', fixedNow)
    const wib = getWibDetails(result)

    expect(wib.year).toBe(2026)
    expect(wib.month).toBe(10)
    expect(wib.day).toBe(5)
    expect(wib.hour).toBe(23)
    expect(wib.minute).toBe(59)
  })

  it('mem-parse "hari ini" dengan jam kustom "hari ini 14.00"', () => {
    const result = parseDeadlineWib('hari ini 14.00', fixedNow)
    const wib = getWibDetails(result)

    expect(wib.year).toBe(2026)
    expect(wib.month).toBe(10)
    expect(wib.day).toBe(3)
    expect(wib.hour).toBe(14)
    expect(wib.minute).toBe(0)
  })

  it('mem-parse "besok 20:30"', () => {
    const result = parseDeadlineWib('besok 20:30', fixedNow)
    const wib = getWibDetails(result)

    expect(wib.year).toBe(2026)
    expect(wib.month).toBe(10)
    expect(wib.day).toBe(4)
    expect(wib.hour).toBe(20)
    expect(wib.minute).toBe(30)
  })

  it('mem-parse nama hari "senin" (hari itu berikutnya: Sabtu 3 Okt -> Senin 5 Okt)', () => {
    const result = parseDeadlineWib('senin', fixedNow)
    const wib = getWibDetails(result)

    expect(wib.year).toBe(2026)
    expect(wib.month).toBe(10)
    expect(wib.day).toBe(5) // Senin terdekat
    expect(wib.hour).toBe(23)
    expect(wib.minute).toBe(59)
  })

  it('mem-parse nama hari yang sama "sabtu" -> Sabtu minggu berikutnya (+7 hari)', () => {
    const result = parseDeadlineWib('sabtu', fixedNow)
    const wib = getWibDetails(result)

    expect(wib.year).toBe(2026)
    expect(wib.month).toBe(10)
    expect(wib.day).toBe(10) // 3 + 7 = 10 Okt
    expect(wib.hour).toBe(23)
    expect(wib.minute).toBe(59)
  })

  it('mem-parse "senin 09.00"', () => {
    const result = parseDeadlineWib('senin 09.00', fixedNow)
    const wib = getWibDetails(result)

    expect(wib.year).toBe(2026)
    expect(wib.month).toBe(10)
    expect(wib.day).toBe(5)
    expect(wib.hour).toBe(9)
    expect(wib.minute).toBe(0)
  })

  it('mem-parse format tanggal bulan singkat "5 okt"', () => {
    const result = parseDeadlineWib('5 okt', fixedNow)
    const wib = getWibDetails(result)

    expect(wib.year).toBe(2026)
    expect(wib.month).toBe(10)
    expect(wib.day).toBe(5)
    expect(wib.hour).toBe(23)
    expect(wib.minute).toBe(59)
  })

  it('mem-parse format tanggal bulan panjang "5 oktober"', () => {
    const result = parseDeadlineWib('5 oktober', fixedNow)
    const wib = getWibDetails(result)

    expect(wib.year).toBe(2026)
    expect(wib.month).toBe(10)
    expect(wib.day).toBe(5)
    expect(wib.hour).toBe(23)
    expect(wib.minute).toBe(59)
  })

  it('mem-parse format angka "5/10"', () => {
    const result = parseDeadlineWib('5/10', fixedNow)
    const wib = getWibDetails(result)

    expect(wib.year).toBe(2026)
    expect(wib.month).toBe(10)
    expect(wib.day).toBe(5)
    expect(wib.hour).toBe(23)
    expect(wib.minute).toBe(59)
  })

  it('mem-parse format angka dengan jam "5/10 14.00"', () => {
    const result = parseDeadlineWib('5/10 14.00', fixedNow)
    const wib = getWibDetails(result)

    expect(wib.year).toBe(2026)
    expect(wib.month).toBe(10)
    expect(wib.day).toBe(5)
    expect(wib.hour).toBe(14)
    expect(wib.minute).toBe(0)
  })

  it('mem-parse format "5 okt 14.00"', () => {
    const result = parseDeadlineWib('5 okt 14.00', fixedNow)
    const wib = getWibDetails(result)

    expect(wib.year).toBe(2026)
    expect(wib.month).toBe(10)
    expect(wib.day).toBe(5)
    expect(wib.hour).toBe(14)
    expect(wib.minute).toBe(0)
  })

  it('mem-parse format standar ISO "2026-10-05 14:00"', () => {
    const result = parseDeadlineWib('2026-10-05 14:00', fixedNow)
    const wib = getWibDetails(result)

    expect(wib.year).toBe(2026)
    expect(wib.month).toBe(10)
    expect(wib.day).toBe(5)
    expect(wib.hour).toBe(14)
    expect(wib.minute).toBe(0)
  })

  it('menggunakan tahun depan jika tanggal sudah lewat pada tahun ini (misal 1 okt saat sekarang 3 okt)', () => {
    // 1 Okt 2026 sudah lewat dari fixedNow (3 Okt 2026)
    const result = parseDeadlineWib('1 okt', fixedNow)
    const wib = getWibDetails(result)

    expect(wib.year).toBe(2027) // dialihkan ke tahun depan
    expect(wib.month).toBe(10)
    expect(wib.day).toBe(1)
  })

  it('menggunakan tahun depan untuk format angka jika tanggal sudah lewat (misal 15/9 saat sekarang 3 Okt)', () => {
    const result = parseDeadlineWib('15/9', fixedNow)
    const wib = getWibDetails(result)

    expect(wib.year).toBe(2027)
    expect(wib.month).toBe(9)
    expect(wib.day).toBe(15)
  })

  it('melempar DeadlineParseError untuk input kosong atau whitespace', () => {
    expect(() => parseDeadlineWib('')).toThrow(DeadlineParseError)
    expect(() => parseDeadlineWib('   ')).toThrow(DeadlineParseError)
  })

  it('melempar DeadlineParseError untuk teks acak yang tidak valid', () => {
    expect(() => parseDeadlineWib('kemarin sore')).toThrow(DeadlineParseError)
    expect(() => parseDeadlineWib('asdfghjkl')).toThrow(DeadlineParseError)
    expect(() => parseDeadlineWib('besok lusa nanti')).toThrow(DeadlineParseError)
  })

  it('melempar DeadlineParseError untuk tanggal yang tidak valid di kalender (misal 32 januari atau 31 april)', () => {
    expect(() => parseDeadlineWib('32 januari', fixedNow)).toThrow(DeadlineParseError)
    expect(() => parseDeadlineWib('31 april', fixedNow)).toThrow(DeadlineParseError)
    expect(() => parseDeadlineWib('29/2/2025', fixedNow)).toThrow(DeadlineParseError) // 2025 bukan kabisat
  })

  it('formatDeadlineHumanWib menghasilkan format bahasa Indonesia yang mudah dibaca', () => {
    const date = new Date('2026-10-05T14:00:00+07:00')
    const formatted = formatDeadlineHumanWib(date)
    expect(formatted).toBe('Senin, 5 Oktober 2026 pukul 14:00 WIB')
  })
})
