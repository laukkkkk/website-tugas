import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import type { User } from '@supabase/supabase-js'

vi.mock('../server/lib/supabase.js', () => {
  return {
    supabaseAdmin: {
      auth: {
        getUser: vi.fn(),
      },
    },
    getSupabaseAdmin: vi.fn(),
  }
})

import { supabaseAdmin } from '../server/lib/supabase.js'
import handler from './me.js'

describe('GET /api/me', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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

  it('returns 401 when Authorization header is absent', async () => {
    const { res, statusMock, jsonMock } = createMockRes()
    const req = { headers: {} } as VercelRequest

    await handler(req, res)

    expect(statusMock).toHaveBeenCalledWith(401)
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Unauthorized',
      })
    )
  })

  it('returns 200 and user email & id when valid token is supplied', async () => {
    const mockUser: User = {
      id: 'owner-789',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      email: 'owner@website-tugas.local',
    }

    vi.mocked(supabaseAdmin.auth.getUser).mockResolvedValueOnce({
      data: { user: mockUser },
      error: null,
    })

    const { res, statusMock, jsonMock } = createMockRes()
    const req = {
      headers: { authorization: 'Bearer secret-jwt-token' },
    } as unknown as VercelRequest

    await handler(req, res)

    expect(statusMock).toHaveBeenCalledWith(200)
    expect(jsonMock).toHaveBeenCalledWith({
      id: 'owner-789',
      email: 'owner@website-tugas.local',
    })
  })
})
