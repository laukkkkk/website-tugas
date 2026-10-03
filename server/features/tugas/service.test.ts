import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  tambah,
  ambilSemua,
  ambilBelumSelesai,
  ambilById,
  ubah,
  hapus,
  tandaiSelesai,
  normalizeDeadline,
  validateTipe,
  ValidationError,
  NotFoundError,
} from './service.js'
import type { SupabaseClient } from '@supabase/supabase-js'

describe('server/features/tugas/service.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('validasi helper murni (normalizeDeadline & validateTipe)', () => {
    it('throws ValidationError for empty or invalid deadline', () => {
      expect(() => normalizeDeadline(undefined)).toThrow(ValidationError)
      expect(() => normalizeDeadline('')).toThrow(ValidationError)
      expect(() => normalizeDeadline('bukan-tanggal')).toThrow(ValidationError)
    })

    it('sets default time to 23:59 WIB for YYYY-MM-DD date-only deadline', () => {
      const normalized = normalizeDeadline('2026-10-15')
      const expected = new Date('2026-10-15T23:59:00+07:00').toISOString()
      expect(normalized).toBe(expected)
    })

    it('preserves valid ISO deadline with time', () => {
      const iso = '2026-10-15T14:30:00.000Z'
      expect(normalizeDeadline(iso)).toBe(iso)
    })

    it('validates tipe tugas strictly to individu or kelompok', () => {
      expect(validateTipe('individu')).toBe('individu')
      expect(validateTipe('kelompok')).toBe('kelompok')
      expect(() => validateTipe('lainnya')).toThrow(ValidationError)
      expect(() => validateTipe(123)).toThrow(ValidationError)
    })
  })

  describe('tambah (validasi input & insert)', () => {
    it('throws ValidationError when judul is missing or empty', async () => {
      const mockClient = {} as SupabaseClient
      await expect(
        tambah(
          {
            judul: '   ',
            matkul: 'Jarkom',
            tipe: 'individu',
            deadline: '2026-10-10',
          },
          mockClient
        )
      ).rejects.toThrow('Judul tugas wajib diisi.')
    })

    it('throws ValidationError when matkul is missing or empty', async () => {
      const mockClient = {} as SupabaseClient
      await expect(
        tambah(
          {
            judul: 'Tugas 1',
            matkul: '',
            tipe: 'individu',
            deadline: '2026-10-10',
          },
          mockClient
        )
      ).rejects.toThrow('Mata kuliah wajib diisi.')
    })

    it('throws ValidationError when tipe is invalid', async () => {
      const mockClient = {} as SupabaseClient
      await expect(
        tambah(
          {
            judul: 'Tugas 1',
            matkul: 'Jarkom',
            tipe: 'random' as any,
            deadline: '2026-10-10',
          },
          mockClient
        )
      ).rejects.toThrow("Tipe tugas harus 'individu' atau 'kelompok'.")
    })

    it('throws ValidationError when deadline is invalid', async () => {
      const mockClient = {} as SupabaseClient
      await expect(
        tambah(
          {
            judul: 'Tugas 1',
            matkul: 'Jarkom',
            tipe: 'kelompok',
            deadline: 'tanggal-salah',
          },
          mockClient
        )
      ).rejects.toThrow('Deadline harus tanggal yang valid.')
    })

    it('inserts valid tugas and sets selesai default to false', async () => {
      const singleMock = vi.fn().mockResolvedValue({
        data: {
          id: 'mock-uuid-1',
          judul: 'Laporan Praktikum',
          matkul: 'Sistem Operasi',
          tipe: 'kelompok',
          link_pengumpulan: 'https://classroom.google.com',
          deadline: new Date('2026-10-12T23:59:00+07:00').toISOString(),
          selesai: false,
          created_at: new Date().toISOString(),
        },
        error: null,
      })
      const selectMock = vi.fn(() => ({ single: singleMock }))
      const insertMock = vi.fn(() => ({ select: selectMock }))
      const fromMock = vi.fn(() => ({ insert: insertMock }))

      const mockClient = { from: fromMock } as unknown as SupabaseClient

      const result = await tambah(
        {
          judul: '  Laporan Praktikum  ',
          matkul: ' Sistem Operasi ',
          tipe: 'kelompok',
          link_pengumpulan: 'https://classroom.google.com',
          deadline: '2026-10-12',
        },
        mockClient
      )

      expect(fromMock).toHaveBeenCalledWith('tugas')
      expect(insertMock).toHaveBeenCalledWith({
        judul: 'Laporan Praktikum',
        matkul: 'Sistem Operasi',
        tipe: 'kelompok',
        link_pengumpulan: 'https://classroom.google.com',
        deadline: new Date('2026-10-12T23:59:00+07:00').toISOString(),
        selesai: false,
      })
      expect(result.id).toBe('mock-uuid-1')
      expect(result.selesai).toBe(false)
    })
  })

  describe('urutan daftar tugas (ambilSemua & ambilBelumSelesai)', () => {
    it('ambilSemua orders by selesai ASC, then deadline ASC', async () => {
      const mockData = [
        { id: '1', judul: 'Tugas A (Belum selesai, besok)', selesai: false, deadline: '2026-10-04T00:00:00Z' },
        { id: '2', judul: 'Tugas B (Belum selesai, lusa)', selesai: false, deadline: '2026-10-05T00:00:00Z' },
        { id: '3', judul: 'Tugas C (Sudah selesai)', selesai: true, deadline: '2026-10-01T00:00:00Z' },
      ]

      const order2Mock = vi.fn().mockResolvedValue({ data: mockData, error: null })
      const order1Mock = vi.fn(() => ({ order: order2Mock }))
      const selectMock = vi.fn(() => ({ order: order1Mock }))
      const fromMock = vi.fn(() => ({ select: selectMock }))

      const mockClient = { from: fromMock } as unknown as SupabaseClient

      const items = await ambilSemua(mockClient)

      expect(fromMock).toHaveBeenCalledWith('tugas')
      // Urutan pertama: selesai ASC (false sebelum true)
      expect(order1Mock).toHaveBeenCalledWith('selesai', { ascending: true })
      // Urutan kedua: deadline ASC (deadline terdekat lebih dulu)
      expect(order2Mock).toHaveBeenCalledWith('deadline', { ascending: true })
      expect(items).toEqual(mockData)
    })

    it('ambilBelumSelesai filters by selesai = false and orders by deadline ASC', async () => {
      const mockData = [
        { id: '1', judul: 'Tugas A', selesai: false, deadline: '2026-10-04T00:00:00Z' },
      ]

      const orderMock = vi.fn().mockResolvedValue({ data: mockData, error: null })
      const eqMock = vi.fn(() => ({ order: orderMock }))
      const selectMock = vi.fn(() => ({ eq: eqMock }))
      const fromMock = vi.fn(() => ({ select: selectMock }))

      const mockClient = { from: fromMock } as unknown as SupabaseClient

      const items = await ambilBelumSelesai(mockClient)

      expect(fromMock).toHaveBeenCalledWith('tugas')
      expect(eqMock).toHaveBeenCalledWith('selesai', false)
      expect(orderMock).toHaveBeenCalledWith('deadline', { ascending: true })
      expect(items).toEqual(mockData)
    })
  })

  describe('ubah & tandaiSelesai', () => {
    it('throws ValidationError if no update data provided', async () => {
      const mockClient = {} as SupabaseClient
      await expect(ubah('mock-id', {}, mockClient)).rejects.toThrow('Tidak ada data yang diperbarui.')
    })

    it('throws NotFoundError if record does not exist on ubah', async () => {
      const maybeSingleMock = vi.fn().mockResolvedValue({ data: null, error: null })
      const eqMock = vi.fn(() => ({ maybeSingle: maybeSingleMock }))
      const selectMock = vi.fn(() => ({ eq: eqMock }))
      const fromMock = vi.fn(() => ({ select: selectMock }))

      const mockClient = { from: fromMock } as unknown as SupabaseClient

      await expect(ubah('non-existent-id', { judul: 'Judul Baru' }, mockClient)).rejects.toThrow(NotFoundError)
    })

    it('updates fields successfully', async () => {
      // Mock ambilById
      const existing = { id: 'item-1', judul: 'Lama', matkul: 'Algo', selesai: false }
      const maybeSingleMock = vi.fn().mockResolvedValue({ data: existing, error: null })
      const selectByIdMock = vi.fn(() => ({ maybeSingle: maybeSingleMock }))
      const eqSelectMock = vi.fn(() => ({ select: selectByIdMock }))

      // Mock update
      const updatedItem = { ...existing, selesai: true }
      const singleUpdateMock = vi.fn().mockResolvedValue({ data: updatedItem, error: null })
      const selectUpdateMock = vi.fn(() => ({ single: singleUpdateMock }))
      const eqUpdateMock = vi.fn(() => ({ select: selectUpdateMock }))
      const updateMock = vi.fn(() => ({ eq: eqUpdateMock }))

      const fromMock = vi.fn((table) => {
        return {
          select: (query: string) => ({ eq: (col: string, val: string) => ({ maybeSingle: maybeSingleMock }) }),
          update: updateMock,
        }
      })

      const mockClient = { from: fromMock } as unknown as SupabaseClient

      const res = await tandaiSelesai('item-1', true, mockClient)
      expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({ selesai: true }))
      expect(res.selesai).toBe(true)
    })
  })

  describe('hapus', () => {
    it('throws NotFoundError when deleting non-existent item', async () => {
      const maybeSingleMock = vi.fn().mockResolvedValue({ data: null, error: null })
      const fromMock = vi.fn(() => ({
        select: () => ({ eq: () => ({ maybeSingle: maybeSingleMock }) }),
      }))
      const mockClient = { from: fromMock } as unknown as SupabaseClient

      await expect(hapus('not-found', mockClient)).rejects.toThrow(NotFoundError)
    })

    it('deletes item when it exists', async () => {
      const existing = { id: 'exist-1' }
      const maybeSingleMock = vi.fn().mockResolvedValue({ data: existing, error: null })
      const deleteMock = vi.fn().mockResolvedValue({ error: null })

      const fromMock = vi.fn(() => ({
        select: () => ({ eq: () => ({ maybeSingle: maybeSingleMock }) }),
        delete: () => ({ eq: deleteMock }),
      }))
      const mockClient = { from: fromMock } as unknown as SupabaseClient

      await expect(hapus('exist-1', mockClient)).resolves.toBeUndefined()
    })
  })
})
