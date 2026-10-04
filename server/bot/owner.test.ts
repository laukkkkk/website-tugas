import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Context } from 'grammy'
import { createOwnerFilter } from './owner.js'

describe('Owner Authorization Middleware', () => {
  const OWNER_ID = '123456789'

  beforeEach(() => {
    vi.restoreAllMocks()
    delete process.env.OWNER_CHAT_ID
  })

  it('memproses update jika pengirim (ctx.from.id) adalah pemilik', async () => {
    const middleware = createOwnerFilter(OWNER_ID)
    const ctx = {
      from: { id: 123456789 },
      chat: { id: 987654321 },
    } as unknown as Context

    const next = vi.fn().mockResolvedValue(undefined)

    await middleware(ctx, next)

    expect(next).toHaveBeenCalledTimes(1)
  })

  it('memproses update jika chat (ctx.chat.id) adalah pemilik', async () => {
    const middleware = createOwnerFilter(OWNER_ID)
    const ctx = {
      from: { id: 987654321 },
      chat: { id: 123456789 },
    } as unknown as Context

    const next = vi.fn().mockResolvedValue(undefined)

    await middleware(ctx, next)

    expect(next).toHaveBeenCalledTimes(1)
  })

  it('mengabaikan update secara senyap jika bukan pemilik', async () => {
    const middleware = createOwnerFilter(OWNER_ID)
    const ctx = {
      from: { id: 999999999 },
      chat: { id: 888888888 },
      reply: vi.fn(),
    } as unknown as Context

    const next = vi.fn().mockResolvedValue(undefined)

    await middleware(ctx, next)

    // next() tidak boleh dipanggil dan bot tidak boleh membalas apa pun
    expect(next).not.toHaveBeenCalled()
    expect(ctx.reply).not.toHaveBeenCalled()
  })

  it('mengabaikan update jika ctx.from dan ctx.chat tidak ada', async () => {
    const middleware = createOwnerFilter(OWNER_ID)
    const ctx = {} as unknown as Context

    const next = vi.fn().mockResolvedValue(undefined)

    await middleware(ctx, next)

    expect(next).not.toHaveBeenCalled()
  })

  it('mengabaikan update jika OWNER_CHAT_ID tidak dikonfigurasi', async () => {
    const middleware = createOwnerFilter()
    const ctx = {
      from: { id: 123456789 },
      chat: { id: 123456789 },
    } as unknown as Context

    const next = vi.fn().mockResolvedValue(undefined)

    await middleware(ctx, next)

    expect(next).not.toHaveBeenCalled()
  })

  it('membaca OWNER_CHAT_ID dari process.env jika parameter tidak diberikan', async () => {
    process.env.OWNER_CHAT_ID = OWNER_ID
    const middleware = createOwnerFilter()

    const ctx = {
      from: { id: 123456789 },
      chat: { id: 123456789 },
    } as unknown as Context

    const next = vi.fn().mockResolvedValue(undefined)

    await middleware(ctx, next)

    expect(next).toHaveBeenCalledTimes(1)
  })
})
