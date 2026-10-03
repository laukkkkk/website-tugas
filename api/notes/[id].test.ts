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

vi.mock('../../server/features/notes/service.js', () => {
  class ValidationError extends Error {
    constructor(msg: string) {
      super(msg)
      this.name = 'ValidationError'
    }
  }

  class NotFoundError extends Error {
    constructor(msg: string = 'Catatan tidak ditemukan') {
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
} from '../../server/features/notes/service.js'
import handler from './[id].js'

describe('API /api/notes/[id]', () => {
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

  it('PATCH /api/notes/[id] updates note and returns 200', async () => {
    const updated = { id: 'note-1', judul: 'Catatan Baru' }
    vi.mocked(ubah).mockResolvedValueOnce(updated as any)

    const { res, statusMock, jsonMock } = createMockRes()
    const req = {
      method: 'PATCH',
      headers: { authorization: 'Bearer token-123' },
      query: { id: 'note-1' },
      body: { judul: 'Catatan Baru' },
    } as unknown as VercelRequest

    await handler(req, res)

    expect(statusMock).toHaveBeenCalledWith(200)
    expect(jsonMock).toHaveBeenCalledWith(updated)
    expect(ubah).toHaveBeenCalledWith('note-1', { judul: 'Catatan Baru' })
  })

  it('DELETE /api/notes/[id] deletes note and returns 200', async () => {
    vi.mocked(hapus).mockResolvedValueOnce(undefined)

    const { res, statusMock, jsonMock } = createMockRes()
    const req = {
      method: 'DELETE',
      headers: { authorization: 'Bearer token-123' },
      query: { id: 'note-1' },
    } as unknown as VercelRequest

    await handler(req, res)

    expect(statusMock).toHaveBeenCalledWith(200)
    expect(jsonMock).toHaveBeenCalledWith({
      ok: true,
      message: 'Catatan berhasil dihapus.',
    })
    expect(hapus).toHaveBeenCalledWith('note-1')
  })

  it('PATCH returns 404 when note not found', async () => {
    vi.mocked(ubah).mockRejectedValueOnce(new NotFoundError('Catatan tidak ditemukan.'))

    const { res, statusMock, jsonMock } = createMockRes()
    const req = {
      method: 'PATCH',
      headers: { authorization: 'Bearer token-123' },
      query: { id: 'not-exist' },
      body: { judul: 'Judul' },
    } as unknown as VercelRequest

    await handler(req, res)

    expect(statusMock).toHaveBeenCalledWith(404)
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'Not Found',
      message: 'Catatan tidak ditemukan.',
    })
  })
})
