import { describe, it, expect } from 'vitest'
import {
  hariTersisa,
  labelSisaWaktu,
  kelasWarna,
  parseDeadlineInput,
  getWibCalendarParts,
} from './deadline'

describe('deadline utilities', () => {
  describe('kelasWarna & labelSisaWaktu boundary values', () => {
    // Memastikan batas nilai sesuai spesifikasi Issue #1: n = -1, 0, 1, 2, 3, 4, 6, 7
    it('handles n = -1 (terlambat 1 hari -> merah)', () => {
      expect(labelSisaWaktu(-1)).toBe('Terlambat 1 hari')
      expect(kelasWarna(-1)).toBe('merah')
    })

    it('handles n = 0 (hari ini -> merah)', () => {
      expect(labelSisaWaktu(0)).toBe('Hari ini')
      expect(kelasWarna(0)).toBe('merah')
    })

    it('handles n = 1 (besok -> merah)', () => {
      expect(labelSisaWaktu(1)).toBe('Besok')
      expect(kelasWarna(1)).toBe('merah')
    })

    it('handles n = 2 (2 hari lagi -> kuning)', () => {
      expect(labelSisaWaktu(2)).toBe('2 hari lagi')
      expect(kelasWarna(2)).toBe('kuning')
    })

    it('handles n = 3 (3 hari lagi -> kuning)', () => {
      expect(labelSisaWaktu(3)).toBe('3 hari lagi')
      expect(kelasWarna(3)).toBe('kuning')
    })

    it('handles n = 4 (4 hari lagi -> hijau)', () => {
      expect(labelSisaWaktu(4)).toBe('4 hari lagi')
      expect(kelasWarna(4)).toBe('hijau')
    })

    it('handles n = 6 (6 hari lagi -> hijau)', () => {
      expect(labelSisaWaktu(6)).toBe('6 hari lagi')
      expect(kelasWarna(6)).toBe('hijau')
    })

    it('handles n = 7 (7 hari lagi -> netral)', () => {
      expect(labelSisaWaktu(7)).toBe('7 hari lagi')
      expect(kelasWarna(7)).toBe('netral')
    })

    it('handles additional values like n = -3 and n = 14', () => {
      expect(labelSisaWaktu(-3)).toBe('Terlambat 3 hari')
      expect(kelasWarna(-3)).toBe('merah')

      expect(labelSisaWaktu(14)).toBe('14 hari lagi')
      expect(kelasWarna(14)).toBe('netral')
    })
  })

  describe('hariTersisa with WIB timezone', () => {
    // Base reference: 2 Oktober 2026 10:00:00 WIB (+07:00)
    const sekarangWIB = '2026-10-02T10:00:00+07:00'

    it('calculates -1 day difference (yesterday in WIB)', () => {
      const deadline = '2026-10-01T23:59:00+07:00'
      const n = hariTersisa(deadline, sekarangWIB)
      expect(n).toBe(-1)
      expect(labelSisaWaktu(n)).toBe('Terlambat 1 hari')
      expect(kelasWarna(n)).toBe('merah')
    })

    it('calculates 0 day difference (same calendar day in WIB)', () => {
      const deadline = '2026-10-02T23:59:00+07:00'
      const n = hariTersisa(deadline, sekarangWIB)
      expect(n).toBe(0)
      expect(labelSisaWaktu(n)).toBe('Hari ini')
      expect(kelasWarna(n)).toBe('merah')
    })

    it('calculates 1 day difference (tomorrow in WIB)', () => {
      const deadline = '2026-10-03T08:00:00+07:00'
      const n = hariTersisa(deadline, sekarangWIB)
      expect(n).toBe(1)
      expect(labelSisaWaktu(n)).toBe('Besok')
      expect(kelasWarna(n)).toBe('merah')
    })

    it('calculates 2 days difference (kuning)', () => {
      const deadline = '2026-10-04T12:00:00+07:00'
      const n = hariTersisa(deadline, sekarangWIB)
      expect(n).toBe(2)
      expect(labelSisaWaktu(n)).toBe('2 hari lagi')
      expect(kelasWarna(n)).toBe('kuning')
    })

    it('calculates 3 days difference (kuning)', () => {
      const deadline = '2026-10-05T12:00:00+07:00'
      const n = hariTersisa(deadline, sekarangWIB)
      expect(n).toBe(3)
      expect(labelSisaWaktu(n)).toBe('3 hari lagi')
      expect(kelasWarna(n)).toBe('kuning')
    })

    it('calculates 4 days difference (hijau)', () => {
      const deadline = '2026-10-06T12:00:00+07:00'
      const n = hariTersisa(deadline, sekarangWIB)
      expect(n).toBe(4)
      expect(labelSisaWaktu(n)).toBe('4 hari lagi')
      expect(kelasWarna(n)).toBe('hijau')
    })

    it('calculates 6 days difference (hijau)', () => {
      const deadline = '2026-10-08T12:00:00+07:00'
      const n = hariTersisa(deadline, sekarangWIB)
      expect(n).toBe(6)
      expect(labelSisaWaktu(n)).toBe('6 hari lagi')
      expect(kelasWarna(n)).toBe('hijau')
    })

    it('calculates 7 days difference (netral)', () => {
      const deadline = '2026-10-09T12:00:00+07:00'
      const n = hariTersisa(deadline, sekarangWIB)
      expect(n).toBe(7)
      expect(labelSisaWaktu(n)).toBe('7 hari lagi')
      expect(kelasWarna(n)).toBe('netral')
    })

    it('handles WIB conversion accurately across UTC boundary', () => {
      // 2026-10-02 23:30 WIB = 2026-10-02 16:30 UTC
      const lateNightWIB = new Date('2026-10-02T16:30:00Z')
      // 2026-10-03 01:00 WIB = 2026-10-02 18:00 UTC (still Oct 2 in UTC, but Oct 3 in WIB)
      const nextEarlyMorningWIB = new Date('2026-10-02T18:00:00Z')

      expect(hariTersisa(nextEarlyMorningWIB, lateNightWIB)).toBe(1)
    })

    it('works with YYYY-MM-DD string inputs', () => {
      expect(hariTersisa('2026-10-05', '2026-10-02')).toBe(3)
      expect(hariTersisa('2026-10-01', '2026-10-02')).toBe(-1)
    })
  })

  describe('parseDeadlineInput', () => {
    it('sets default time to 23:59 WIB (+07:00) when given only date', () => {
      const parsed = parseDeadlineInput('2026-10-05')
      const parts = getWibCalendarParts(parsed)
      expect(parts.year).toBe(2026)
      expect(parts.month).toBe(10)
      expect(parts.day).toBe(5)

      // In ISO string with +07:00
      expect(parsed.toISOString()).toBe(new Date('2026-10-05T23:59:00+07:00').toISOString())
    })

    it('preserves explicit timestamp when provided', () => {
      const parsed = parseDeadlineInput('2026-10-05T14:30:00+07:00')
      expect(parsed.toISOString()).toBe(new Date('2026-10-05T14:30:00+07:00').toISOString())
    })
  })
})
