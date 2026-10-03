import type { VercelResponse } from '@vercel/node'
import { withAuth, type AuthenticatedRequest } from '../../server/lib/auth.js'
import {
  ubah,
  hapus,
  ValidationError,
  NotFoundError,
} from '../../server/features/notes/service.js'

export default withAuth(async (req: AuthenticatedRequest, res: VercelResponse) => {
  const method = req.method?.toUpperCase()
  const rawId = req.query.id
  const id = Array.isArray(rawId) ? rawId[0] : rawId

  if (!id || typeof id !== 'string') {
    res.status(400).json({
      error: 'Bad Request',
      message: 'Parameter ID catatan tidak valid.',
    })
    return
  }

  try {
    if (method === 'PATCH') {
      const body = req.body || {}
      const updated = await ubah(id, body)
      res.status(200).json(updated)
      return
    }

    if (method === 'DELETE') {
      await hapus(id)
      res.status(200).json({
        ok: true,
        message: 'Catatan berhasil dihapus.',
      })
      return
    }

    res.status(405).json({
      error: 'Method Not Allowed',
      message: `Metode ${method} tidak didukung pada endpoint ini. Gunakan PATCH atau DELETE.`,
    })
  } catch (err) {
    if (err instanceof ValidationError) {
      res.status(400).json({
        error: 'Bad Request',
        message: err.message,
      })
      return
    }

    if (err instanceof NotFoundError) {
      res.status(404).json({
        error: 'Not Found',
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
