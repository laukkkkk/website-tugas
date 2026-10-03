import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  tambah,
  ambilSemua,
  ambilById,
  ubah,
  hapus,
  ValidationError,
  NotFoundError,
} from './service.js'
import type { SupabaseClient } from '@supabase/supabase-js'

describe('server/features/notes/service.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('tambah', () => {
    it('throws ValidationError if judul is missing or whitespace', async () => {
      const mockClient = {} as SupabaseClient
      await expect(tambah({ judul: '  ' }, mockClient)).rejects.toThrow('Judul catatan wajib diisi.')
    })

    it('inserts note with default empty string isi if not provided', async () => {
      const mockNote = {
        id: 'note-1',
        judul: 'Catatan Kuliah',
        isi: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const singleMock = vi.fn().mockResolvedValue({ data: mockNote, error: null })
      const selectMock = vi.fn(() => ({ single: singleMock }))
      const insertMock = vi.fn(() => ({ select: selectMock }))
      const fromMock = vi.fn(() => ({ insert: insertMock }))

      const mockClient = { from: fromMock } as unknown as SupabaseClient

      const result = await tambah({ judul: '  Catatan Kuliah  ' }, mockClient)

      expect(fromMock).toHaveBeenCalledWith('notes')
      expect(insertMock).toHaveBeenCalledWith({
        judul: 'Catatan Kuliah',
        isi: '',
      })
      expect(result).toEqual(mockNote)
    })
  })

  describe('ambilSemua (urutan updated_at DESC)', () => {
    it('orders by updated_at DESC (terakhir diedit di atas)', async () => {
      const mockData = [
        { id: '1', judul: 'Note Baru Diedit', updated_at: '2026-10-03T10:00:00Z' },
        { id: '2', judul: 'Note Lama', updated_at: '2026-10-01T10:00:00Z' },
      ]

      const orderMock = vi.fn().mockResolvedValue({ data: mockData, error: null })
      const selectMock = vi.fn(() => ({ order: orderMock }))
      const fromMock = vi.fn(() => ({ select: selectMock }))

      const mockClient = { from: fromMock } as unknown as SupabaseClient

      const res = await ambilSemua(mockClient)

      expect(fromMock).toHaveBeenCalledWith('notes')
      expect(orderMock).toHaveBeenCalledWith('updated_at', { ascending: false })
      expect(res).toEqual(mockData)
    })
  })

  describe('ubah', () => {
    it('throws ValidationError when no data provided to ubah', async () => {
      const mockClient = {} as SupabaseClient
      await expect(ubah('id-1', {}, mockClient)).rejects.toThrow('Tidak ada data yang diperbarui.')
    })

    it('throws NotFoundError when note does not exist', async () => {
      const maybeSingleMock = vi.fn().mockResolvedValue({ data: null, error: null })
      const eqMock = vi.fn(() => ({ maybeSingle: maybeSingleMock }))
      const selectMock = vi.fn(() => ({ eq: eqMock }))
      const fromMock = vi.fn(() => ({ select: selectMock }))

      const mockClient = { from: fromMock } as unknown as SupabaseClient

      await expect(ubah('non-existent', { judul: 'Baru' }, mockClient)).rejects.toThrow(NotFoundError)
    })

    it('updates updated_at timestamp when updating note', async () => {
      const existing = { id: 'note-1', judul: 'Lama', isi: 'Lama' }
      const maybeSingleMock = vi.fn().mockResolvedValue({ data: existing, error: null })

      const updated = { ...existing, judul: 'Judul Baru', updated_at: new Date().toISOString() }
      const singleUpdateMock = vi.fn().mockResolvedValue({ data: updated, error: null })
      const selectUpdateMock = vi.fn(() => ({ single: singleUpdateMock }))
      const eqUpdateMock = vi.fn(() => ({ select: selectUpdateMock }))
      const updateMock = vi.fn(() => ({ eq: eqUpdateMock }))

      const fromMock = vi.fn(() => ({
        select: () => ({ eq: () => ({ maybeSingle: maybeSingleMock }) }),
        update: updateMock,
      }))

      const mockClient = { from: fromMock } as unknown as SupabaseClient

      const res = await ubah('note-1', { judul: 'Judul Baru' }, mockClient)

      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          judul: 'Judul Baru',
          updated_at: expect.any(String),
        })
      )
      expect(res.judul).toBe('Judul Baru')
    })
  })

  describe('hapus', () => {
    it('throws NotFoundError when deleting non-existent note', async () => {
      const maybeSingleMock = vi.fn().mockResolvedValue({ data: null, error: null })
      const fromMock = vi.fn(() => ({
        select: () => ({ eq: () => ({ maybeSingle: maybeSingleMock }) }),
      }))
      const mockClient = { from: fromMock } as unknown as SupabaseClient

      await expect(hapus('not-found', mockClient)).rejects.toThrow(NotFoundError)
    })

    it('deletes note successfully when it exists', async () => {
      const existing = { id: 'note-1' }
      const maybeSingleMock = vi.fn().mockResolvedValue({ data: existing, error: null })
      const deleteMock = vi.fn().mockResolvedValue({ error: null })

      const fromMock = vi.fn(() => ({
        select: () => ({ eq: () => ({ maybeSingle: maybeSingleMock }) }),
        delete: () => ({ eq: deleteMock }),
      }))
      const mockClient = { from: fromMock } as unknown as SupabaseClient

      await expect(hapus('note-1', mockClient)).resolves.toBeUndefined()
    })
  })
})
