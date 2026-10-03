import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { VercelRequest, VercelResponse } from '@vercel/node'

vi.mock('../../server/lib/supabase.js', () => ({
  supabaseAdmin: {
    auth: {
      getUser: vi.fn(),
    },
  },
  getSupabaseAdmin: vi.fn(),
}))

vi.mock('../../server/features/todos/service.js', () => {
  class ValidationError extends Error {
    constructor(msg: string) {
      super(msg)
      this.name = 'ValidationError'
    }
  }

  class NotFoundError extends Error {
    constructor(msg: string = 'Item to-do tidak ditemukan') {
      super(msg)
      this.name = 'NotFoundError'
    }
  }

  return {
    ValidationError,
    NotFoundError,
    ubah: vi.fn(),
    hapus: vi.fn(),
  }
})

import { supabaseAdmin } from '../../server/lib/supabase.js'
import {
  ubah,
  hapus,
  ValidationError,
  NotFoundError,
} from '../../server/features/todos/service.js'
import handler from './[id].js'

describe('API /api/todos/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabaseAdmin.auth.getUser).mockResolvedValue({
      data: { user: { id: 'owner-id', email: 'owner@test.com' } as any },
      error: null,
    })
  })

  function createMockRes() {
    const json = vi.fn()
    const status = vi.fn(() => ({ json }))
    return {
      res: { status, json } as unknown as VercelResponse,
      statusMock: status,
      jsonMock: json,
    }
  }

  it('PATCH /api/todos/[id] updates todo and returns 200', async () => {
    const updated = { id: 'todo-1', selesai: true }
    vi.mocked(ubah).mockResolvedValueOnce(updated as any)

    const { res, statusMock, jsonMock } = createMockRes()
    const req = {
      method: 'PATCH',
      headers: { authorization: 'Bearer token-123' },
      query: { id: 'todo-1' },
      body: { selesai: true },
    } as unknown as VercelRequest

    await handler(req, res)

    expect(statusMock).toHaveBeenCalledWith(200)
    expect(jsonMock).toHaveBeenCalledWith(updated)
    expect(ubah).toHaveBeenCalledWith('todo-1', { selesai: true })
  })

  it('DELETE /api/todos/[id] deletes todo and returns 200', async () => {
    vi.mocked(hapus).mockResolvedValueOnce(undefined)

    const { res, statusMock, jsonMock } = createMockRes()
    const req = {
      method: 'DELETE',
      headers: { authorization: 'Bearer token-123' },
      query: { id: 'todo-1' },
    } as unknown as VercelRequest

    await handler(req, res)

    expect(statusMock).toHaveBeenCalledWith(200)
    expect(jsonMock).toHaveBeenCalledWith({
      ok: true,
      message: 'Item to-do berhasil dihapus.',
    })
    expect(hapus).toHaveBeenCalledWith('todo-1')
  })

  it('PATCH returns 404 when todo not found', async () => {
    vi.mocked(ubah).mockRejectedValueOnce(new NotFoundError('Item to-do tidak ditemukan.'))

    const { res, statusMock, jsonMock } = createMockRes()
    const req = {
      method: 'PATCH',
      headers: { authorization: 'Bearer token-123' },
      query: { id: 'not-exist' },
      body: { selesai: true },
    } as unknown as VercelRequest

    await handler(req, res)

    expect(statusMock).toHaveBeenCalledWith(404)
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'Not Found',
      message: 'Item to-do tidak ditemukan.',
    })
  })
})
