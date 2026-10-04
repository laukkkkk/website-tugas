import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { SupabaseSessionAdapter } from './session.js'

describe('SupabaseSessionAdapter', () => {
  let mockSupabase: any
  let adapter: SupabaseSessionAdapter<any>

  beforeEach(() => {
    vi.restoreAllMocks()

    mockSupabase = {
      from: vi.fn(),
    }

    adapter = new SupabaseSessionAdapter({
      supabase: mockSupabase as unknown as SupabaseClient,
    })
  })

  it('membaca sesi yang masih aktif (< 30 menit)', async () => {
    const sessionData = { step: 'awaiting_title', payload: { title: 'Tugas Kalkulus' } }
    const recentDate = new Date(Date.now() - 5 * 60 * 1000).toISOString() // 5 menit yang lalu

    const mockSelect = vi.fn().mockReturnThis()
    const mockEq = vi.fn().mockReturnThis()
    const mockMaybeSingle = vi.fn().mockResolvedValue({
      data: { value: sessionData, updated_at: recentDate },
      error: null,
    })

    mockSupabase.from.mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      maybeSingle: mockMaybeSingle,
    })

    const result = await adapter.read('user_123')

    expect(mockSupabase.from).toHaveBeenCalledWith('bot_sessions')
    expect(mockSelect).toHaveBeenCalledWith('value, updated_at')
    expect(mockEq).toHaveBeenCalledWith('key', 'user_123')
    expect(result).toEqual(sessionData)
  })

  it('mereset dan menghapus sesi jika sudah kedaluwarsa (> 30 menit inaktif)', async () => {
    const sessionData = { step: 'awaiting_title' }
    const expiredDate = new Date(Date.now() - 35 * 60 * 1000).toISOString() // 35 menit yang lalu

    const mockSelect = vi.fn().mockReturnThis()
    const mockEq = vi.fn().mockReturnThis()
    const mockMaybeSingle = vi.fn().mockResolvedValue({
      data: { value: sessionData, updated_at: expiredDate },
      error: null,
    })

    const mockDelete = vi.fn().mockReturnThis()
    const mockDeleteEq = vi.fn().mockResolvedValue({ error: null })

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'bot_sessions') {
        return {
          select: mockSelect,
          eq: mockEq,
          maybeSingle: mockMaybeSingle,
          delete: mockDelete.mockReturnValue({ eq: mockDeleteEq }),
        }
      }
      return {}
    })

    const result = await adapter.read('user_123')

    expect(result).toBeUndefined()
    expect(mockDelete).toHaveBeenCalled()
    expect(mockDeleteEq).toHaveBeenCalledWith('key', 'user_123')
  })

  it('mengembalikan undefined jika data tidak ditemukan di tabel', async () => {
    const mockSelect = vi.fn().mockReturnThis()
    const mockEq = vi.fn().mockReturnThis()
    const mockMaybeSingle = vi.fn().mockResolvedValue({
      data: null,
      error: null,
    })

    mockSupabase.from.mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      maybeSingle: mockMaybeSingle,
    })

    const result = await adapter.read('non_existent_key')

    expect(result).toBeUndefined()
  })

  it('menyimpan sesi ke tabel bot_sessions menggunakan upsert', async () => {
    const mockUpsert = vi.fn().mockResolvedValue({ error: null })
    mockSupabase.from.mockReturnValue({ upsert: mockUpsert })

    const sessionData = { step: 'awaiting_deadline' }
    await adapter.write('user_123', sessionData)

    expect(mockSupabase.from).toHaveBeenCalledWith('bot_sessions')
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'user_123',
        value: sessionData,
      }),
      { onConflict: 'key' }
    )
  })

  it('menghapus sesi dari tabel bot_sessions', async () => {
    const mockDelete = vi.fn().mockReturnThis()
    const mockEq = vi.fn().mockResolvedValue({ error: null })

    mockSupabase.from.mockReturnValue({
      delete: mockDelete.mockReturnValue({ eq: mockEq }),
    })

    await adapter.delete('user_123')

    expect(mockSupabase.from).toHaveBeenCalledWith('bot_sessions')
    expect(mockEq).toHaveBeenCalledWith('key', 'user_123')
  })
})
