import { describe, it, expect, vi } from 'vitest'
import handler from './health'
import type { VercelRequest, VercelResponse } from '@vercel/node'

describe('GET /api/health', () => {
  it('returns status 200 and { ok: true }', () => {
    const jsonMock = vi.fn()
    const statusMock = vi.fn(() => ({ json: jsonMock }))

    const req = {} as VercelRequest
    const res = {
      status: statusMock,
    } as unknown as VercelResponse

    handler(req, res)

    expect(statusMock).toHaveBeenCalledWith(200)
    expect(jsonMock).toHaveBeenCalledWith({ ok: true })
  })
})
