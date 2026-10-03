import type { VercelResponse } from '@vercel/node'
import { withAuth, type AuthenticatedRequest } from '../../server/lib/auth.js'
import {
  ambilSemua,
  tambah,
  ValidationError,
} from '../../server/features/todos/service.js'

export default withAuth(async (req: AuthenticatedRequest, res: VercelResponse) => {
  const method = req.method?.toUpperCase()

  try {
    if (method === 'GET') {
      const data = await ambilSemua()
      res.status(200).json(data)
      return
    }

    if (method === 'POST') {
      const body = req.body || {}
      const data = await tambah(body)
      res.status(201).json(data)
      return
    }

    res.status(405).json({
      error: 'Method Not Allowed',
      message: `Metode ${method} tidak didukung pada endpoint ini. Gunakan GET atau POST.`,
    })
  } catch (err) {
    if (err instanceof ValidationError) {
      res.status(400).json({
        error: 'Bad Request',
        message: err.message,
      })
      return
    }

    const message = err instanceof Error ? err.message : 'Terjadi kesalahan pada server.'
    res.status(500).json({
      error: 'Internal Server Error',
      message,
    })
  }
})
