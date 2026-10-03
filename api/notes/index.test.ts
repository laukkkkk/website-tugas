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

  return {
    ValidationError,
    ambilSemua: vi.fn(),
    tambah: vi.fn(),
  }
})

import { supabaseAdmin } from '../../server/lib/supabase.js'
import {
  ambilSemua,
  tambah,
  ValidationError,
} from '../../server/features/notes/service.js'
import handler from './index.js'

describe('API /api/notes', () => {
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

  it('GET /api/notes returns list of notes', async () => {
    const mockNotes = [{ id: '1', judul: 'Catatan Kuliah' }]
    vi.mocked(ambilSemua).mockResolvedValueOnce(mockNotes as any)

    const { res, statusMock, jsonMock } = createMockRes()
    const req = {
      method: 'GET',
      headers: { authorization: 'Bearer valid-token' },
    } as unknown as VercelRequest

    await handler(req, res)

    expect(statusMock).toHaveBeenCalledWith(200)
    expect(jsonMock).toHaveBeenCalledWith(mockNotes)
  })

  it('POST /api/notes creates note and returns 201', async () => {
    const created = { id: 'new-note', judul: 'Judul Baru', isi: 'Isi' }
    vi.mocked(tambah).mockResolvedValueOnce(created as any)

    const { res, statusMock, jsonMock } = createMockRes()
    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer valid-token' },
      body: { judul: 'Judul Baru', isi: 'Isi' },
    } as unknown as VercelRequest

    await handler(req, res)

    expect(statusMock).toHaveBeenCalledWith(201)
    expect(jsonMock).toHaveBeenCalledWith(created)
  })

  it('POST /api/notes returns 400 when validation fails', async () => {
    vi.mocked(tambah).mockRejectedValueOnce(new ValidationError('Judul catatan wajib diisi.'))

    const { res, statusMock, jsonMock } = createMockRes()
    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer valid-token' },
      body: {},
    } as unknown as VercelRequest

    await handler(req, res)

    expect(statusMock).toHaveBeenCalledWith(400)
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'Bad Request',
      message: 'Judul catatan wajib diisi.',
    })
  })
})
