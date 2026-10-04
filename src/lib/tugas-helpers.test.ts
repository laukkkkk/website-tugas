import { describe, it, expect } from 'vitest'
import {
  deadlineKeFormParts,
  gabungDeadlineToIso,
  urutkanTugas,
  saringTugas,
  validasiFormTugas,
  type TugasFormData,
} from './tugas-helpers.js'
import type { Tugas } from '../types/index.js'

describe('Tugas Helpers', () => {
  const sampleTugasList: Tugas[] = [
    {
      id: '1',
      judul: 'Tugas Matematika Diskrit',
      matkul: 'Matematika',
      tipe: 'individu',
      link_pengumpulan: 'https://example.com/math',
      deadline: '2026-10-10T23:59:00+07:00',
      selesai: false,
      created_at: '2026-10-01T00:00:00Z',
    },
    {
      id: '2',
      judul: 'Proyek Algoritma',
      matkul: 'Algoritma',
      tipe: 'kelompok',
      link_pengumpulan: null,
      deadline: '2026-10-05T20:00:00+07:00',
      selesai: false,
      created_at: '2026-10-01T00:00:00Z',
    },
    {
      id: '3',
      judul: 'Tugas Praktikum Fisika',
      matkul: 'Fisika Dasar',
      tipe: 'individu',
      link_pengumpulan: null,
      deadline: '2026-10-02T15:00:00+07:00',
      selesai: true,
      created_at: '2026-10-01T00:00:00Z',
    },
    {
      id: '4',
      judul: 'Laporan Basis Data',
      matkul: 'Basis Data',
      tipe: 'kelompok',
      link_pengumpulan: null,
      deadline: '2026-10-07T23:59:00+07:00',
      selesai: true,
      created_at: '2026-10-01T00:00:00Z',
    },
  ]

  describe('deadlineKeFormParts', () => {
    it('mengubah ISO string menjadi tanggal dan jam dalam WIB', () => {
      const parts = deadlineKeFormParts('2026-10-05T14:30:00Z') // 14:30 UTC = 21:30 WIB (+7)
      expect(parts.tanggal).toBe('2026-10-05')
      expect(parts.jam).toBe('21:30')
    })
  })

  describe('gabungDeadlineToIso', () => {
    it('menggabungkan tanggal dan jam dengan benar', () => {
      const iso = gabungDeadlineToIso('2026-10-15', '14:30')
      const date = new Date(iso)
      expect(date.toISOString()).toBe(new Date('2026-10-15T14:30:00+07:00').toISOString())
    })

    it('menggunakan jam default 23:59 jika jam tidak diisi', () => {
      const iso = gabungDeadlineToIso('2026-10-15')
      const date = new Date(iso)
      expect(date.toISOString()).toBe(new Date('2026-10-15T23:59:00+07:00').toISOString())
    })

    it('melempar error jika tanggal kosong', () => {
      expect(() => gabungDeadlineToIso('')).toThrow('Tanggal deadline wajib diisi.')
    })
  })

  describe('urutkanTugas', () => {
    it('menempatkan tugas belum selesai di atas dan selesai di bawah, diurutkan per deadline', () => {
      const sorted = urutkanTugas(sampleTugasList)

      // 2 yang belum selesai harus di atas
      expect(sorted[0].selesai).toBe(false)
      expect(sorted[1].selesai).toBe(false)
      expect(sorted[2].selesai).toBe(true)
      expect(sorted[3].selesai).toBe(true)

      // Yang belum selesai diurutkan per deadline: Proyek Algoritma (5 Okt) sebelum Matematika (10 Okt)
      expect(sorted[0].id).toBe('2')
      expect(sorted[1].id).toBe('1')

      // Yang selesai juga diurutkan per deadline: Fisika (2 Okt) sebelum Basis Data (7 Okt)
      expect(sorted[2].id).toBe('3')
      expect(sorted[3].id).toBe('4')
    })
  })

  describe('saringTugas', () => {
    it('memfilter berdasarkan status belum_selesai', () => {
      const hasil = saringTugas(sampleTugasList, 'belum_selesai')
      expect(hasil.length).toBe(2)
      expect(hasil.every((t) => !t.selesai)).toBe(true)
    })

    it('memfilter berdasarkan status selesai', () => {
      const hasil = saringTugas(sampleTugasList, 'selesai')
      expect(hasil.length).toBe(2)
      expect(hasil.every((t) => t.selesai)).toBe(true)
    })

    it('memfilter berdasarkan kata kunci judul atau matkul', () => {
      const hasilJudul = saringTugas(sampleTugasList, 'semua', 'algoritma')
      expect(hasilJudul.length).toBe(1)
      expect(hasilJudul[0].judul).toBe('Proyek Algoritma')

      const hasilMatkul = saringTugas(sampleTugasList, 'semua', 'fisika')
      expect(hasilMatkul.length).toBe(1)
      expect(hasilMatkul[0].matkul).toBe('Fisika Dasar')
    })
  })

  describe('validasiFormTugas', () => {
    it('mengembalikan error jika judul kosong', () => {
      const data: TugasFormData = {
        judul: '   ',
        matkul: 'Kalkulus',
        tipe: 'individu',
        link_pengumpulan: '',
        tanggal: '2026-10-10',
        jam: '23:59',
      }
      const errors = validasiFormTugas(data)
      expect(errors.judul).toBe('Judul tugas wajib diisi.')
    })

    it('mengembalikan error jika matkul kosong', () => {
      const data: TugasFormData = {
        judul: 'Tugas 1',
        matkul: '',
        tipe: 'individu',
        link_pengumpulan: '',
        tanggal: '2026-10-10',
        jam: '23:59',
      }
      const errors = validasiFormTugas(data)
      expect(errors.matkul).toBe('Mata kuliah wajib diisi.')
    })

    it('mengembalikan error jika tanggal deadline kosong', () => {
      const data: TugasFormData = {
        judul: 'Tugas 1',
        matkul: 'Kalkulus',
        tipe: 'individu',
        link_pengumpulan: '',
        tanggal: '',
        jam: '23:59',
      }
      const errors = validasiFormTugas(data)
      expect(errors.deadline).toBe('Tanggal deadline wajib diisi.')
    })

    it('mengembalikan objek kosong jika semua data valid', () => {
      const data: TugasFormData = {
        judul: 'Tugas 1',
        matkul: 'Kalkulus',
        tipe: 'individu',
        link_pengumpulan: 'https://classroom.google.com',
        tanggal: '2026-10-10',
        jam: '23:59',
      }
      const errors = validasiFormTugas(data)
      expect(Object.keys(errors).length).toBe(0)
    })
  })
})
