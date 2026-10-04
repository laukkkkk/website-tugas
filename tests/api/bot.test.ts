import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Bot } from 'grammy'
import { createOwnerFilter } from '../../server/bot/owner.js'
import { resetBotWebhookHandler } from '../../server/bot/webhook.js'

// Mock getBot dari server/bot/bot.js
const mockNextHandler = vi.fn().mockResolvedValue(undefined)
let testBot: Bot<any>

vi.mock('../../server/bot/bot.js', () => {
  return {
    getBot: () => testBot,
    createBot: () => testBot,
  }
})

import { POST, GET } from '../../api/bot.js'

describe('Telegram Bot Webhook Endpoint (api/bot.ts)', () => {
  const SECRET_TOKEN = 'super-secret-telegram-webhook-token-12345'
  const OWNER_CHAT_ID = '123456789'

  beforeEach(() => {
    vi.clearAllMocks()
    resetBotWebhookHandler()
    process.env.TELEGRAM_WEBHOOK_SECRET = SECRET_TOKEN
    process.env.OWNER_CHAT_ID = OWNER_CHAT_ID

    // Buat bot instance dengan dummy botInfo agar tidak memanggil Telegram network API
    testBot = new Bot('123456:mock_token_abcdef', {
      botInfo: {
        id: 1,
        is_bot: true,
        first_name: 'TestBot',
        username: 'website_tugas_bot',
        can_join_groups: true,
        can_read_all_group_messages: false,
        supports_inline_queries: false,
        can_connect_to_business: false,
        has_main_web_app: false,
      },
    })

    // Pasang owner filter dan dummy handler berikutnya
    testBot.use(createOwnerFilter(OWNER_CHAT_ID))
    testBot.use(mockNextHandler)
  })

  it('mengembalikan 405 Method Not Allowed pada request GET', async () => {
    // 1. Menguji handler GET langsung
    const getRes = await GET()
    expect(getRes.status).toBe(405)
    const getBody = await getRes.json()
    expect(getBody).toEqual({ error: 'Method Not Allowed' })

    // 2. Menguji handler POST jika menerima request dengan method selain POST
    const req = new Request('http://localhost/api/bot', {
      method: 'GET',
    })
    const res = await POST(req)
    expect(res.status).toBe(405)
    const body = await res.json()
    expect(body).toEqual({ error: 'Method Not Allowed' })
  })

  it('mengembalikan 401 Unauthorized jika header secret token tidak ada', async () => {
    const req = new Request('http://localhost/api/bot', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ update_id: 1 }),
    })

    const res = await POST(req)
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toContain('Unauthorized')
  })

  it('mengembalikan 401 Unauthorized jika header secret token salah', async () => {
    const req = new Request('http://localhost/api/bot', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-telegram-bot-api-secret-token': 'token-yang-salah',
      },
      body: JSON.stringify({ update_id: 1 }),
    })

    const res = await POST(req)
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toContain('Unauthorized')
  })

  it('mengabaikan update dari pengirim non-pemilik dan tetap mengembalikan status 200', async () => {
    const nonOwnerUpdate = {
      update_id: 9999,
      message: {
        message_id: 10,
        date: Math.floor(Date.now() / 1000),
        chat: { id: 999999999, type: 'private' },
        from: { id: 999999999, is_bot: false, first_name: 'Stranger' },
        text: '/start',
      },
    }

    const req = new Request('http://localhost/api/bot', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-telegram-bot-api-secret-token': SECRET_TOKEN,
      },
      body: JSON.stringify(nonOwnerUpdate),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)

    // Middleware berikutnya tidak boleh dieksekusi karena update diblokir owner filter
    expect(mockNextHandler).not.toHaveBeenCalled()
  })

  it('memproses update dari pemilik dengan sukses dan mengembalikan status 200', async () => {
    const ownerUpdate = {
      update_id: 1000,
      message: {
        message_id: 11,
        date: Math.floor(Date.now() / 1000),
        chat: { id: 123456789, type: 'private' },
        from: { id: 123456789, is_bot: false, first_name: 'Owner' },
        text: '/list',
      },
    }

    const req = new Request('http://localhost/api/bot', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-telegram-bot-api-secret-token': SECRET_TOKEN,
      },
      body: JSON.stringify(ownerUpdate),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)

    // Middleware berikutnya berhasil dieksekusi untuk pemilik
    expect(mockNextHandler).toHaveBeenCalledTimes(1)
  })

  it('menangkap error internal saat pemrosesan update, mencatat ke log, dan membalas 200 agar Telegram tidak retry', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    // Handler yang sengaja melempar error
    mockNextHandler.mockRejectedValueOnce(new Error('Simulasi database connection timeout'))

    const ownerUpdate = {
      update_id: 1001,
      message: {
        message_id: 12,
        date: Math.floor(Date.now() / 1000),
        chat: { id: 123456789, type: 'private' },
        from: { id: 123456789, is_bot: false, first_name: 'Owner' },
        text: '/tugas',
      },
    }

    const req = new Request('http://localhost/api/bot', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-telegram-bot-api-secret-token': SECRET_TOKEN,
      },
      body: JSON.stringify(ownerUpdate),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[Bot Webhook Error]:',
      expect.stringContaining('Simulasi database connection timeout')
    )

    // Pastikan tidak ada token rahasia yang tercetak di log
    const errorCalls = consoleErrorSpy.mock.calls.flat().join(' ')
    expect(errorCalls).not.toContain(SECRET_TOKEN)
    expect(errorCalls).not.toContain('mock_token_abcdef')

    consoleErrorSpy.mockRestore()
  })
})
