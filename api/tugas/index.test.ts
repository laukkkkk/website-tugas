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

  return {
    ValidationError,
    ambilSemua: vi.fn(),
    ambilBelumSelesai: vi.fn(),
    tambah: vi.fn(),
  }
})

import { supabaseAdmin } from '../../server/lib/supabase.js'
import {
  ambilSemua,
  ambilBelumSelesai,
  tambah,
  ValidationError,
} from '../../server/features/tugas/service.js'
import handler from './index.js'

describe('API /api/tugas', () => {
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

  it('GET /api/tugas calls ambilSemua and returns 200', async () => {
    const mockTugasList = [{ id: '1', judul: 'Tugas 1' }]
    vi.mocked(ambilSemua).mockResolvedValueOnce(mockTugasList as any)

    const { res, statusMock, jsonMock } = createMockRes()
    const req = {
      method: 'GET',
      headers: { authorization: 'Bearer token-123' },
      query: {},
    } as unknown as VercelRequest

    await handler(req, res)

    expect(statusMock).toHaveBeenCalledWith(200)
    expect(jsonMock).toHaveBeenCalledWith(mockTugasList)
    expect(ambilSemua).toHaveBeenCalledTimes(1)
  })

  it('GET /api/tugas?belum_selesai=true calls ambilBelumSelesai', async () => {
    const mockActive = [{ id: '1', judul: 'Tugas Belum Selesai', selesai: false }]
    vi.mocked(ambilBelumSelesai).mockResolvedValueOnce(mockActive as any)

    const { res, statusMock, jsonMock } = createMockRes()
    const req = {
      method: 'GET',
      headers: { authorization: 'Bearer token-123' },
      query: { belum_selesai: 'true' },
    } as unknown as VercelRequest

    await handler(req, res)

    expect(statusMock).toHaveBeenCalledWith(200)
    expect(jsonMock).toHaveBeenCalledWith(mockActive)
    expect(ambilBelumSelesai).toHaveBeenCalledTimes(1)
  })

  it('POST /api/tugas creates item and returns 201', async () => {
    const created = { id: 'new-id', judul: 'Tugas Baru' }
    vi.mocked(tambah).mockResolvedValueOnce(created as any)

    const { res, statusMock, jsonMock } = createMockRes()
    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer token-123' },
      body: {
        judul: 'Tugas Baru',
        matkul: 'Kripto',
        tipe: 'individu',
        deadline: '2026-10-10',
      },
    } as unknown as VercelRequest

    await handler(req, res)

    expect(statusMock).toHaveBeenCalledWith(201)
    expect(jsonMock).toHaveBeenCalledWith(created)
  })

  it('POST /api/tugas returns 400 when service throws ValidationError', async () => {
    vi.mocked(tambah).mockRejectedValueOnce(new ValidationError('Judul tugas wajib diisi.'))

    const { res, statusMock, jsonMock } = createMockRes()
    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer token-123' },
      body: {},
    } as unknown as VercelRequest

    await handler(req, res)

    expect(statusMock).toHaveBeenCalledWith(400)
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'Bad Request',
      message: 'Judul tugas wajib diisi.',
    })
  })

  it('returns 405 for unsupported method (e.g. PUT)', async () => {
    const { res, statusMock, jsonMock } = createMockRes()
    const req = {
      method: 'PUT',
      headers: { authorization: 'Bearer token-123' },
    } as unknown as VercelRequest

    await handler(req, res)

    expect(statusMock).toHaveBeenCalledWith(405)
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Method Not Allowed',
      })
    )
  })
})
