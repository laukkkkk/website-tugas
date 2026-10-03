import type { VercelRequest, VercelResponse } from '@vercel/node'
import type { User } from '@supabase/supabase-js'
import { supabaseAdmin } from './supabase.js'

export interface AuthenticatedRequest extends VercelRequest {
  user: User
}

export type AuthenticatedHandler = (
  req: AuthenticatedRequest,
  res: VercelResponse,
  user: User
) => Promise<void | unknown> | void | unknown

/**
 * Mengambil Bearer token dari header Authorization request.
 */
export function extractBearerToken(req: VercelRequest): string | null {
  const authHeader = req.headers?.authorization || req.headers?.Authorization
  const headerValue = Array.isArray(authHeader) ? authHeader[0] : authHeader

  if (!headerValue || typeof headerValue !== 'string') {
    return null
  }

  const parts = headerValue.trim().split(/\s+/)
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return null
  }

  return parts[1] || null
}

/**
 * Memverifikasi token JWT Supabase menggunakan Supabase Admin Client.
 * Melempar Error jika token tidak valid atau kedaluwarsa.
 */
export async function verifyAuthToken(token: string): Promise<User> {
  const { data, error } = await supabaseAdmin.auth.getUser(token)

  if (error || !data.user) {
    throw new Error(error?.message || 'Token tidak valid atau kedaluwarsa')
  }

  return data.user
}

/**
 * Memverifikasi request yang masuk. Jika gagal, melempar error dengan pesan yang sesuai.
 */
export async function authenticateRequest(req: VercelRequest): Promise<User> {
  const token = extractBearerToken(req)
  if (!token) {
    throw new Error('Header Authorization tidak ditemukan atau format bukan Bearer <token>')
  }

  return await verifyAuthToken(token)
}

/**
 * Helper Higher-Order Function untuk membungkus endpoint serverless Vercel.
 * Melindungi endpoint agar hanya dapat diakses oleh pengguna yang terautentikasi.
 *
 * Mengembalikan:
 * - 401 jika header Authorization tidak ada, format salah, atau token invalid.
 * - Handler dieksekusi dengan `req.user` dan parameter `user` jika valid.
 */
export function withAuth(handler: AuthenticatedHandler) {
  return async (req: VercelRequest, res: VercelResponse): Promise<void> => {
    try {
      const authHeader = req.headers?.authorization || req.headers?.Authorization
      const headerValue = Array.isArray(authHeader) ? authHeader[0] : authHeader

      if (!headerValue) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Header Authorization tidak ditemukan.',
        })
        return
      }

      const token = extractBearerToken(req)
      if (!token) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Format header Authorization tidak valid. Gunakan: Bearer <token>',
        })
        return
      }

      const user = await verifyAuthToken(token)

      // Pasang user ke req dan panggil handler
      const authReq = req as AuthenticatedRequest
      authReq.user = user

      await handler(authReq, res, user)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Autentikasi gagal.'
      res.status(401).json({
        error: 'Unauthorized',
        message,
      })
    }
  }
}
