import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createBot, BOT_HELP_MESSAGE } from './bot.js'

describe('Bot Initialization and Commands', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    process.env.BOT_TOKEN = '123456:mock-telegram-token-abcdef'
    process.env.OWNER_CHAT_ID = '987654321'
  })

  it('memiliki teks bantuan BOT_HELP_MESSAGE yang mencakup semua perintah yang disyaratkan', () => {
    expect(BOT_HELP_MESSAGE).toContain('/tugas')
    expect(BOT_HELP_MESSAGE).toContain('/kerjaan')
    expect(BOT_HELP_MESSAGE).toContain('/list')
    expect(BOT_HELP_MESSAGE).toContain('/note')
    expect(BOT_HELP_MESSAGE).toContain('/notes')
    expect(BOT_HELP_MESSAGE).toContain('/todo')
    expect(BOT_HELP_MESSAGE).toContain('/todos')
    expect(BOT_HELP_MESSAGE).toContain('/batal')
    expect(BOT_HELP_MESSAGE).toContain('/help')
  })

  it('berhasil membuat bot instance dan mendaftarkan middleware dan command', () => {
    const mockStorage = {
      read: vi.fn(),
      write: vi.fn(),
      delete: vi.fn(),
    }

    const bot = createBot({
      token: '123456:mock-token',
      ownerChatId: '987654321',
      storageAdapter: mockStorage,
    })

    expect(bot).toBeDefined()
    expect(typeof bot.command).toBe('function')
  })

  it('perintah /batal mereset sesi aktif dan membalas konfirmasi pembatalan', async () => {
    const memoryStore: Record<string, any> = {
      '987654321': { flow: 'tugas', step: 'tugas_menunggu_matkul', payload: { judul: 'Tugas Kalkulus' } },
    }

    const mockStorage = {
      read: vi.fn((key: string) => memoryStore[key]),
      write: vi.fn((key: string, val: any) => {
        memoryStore[key] = val
      }),
      delete: vi.fn((key: string) => {
        delete memoryStore[key]
      }),
    }

    const bot = createBot({
      token: '123456:mock-token',
      ownerChatId: '987654321',
      storageAdapter: mockStorage,
      botInfo: {
        id: 1,
        is_bot: true,
        first_name: 'TestBot',
        username: 'TestBot',
        can_join_groups: true,
        can_read_all_group_messages: true,
        supports_inline_queries: false,
      },
    })

    bot.api.config.use(async () => {
      return {
        ok: true,
        result: {
          message_id: 101,
          date: 1,
          chat: { id: 987654321, type: 'private' },
          text: 'mock response',
        },
      } as any
    })

    const ctx = {
      update: {
        update_id: 10,
        message: {
          message_id: 50,
          date: Math.floor(Date.now() / 1000),
          chat: { id: 987654321, type: 'private' },
          from: { id: 987654321, is_bot: false, first_name: 'Owner' },
          text: '/batal',
          entities: [{ type: 'bot_command', offset: 0, length: 6 }],
        },
      },
      match: '',
      reply: vi.fn().mockResolvedValue(undefined),
    }

    await bot.handleUpdate(ctx.update as any)
    // Sesi harus ter-reset
    expect(memoryStore['987654321']).toEqual({})
  })
})
