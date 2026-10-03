import type { VercelResponse } from '@vercel/node'
import { withAuth, type AuthenticatedRequest } from '../server/lib/auth.js'

export default withAuth(async (_req: AuthenticatedRequest, res: VercelResponse, user) => {
  res.status(200).json({
    id: user.id,
    email: user.email,
  })
})
