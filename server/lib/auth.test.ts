import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import type { User } from '@supabase/supabase-js'

// Mock supabaseAdmin
vi.mock('./supabase.js', () => {
  return {
    supabaseAdmin: {
      auth: {
        getUser: vi.fn(),
      },
    },
    getSupabaseAdmin: vi.fn(),
  }
})

import { supabaseAdmin } from './supabase.js'
import {
  extractBearerToken,
  verifyAuthToken,
  authenticateRequest,
  withAuth,
} from './auth.js'

describe('server/lib/auth.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('extractBearerToken', () => {
    it('returns null when authorization header is missing', () => {
      const req = { headers: {} } as VercelRequest
      expect(extractBearerToken(req)).toBeNull()
    })

    it('returns null when header format is not Bearer', () => {
      const reqBasic = {
        headers: { authorization: 'Basic dXNlcjpwYXNz' },
      } as unknown as VercelRequest
      expect(extractBearerToken(reqBasic)).toBeNull()

      const reqJustBearer = {
        headers: { authorization: 'Bearer' },
      } as unknown as VercelRequest
      expect(extractBearerToken(reqJustBearer)).toBeNull()

      const reqInvalidParts = {
        headers: { authorization: 'Bearer token extra' },
      } as unknown as VercelRequest
      expect(extractBearerToken(reqInvalidParts)).toBeNull()
    })

    it('extracts token correctly with Bearer (case-insensitive)', () => {
      const req1 = {
        headers: { authorization: 'Bearer my-valid-token' },
      } as unknown as VercelRequest
      expect(extractBearerToken(req1)).toBe('my-valid-token')

      const req2 = {
        headers: { authorization: 'bearer lowercase-token' },
      } as unknown as VercelRequest
      expect(extractBearerToken(req2)).toBe('lowercase-token')
    })

    it('handles uppercase Authorization header key and array values', () => {
      const reqArray = {
        headers: { Authorization: ['Bearer array-token'] },
      } as unknown as VercelRequest
      expect(extractBearerToken(reqArray)).toBe('array-token')
    })
  })

  describe('verifyAuthToken & authenticateRequest', () => {
    it('throws error when token is invalid or expired', async () => {
      vi.mocked(supabaseAdmin.auth.getUser).mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Invalid JWT' } as any,
      })

      await expect(verifyAuthToken('invalid-token')).rejects.toThrow('Invalid JWT')
    })

    it('returns user when token is valid', async () => {
      const mockUser: User = {
        id: 'user-123',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        email: 'owner@example.com',
      }

      vi.mocked(supabaseAdmin.auth.getUser).mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      })

      const user = await verifyAuthToken('valid-token')
      expect(user).toEqual(mockUser)
      expect(supabaseAdmin.auth.getUser).toHaveBeenCalledWith('valid-token')
    })

    it('authenticateRequest throws error when header is missing', async () => {
      const req = { headers: {} } as VercelRequest
      await expect(authenticateRequest(req)).rejects.toThrow(
        'Header Authorization tidak ditemukan atau format bukan Bearer <token>'
      )
    })
  })

  describe('withAuth middleware wrapper', () => {
    function createMockRes() {
      const json = vi.fn()
      const status = vi.fn(() => ({ json }))
      return {
        res: { status, json } as unknown as VercelResponse,
        statusMock: status,
        jsonMock: json,
      }
    }

    it('returns 401 when Authorization header is missing', async () => {
      const { res, statusMock, jsonMock } = createMockRes()
      const req = { headers: {} } as VercelRequest
      const handler = vi.fn()

      const wrapped = withAuth(handler)
      await wrapped(req, res)

      expect(statusMock).toHaveBeenCalledWith(401)
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Unauthorized',
          message: expect.stringContaining('Header Authorization tidak ditemukan'),
        })
      )
      expect(handler).not.toHaveBeenCalled()
    })

    it('returns 401 when Authorization header format is invalid', async () => {
      const { res, statusMock, jsonMock } = createMockRes()
      const req = {
        headers: { authorization: 'InvalidScheme 12345' },
      } as unknown as VercelRequest
      const handler = vi.fn()

      const wrapped = withAuth(handler)
      await wrapped(req, res)

      expect(statusMock).toHaveBeenCalledWith(401)
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Unauthorized',
          message: expect.stringContaining('Format header Authorization tidak valid'),
        })
      )
      expect(handler).not.toHaveBeenCalled()
    })

    it('returns 401 when token verification fails (token salah / expired)', async () => {
      vi.mocked(supabaseAdmin.auth.getUser).mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'JWT expired' } as any,
      })

      const { res, statusMock, jsonMock } = createMockRes()
      const req = {
        headers: { authorization: 'Bearer expired-or-wrong-token' },
      } as unknown as VercelRequest
      const handler = vi.fn()

      const wrapped = withAuth(handler)
      await wrapped(req, res)

      expect(statusMock).toHaveBeenCalledWith(401)
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Unauthorized',
          message: 'JWT expired',
        })
      )
      expect(handler).not.toHaveBeenCalled()
    })

    it('calls inner handler with authenticated user when token is valid', async () => {
      const mockUser: User = {
        id: 'owner-uuid-456',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        email: 'admin@tugas.com',
      }

      vi.mocked(supabaseAdmin.auth.getUser).mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      })

      const { res } = createMockRes()
      const req = {
        headers: { authorization: 'Bearer valid-jwt-token' },
      } as unknown as VercelRequest

      const handler = vi.fn((authReq, response, user) => {
        response.status(200).json({ email: user.email })
      })

      const wrapped = withAuth(handler)
      await wrapped(req, res)

      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          user: mockUser,
        }),
        res,
        mockUser
      )
    })
  })
})
