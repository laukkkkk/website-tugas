import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const mockWebhookCallbackHandler = vi.fn().mockImplementation((_req, res) => {
  return res.status(200).send('OK')
})

vi.mock('grammy', () => {
  return {
    webhookCallback: vi.fn(() => mockWebhookCallbackHandler),
    Bot: vi.fn().mockImplementation(() => ({
      use: vi.fn(),
      command: vi.fn(),
      api: {
        deleteWebhook: vi.fn(),
      },
    })),
    session: vi.fn(),
  }
})

vi.mock('../server/bot/bot.js', () => {
  return {
    getBot: vi.fn().mockReturnValue({}),
    createBot: vi.fn().mockReturnValue({}),
  }
})

import handler from './bot.js'

describe('Telegram Bot Webhook Endpoint (api/bot.ts)', () => {
  const SECRET_TOKEN = 'super-secret-telegram-webhook-token-12345'

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.TELEGRAM_WEBHOOK_SECRET = SECRET_TOKEN
  })

  function createMockRes() {
    const json = vi.fn()
    const send = vi.fn()
    const status = vi.fn(() => ({ json, send }))
    return {
      res: { status, json, send } as unknown as VercelResponse,
      statusMock: status,
      jsonMock: json,
      sendMock: send,
    }
  }

  it('mengembalikan 405 Method Not Allowed jika method bukan POST', async () => {
    const { res, statusMock, jsonMock } = createMockRes()
    const req = {
      method: 'GET',
      headers: {},
    } as unknown as VercelRequest

    await handler(req, res)

    expect(statusMock).toHaveBeenCalledWith(405)
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Method Not Allowed' })
  })

  it('mengembalikan 401 Unauthorized jika header secret token tidak ada', async () => {
    const { res, statusMock, jsonMock } = createMockRes()
    const req = {
      method: 'POST',
      headers: {},
    } as unknown as VercelRequest

    await handler(req, res)

    expect(statusMock).toHaveBeenCalledWith(401)
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.stringContaining('Unauthorized'),
      })
    )
  })

  it('mengembalikan 401 Unauthorized jika header secret token salah', async () => {
    const { res, statusMock, jsonMock } = createMockRes()
    const req = {
      method: 'POST',
      headers: {
        'x-telegram-bot-api-secret-token': 'wrong-token-abc',
      },
    } as unknown as VercelRequest

    await handler(req, res)

    expect(statusMock).toHaveBeenCalledWith(401)
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.stringContaining('Unauthorized'),
      })
    )
  })

  it('meneruskan ke webhookCallback grammY jika secret token cocok', async () => {
    const { res } = createMockRes()
    const req = {
      method: 'POST',
      headers: {
        'x-telegram-bot-api-secret-token': SECRET_TOKEN,
      },
    } as unknown as VercelRequest

    await handler(req, res)

    expect(mockWebhookCallbackHandler).toHaveBeenCalledWith(req, res)
  })
})
