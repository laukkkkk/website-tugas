import { describe, it, expect } from 'vitest'
import {
  formatWaktuWib,
  urutkanTodos,
  validasiFormNote,
} from './catatan-helpers.js'
import type { Todo } from '../types/index.js'

describe('Catatan & To-do Helpers', () => {
  describe('formatWaktuWib', () => {
    it('mengubah ISO string menjadi format waktu WIB yang ramah dibaca', () => {
      // 2026-10-04T07:30:00Z -> 14:30 WIB
      const hasil = formatWaktuWib('2026-10-04T07:30:00Z')
      expect(hasil).toBe('4 Okt 2026, 14:30 WIB')
    })

    it('mengembalikan string asli jika input tidak valid', () => {
      const hasil = formatWaktuWib('tanggal-tidak-valid')
      expect(hasil).toBe('tanggal-tidak-valid')
    })
  })

  describe('urutkanTodos', () => {
    const sampleTodos: Todo[] = [
      {
        id: '1',
        teks: 'Beli buku tulis',
        selesai: true,
        created_at: '2026-10-01T10:00:00Z',
      },
      {
        id: '2',
        teks: 'Cetak materi slide',
        selesai: false,
        created_at: '2026-10-02T10:00:00Z',
      },
      {
        id: '3',
        teks: 'Kirim email ke dosen',
        selesai: false,
        created_at: '2026-10-03T10:00:00Z',
      },
      {
        id: '4',
        teks: 'Backup file tugas',
        selesai: true,
        created_at: '2026-10-04T10:00:00Z',
      },
    ]

    it('menempatkan to-do belum selesai di atas dan selesai di bawah', () => {
      const sorted = urutkanTodos(sampleTodos)

      // Yang belum selesai di atas
      expect(sorted[0].selesai).toBe(false)
      expect(sorted[1].selesai).toBe(false)
      // Yang selesai di bawah
      expect(sorted[2].selesai).toBe(true)
      expect(sorted[3].selesai).toBe(true)

      // Yang belum selesai diurutkan terbaru dahulu (id 3 sebelum id 2)
      expect(sorted[0].id).toBe('3')
      expect(sorted[1].id).toBe('2')

      // Yang selesai juga diurutkan terbaru dahulu (id 4 sebelum id 1)
      expect(sorted[2].id).toBe('4')
      expect(sorted[3].id).toBe('1')
    })
  })

  describe('validasiFormNote', () => {
    it('mengembalikan error jika judul kosong', () => {
      const errors = validasiFormNote('', 'Isi catatan ada')
      expect(errors.judul).toBe('Judul catatan wajib diisi.')
      expect(errors.isi).toBeUndefined()
    })

    it('mengembalikan error jika isi kosong', () => {
      const errors = validasiFormNote('Judul ada', '   ')
      expect(errors.isi).toBe('Isi catatan tidak boleh kosong.')
      expect(errors.judul).toBeUndefined()
    })

    it('mengembalikan objek kosong jika judul dan isi valid', () => {
      const errors = validasiFormNote('Judul Catatan', 'Isi catatan yang lengkap.')
      expect(Object.keys(errors).length).toBe(0)
    })
  })
})
