import { describe, it, expect } from 'vitest'
import {
  deadlineKeFormParts,
  gabungDeadlineToIso,
  urutkanKerjaan,
  saringKerjaan,
  validasiFormKerjaan,
  type KerjaanFormData,
} from './kerjaan-helpers.js'
import type { Kerjaan } from '../types/index.js'

describe('Kerjaan Helpers', () => {
  const sampleKerjaanList: Kerjaan[] = [
    {
      id: 'k1',
      judul: 'Revisi Proposal Proyek A',
      deskripsi: 'Tambahkan estimasi biaya hosting',
      deadline: '2026-10-08T23:59:00+07:00',
      selesai: false,
      created_at: '2026-10-01T00:00:00Z',
    },
    {
      id: 'k2',
      judul: 'Meeting Klien PT Sejahtera',
      deskripsi: null,
      deadline: '2026-10-04T14:00:00+07:00',
      selesai: false,
      created_at: '2026-10-01T00:00:00Z',
    },
    {
      id: 'k3',
      judul: 'Kirim Invoice Bulan Lalu',
      deskripsi: 'Invoice #1024',
      deadline: '2026-10-01T17:00:00+07:00',
      selesai: true,
      created_at: '2026-10-01T00:00:00Z',
    },
    {
      id: 'k4',
      judul: 'Desain Logo Startup',
      deskripsi: 'Eksplorasi warna cyan dan amber',
      deadline: '2026-10-06T20:00:00+07:00',
      selesai: true,
      created_at: '2026-10-01T00:00:00Z',
    },
  ]

  describe('deadlineKeFormParts', () => {
    it('mengubah ISO string menjadi tanggal dan jam dalam WIB', () => {
      const parts = deadlineKeFormParts('2026-10-04T07:00:00Z') // 07:00 UTC = 14:00 WIB (+7)
      expect(parts.tanggal).toBe('2026-10-04')
      expect(parts.jam).toBe('14:00')
    })
  })

  describe('gabungDeadlineToIso', () => {
    it('menggabungkan tanggal dan jam dengan benar', () => {
      const iso = gabungDeadlineToIso('2026-10-20', '15:45')
      const date = new Date(iso)
      expect(date.toISOString()).toBe(new Date('2026-10-20T15:45:00+07:00').toISOString())
    })

    it('menggunakan jam default 23:59 jika jam tidak diisi', () => {
      const iso = gabungDeadlineToIso('2026-10-20')
      const date = new Date(iso)
      expect(date.toISOString()).toBe(new Date('2026-10-20T23:59:00+07:00').toISOString())
    })

    it('melempar error jika tanggal kosong', () => {
      expect(() => gabungDeadlineToIso('')).toThrow('Tanggal deadline wajib diisi.')
    })
  })

  describe('urutkanKerjaan', () => {
    it('menempatkan kerjaan belum selesai di atas dan selesai di bawah, diurutkan per deadline', () => {
      const sorted = urutkanKerjaan(sampleKerjaanList)

      // 2 yang belum selesai harus di atas
      expect(sorted[0].selesai).toBe(false)
      expect(sorted[1].selesai).toBe(false)
      expect(sorted[2].selesai).toBe(true)
      expect(sorted[3].selesai).toBe(true)

      // Yang belum selesai diurutkan per deadline: Meeting (4 Okt) sebelum Revisi (8 Okt)
      expect(sorted[0].id).toBe('k2')
      expect(sorted[1].id).toBe('k1')

      // Yang selesai diurutkan per deadline: Invoice (1 Okt) sebelum Desain Logo (6 Okt)
      expect(sorted[2].id).toBe('k3')
      expect(sorted[3].id).toBe('k4')
    })
  })

  describe('saringKerjaan', () => {
    it('memfilter berdasarkan status belum_selesai', () => {
      const hasil = saringKerjaan(sampleKerjaanList, 'belum_selesai')
      expect(hasil.length).toBe(2)
      expect(hasil.every((k) => !k.selesai)).toBe(true)
    })

    it('memfilter berdasarkan status selesai', () => {
      const hasil = saringKerjaan(sampleKerjaanList, 'selesai')
      expect(hasil.length).toBe(2)
      expect(hasil.every((k) => k.selesai)).toBe(true)
    })

    it('memfilter berdasarkan kata kunci judul atau deskripsi', () => {
      const hasilJudul = saringKerjaan(sampleKerjaanList, 'semua', 'meeting')
      expect(hasilJudul.length).toBe(1)
      expect(hasilJudul[0].judul).toBe('Meeting Klien PT Sejahtera')

      const hasilDeskripsi = saringKerjaan(sampleKerjaanList, 'semua', 'estimasi biaya')
      expect(hasilDeskripsi.length).toBe(1)
      expect(hasilDeskripsi[0].id).toBe('k1')
    })
  })

  describe('validasiFormKerjaan', () => {
    it('mengembalikan error jika judul kosong', () => {
      const data: KerjaanFormData = {
        judul: '   ',
        deskripsi: '',
        tanggal: '2026-10-10',
        jam: '23:59',
      }
      const errors = validasiFormKerjaan(data)
      expect(errors.judul).toBe('Judul kerjaan wajib diisi.')
    })

    it('mengembalikan error jika tanggal deadline kosong', () => {
      const data: KerjaanFormData = {
        judul: 'Kerjaan 1',
        deskripsi: '',
        tanggal: '',
        jam: '23:59',
      }
      const errors = validasiFormKerjaan(data)
      expect(errors.deadline).toBe('Tanggal deadline wajib diisi.')
    })

    it('mengembalikan objek kosong jika semua data valid', () => {
      const data: KerjaanFormData = {
        judul: 'Kerjaan 1',
        deskripsi: 'Deskripsi singkat',
        tanggal: '2026-10-10',
        jam: '23:59',
      }
      const errors = validasiFormKerjaan(data)
      expect(Object.keys(errors).length).toBe(0)
    })
  })
})
