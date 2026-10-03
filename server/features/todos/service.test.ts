import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  tambah,
  ambilSemua,
  ambilById,
  ubah,
  ceklis,
  hapus,
  ValidationError,
  NotFoundError,
} from './service.js'
import type { SupabaseClient } from '@supabase/supabase-js'

describe('server/features/todos/service.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('tambah', () => {
    it('throws ValidationError when teks is missing or whitespace', async () => {
      const mockClient = {} as SupabaseClient
      await expect(tambah({ teks: '   ' }, mockClient)).rejects.toThrow('Teks to-do wajib diisi.')
    })

    it('inserts todo with default selesai = false', async () => {
      const mockTodo = {
        id: 'todo-1',
        teks: 'Beli buku tulis',
        selesai: false,
        created_at: new Date().toISOString(),
      }

      const singleMock = vi.fn().mockResolvedValue({ data: mockTodo, error: null })
      const selectMock = vi.fn(() => ({ single: singleMock }))
      const insertMock = vi.fn(() => ({ select: selectMock }))
      const fromMock = vi.fn(() => ({ insert: insertMock }))

      const mockClient = { from: fromMock } as unknown as SupabaseClient

      const result = await tambah({ teks: '  Beli buku tulis  ' }, mockClient)

      expect(fromMock).toHaveBeenCalledWith('todos')
      expect(insertMock).toHaveBeenCalledWith({
        teks: 'Beli buku tulis',
        selesai: false,
      })
      expect(result).toEqual(mockTodo)
    })
  })

  describe('ambilSemua (urutan belum selesai di atas)', () => {
    it('orders by selesai ASC, then created_at DESC', async () => {
      const mockData = [
        { id: '1', teks: 'Todo belum selesai', selesai: false, created_at: '2026-10-02T10:00:00Z' },
        { id: '2', teks: 'Todo sudah selesai', selesai: true, created_at: '2026-10-01T10:00:00Z' },
      ]

      const order2Mock = vi.fn().mockResolvedValue({ data: mockData, error: null })
      const order1Mock = vi.fn(() => ({ order: order2Mock }))
      const selectMock = vi.fn(() => ({ order: order1Mock }))
      const fromMock = vi.fn(() => ({ select: selectMock }))

      const mockClient = { from: fromMock } as unknown as SupabaseClient

      const res = await ambilSemua(mockClient)

      expect(fromMock).toHaveBeenCalledWith('todos')
      expect(order1Mock).toHaveBeenCalledWith('selesai', { ascending: true })
      expect(order2Mock).toHaveBeenCalledWith('created_at', { ascending: false })
      expect(res).toEqual(mockData)
    })
  })

  describe('ceklis & ubah', () => {
    it('throws ValidationError when no data provided to ubah', async () => {
      const mockClient = {} as SupabaseClient
      await expect(ubah('id-1', {}, mockClient)).rejects.toThrow('Tidak ada data yang diperbarui.')
    })

    it('throws NotFoundError when todo does not exist', async () => {
      const maybeSingleMock = vi.fn().mockResolvedValue({ data: null, error: null })
      const eqMock = vi.fn(() => ({ maybeSingle: maybeSingleMock }))
      const selectMock = vi.fn(() => ({ eq: eqMock }))
      const fromMock = vi.fn(() => ({ select: selectMock }))

      const mockClient = { from: fromMock } as unknown as SupabaseClient

      await expect(ceklis('non-existent', true, mockClient)).rejects.toThrow(NotFoundError)
    })

    it('toggles selesai flag via ceklis', async () => {
      const existing = { id: 'todo-1', teks: 'Item', selesai: false }
      const maybeSingleMock = vi.fn().mockResolvedValue({ data: existing, error: null })

      const updated = { ...existing, selesai: true }
      const singleUpdateMock = vi.fn().mockResolvedValue({ data: updated, error: null })
      const selectUpdateMock = vi.fn(() => ({ single: singleUpdateMock }))
      const eqUpdateMock = vi.fn(() => ({ select: selectUpdateMock }))
      const updateMock = vi.fn(() => ({ eq: eqUpdateMock }))

      const fromMock = vi.fn(() => ({
        select: () => ({ eq: () => ({ maybeSingle: maybeSingleMock }) }),
        update: updateMock,
      }))

      const mockClient = { from: fromMock } as unknown as SupabaseClient

      const res = await ceklis('todo-1', true, mockClient)

      expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({ selesai: true }))
      expect(res.selesai).toBe(true)
    })
  })

  describe('hapus', () => {
    it('throws NotFoundError when deleting non-existent todo', async () => {
      const maybeSingleMock = vi.fn().mockResolvedValue({ data: null, error: null })
      const fromMock = vi.fn(() => ({
        select: () => ({ eq: () => ({ maybeSingle: maybeSingleMock }) }),
      }))
      const mockClient = { from: fromMock } as unknown as SupabaseClient

      await expect(hapus('not-found', mockClient)).rejects.toThrow(NotFoundError)
    })

    it('deletes todo successfully when it exists', async () => {
      const existing = { id: 'todo-1' }
      const maybeSingleMock = vi.fn().mockResolvedValue({ data: existing, error: null })
      const deleteMock = vi.fn().mockResolvedValue({ error: null })

      const fromMock = vi.fn(() => ({
        select: () => ({ eq: () => ({ maybeSingle: maybeSingleMock }) }),
        delete: () => ({ eq: deleteMock }),
      }))
      const mockClient = { from: fromMock } as unknown as SupabaseClient

      await expect(hapus('todo-1', mockClient)).resolves.toBeUndefined()
    })
  })
})
