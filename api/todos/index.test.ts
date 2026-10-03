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
} from '../../server/features/todos/service.js'
import handler from './index.js'

describe('API /api/todos', () => {
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

  it('GET /api/todos returns list of todos', async () => {
    const mockTodos = [{ id: '1', teks: 'Beli buku', selesai: false }]
    vi.mocked(ambilSemua).mockResolvedValueOnce(mockTodos as any)

    const { res, statusMock, jsonMock } = createMockRes()
    const req = {
      method: 'GET',
      headers: { authorization: 'Bearer valid-token' },
    } as unknown as VercelRequest

    await handler(req, res)

    expect(statusMock).toHaveBeenCalledWith(200)
    expect(jsonMock).toHaveBeenCalledWith(mockTodos)
  })

  it('POST /api/todos creates todo and returns 201', async () => {
    const created = { id: 'new-todo', teks: 'Kerjakan soal', selesai: false }
    vi.mocked(tambah).mockResolvedValueOnce(created as any)

    const { res, statusMock, jsonMock } = createMockRes()
    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer valid-token' },
      body: { teks: 'Kerjakan soal' },
    } as unknown as VercelRequest

    await handler(req, res)

    expect(statusMock).toHaveBeenCalledWith(201)
    expect(jsonMock).toHaveBeenCalledWith(created)
  })

  it('POST /api/todos returns 400 when validation fails', async () => {
    vi.mocked(tambah).mockRejectedValueOnce(new ValidationError('Teks to-do wajib diisi.'))

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
      message: 'Teks to-do wajib diisi.',
    })
  })
})
