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
  ValidationError,
  NotFoundError,
} from './service.js'
import type { SupabaseClient } from '@supabase/supabase-js'

describe('server/features/kerjaan/service.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('validasi deadline', () => {
    it('throws ValidationError for empty or invalid deadline', () => {
      expect(() => normalizeDeadline(undefined)).toThrow(ValidationError)
      expect(() => normalizeDeadline('')).toThrow(ValidationError)
      expect(() => normalizeDeadline('bukan-tanggal')).toThrow(ValidationError)
    })

    it('sets default time to 23:59 WIB for YYYY-MM-DD date-only deadline', () => {
      const normalized = normalizeDeadline('2026-10-20')
      const expected = new Date('2026-10-20T23:59:00+07:00').toISOString()
      expect(normalized).toBe(expected)
    })

    it('preserves valid ISO deadline with time', () => {
      const iso = '2026-10-20T10:00:00.000Z'
      expect(normalizeDeadline(iso)).toBe(iso)
    })
  })

  describe('tambah (validasi input & insert)', () => {
    it('throws ValidationError when judul is missing or whitespace', async () => {
      const mockClient = {} as SupabaseClient
      await expect(
        tambah(
          {
            judul: '   ',
            deadline: '2026-10-20',
          },
          mockClient
        )
      ).rejects.toThrow('Judul kerjaan wajib diisi.')
    })

    it('throws ValidationError when deadline is missing or invalid', async () => {
      const mockClient = {} as SupabaseClient
      await expect(
        tambah(
          {
            judul: 'Freelance UI Design',
            deadline: 'tanggal-salah',
          },
          mockClient
        )
      ).rejects.toThrow('Deadline harus tanggal yang valid.')
    })

    it('inserts valid kerjaan with optional deskripsi and selesai default false', async () => {
      const singleMock = vi.fn().mockResolvedValue({
        data: {
          id: 'kerjaan-uuid-1',
          judul: 'Slicing Landing Page Figma',
          deskripsi: 'Convert 3 halaman ke Next.js',
          deadline: new Date('2026-10-25T23:59:00+07:00').toISOString(),
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
          judul: '  Slicing Landing Page Figma ',
          deskripsi: ' Convert 3 halaman ke Next.js ',
          deadline: '2026-10-25',
        },
        mockClient
      )

      expect(fromMock).toHaveBeenCalledWith('kerjaan')
      expect(insertMock).toHaveBeenCalledWith({
        judul: 'Slicing Landing Page Figma',
        deskripsi: 'Convert 3 halaman ke Next.js',
        deadline: new Date('2026-10-25T23:59:00+07:00').toISOString(),
        selesai: false,
      })
      expect(result.id).toBe('kerjaan-uuid-1')
      expect(result.selesai).toBe(false)
    })
  })

  describe('urutan daftar kerjaan (ambilSemua & ambilBelumSelesai)', () => {
    it('ambilSemua orders by selesai ASC, then deadline ASC', async () => {
      const mockData = [
        { id: '1', judul: 'Kerjaan Aktif 1', selesai: false, deadline: '2026-10-04T00:00:00Z' },
        { id: '2', judul: 'Kerjaan Aktif 2', selesai: false, deadline: '2026-10-05T00:00:00Z' },
        { id: '3', judul: 'Kerjaan Selesai', selesai: true, deadline: '2026-10-01T00:00:00Z' },
      ]

      const order2Mock = vi.fn().mockResolvedValue({ data: mockData, error: null })
      const order1Mock = vi.fn(() => ({ order: order2Mock }))
      const selectMock = vi.fn(() => ({ order: order1Mock }))
      const fromMock = vi.fn(() => ({ select: selectMock }))

      const mockClient = { from: fromMock } as unknown as SupabaseClient

      const items = await ambilSemua(mockClient)

      expect(fromMock).toHaveBeenCalledWith('kerjaan')
      // Urutan pertama: belum selesai di atas (selesai ASC: false < true)
      expect(order1Mock).toHaveBeenCalledWith('selesai', { ascending: true })
      // Urutan kedua: deadline terdekat (deadline ASC)
      expect(order2Mock).toHaveBeenCalledWith('deadline', { ascending: true })
      expect(items).toEqual(mockData)
    })

    it('ambilBelumSelesai filters by selesai = false and orders by deadline ASC', async () => {
      const mockData = [
        { id: '1', judul: 'Kerjaan Aktif 1', selesai: false, deadline: '2026-10-04T00:00:00Z' },
      ]

      const orderMock = vi.fn().mockResolvedValue({ data: mockData, error: null })
      const eqMock = vi.fn(() => ({ order: orderMock }))
      const selectMock = vi.fn(() => ({ eq: eqMock }))
      const fromMock = vi.fn(() => ({ select: selectMock }))

      const mockClient = { from: fromMock } as unknown as SupabaseClient

      const items = await ambilBelumSelesai(mockClient)

      expect(fromMock).toHaveBeenCalledWith('kerjaan')
      expect(eqMock).toHaveBeenCalledWith('selesai', false)
      expect(orderMock).toHaveBeenCalledWith('deadline', { ascending: true })
      expect(items).toEqual(mockData)
    })
  })

  describe('ubah & tandaiSelesai', () => {
    it('throws ValidationError if no update data provided', async () => {
      const mockClient = {} as SupabaseClient
      await expect(ubah('id-1', {}, mockClient)).rejects.toThrow('Tidak ada data yang diperbarui.')
    })

    it('throws NotFoundError if record does not exist on ubah', async () => {
      const maybeSingleMock = vi.fn().mockResolvedValue({ data: null, error: null })
      const eqMock = vi.fn(() => ({ maybeSingle: maybeSingleMock }))
      const selectMock = vi.fn(() => ({ eq: eqMock }))
      const fromMock = vi.fn(() => ({ select: selectMock }))

      const mockClient = { from: fromMock } as unknown as SupabaseClient

      await expect(ubah('not-exist', { judul: 'Baru' }, mockClient)).rejects.toThrow(NotFoundError)
    })

    it('updates fields successfully', async () => {
      const existing = { id: 'kerjaan-1', judul: 'Lama', selesai: false }
      const maybeSingleMock = vi.fn().mockResolvedValue({ data: existing, error: null })

      const updatedItem = { ...existing, selesai: true }
      const singleUpdateMock = vi.fn().mockResolvedValue({ data: updatedItem, error: null })
      const selectUpdateMock = vi.fn(() => ({ single: singleUpdateMock }))
      const eqUpdateMock = vi.fn(() => ({ select: selectUpdateMock }))
      const updateMock = vi.fn(() => ({ eq: eqUpdateMock }))

      const fromMock = vi.fn(() => ({
        select: () => ({ eq: () => ({ maybeSingle: maybeSingleMock }) }),
        update: updateMock,
      }))

      const mockClient = { from: fromMock } as unknown as SupabaseClient

      const res = await tandaiSelesai('kerjaan-1', true, mockClient)
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
