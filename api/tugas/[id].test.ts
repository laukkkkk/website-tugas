import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { VercelRequest, VercelResponse } from '@vercel/node'

// Mock supabaseAdmin auth
vi.mock('../../server/lib/supabase.js', () => {
  return {
    supabaseAdmin: {
      auth: {
        getUser: vi.fn(),
      },
    },
    getSupabaseAdmin: vi.fn(),
  }
})

// Mock service
vi.mock('../../server/features/tugas/service.js', () => {
  class ValidationError extends Error {
    constructor(msg: string) {
      super(msg)
      this.name = 'ValidationError'
    }
  }

  class NotFoundError extends Error {
    constructor(msg: string = 'Tugas tidak ditemukan') {
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
} from '../../server/features/tugas/service.js'
import handler from './[id].js'

describe('API /api/tugas/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabaseAdmin.auth.getUser).mockResolvedValue({
      data: {
        user: { id: 'owner-id', email: 'owner@test.com' } as any,
      },
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

  it('PATCH /api/tugas/[id] updates tugas and returns 200', async () => {
    const updated = { id: 'task-123', selesai: true }
    vi.mocked(ubah).mockResolvedValueOnce(updated as any)

    const { res, statusMock, jsonMock } = createMockRes()
    const req = {
      method: 'PATCH',
      headers: { authorization: 'Bearer valid-token' },
      query: { id: 'task-123' },
      body: { selesai: true },
    } as unknown as VercelRequest

    await handler(req, res)

    expect(statusMock).toHaveBeenCalledWith(200)
    expect(jsonMock).toHaveBeenCalledWith(updated)
    expect(ubah).toHaveBeenCalledWith('task-123', { selesai: true })
  })

  it('PATCH returns 404 when item does not exist', async () => {
    vi.mocked(ubah).mockRejectedValueOnce(new NotFoundError('Tugas tidak ditemukan.'))

    const { res, statusMock, jsonMock } = createMockRes()
    const req = {
      method: 'PATCH',
      headers: { authorization: 'Bearer valid-token' },
      query: { id: 'not-found' },
      body: { selesai: true },
    } as unknown as VercelRequest

    await handler(req, res)

    expect(statusMock).toHaveBeenCalledWith(404)
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'Not Found',
      message: 'Tugas tidak ditemukan.',
    })
  })

  it('DELETE /api/tugas/[id] deletes tugas and returns 200', async () => {
    vi.mocked(hapus).mockResolvedValueOnce(undefined)

    const { res, statusMock, jsonMock } = createMockRes()
    const req = {
      method: 'DELETE',
      headers: { authorization: 'Bearer valid-token' },
      query: { id: 'task-123' },
    } as unknown as VercelRequest

    await handler(req, res)

    expect(statusMock).toHaveBeenCalledWith(200)
    expect(jsonMock).toHaveBeenCalledWith({
      ok: true,
      message: 'Tugas berhasil dihapus.',
    })
    expect(hapus).toHaveBeenCalledWith('task-123')
  })

  it('returns 400 when id param is missing', async () => {
    const { res, statusMock, jsonMock } = createMockRes()
    const req = {
      method: 'DELETE',
      headers: { authorization: 'Bearer valid-token' },
      query: {},
    } as unknown as VercelRequest

    await handler(req, res)

    expect(statusMock).toHaveBeenCalledWith(400)
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Bad Request',
      })
    )
  })
})
