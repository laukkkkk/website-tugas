import type { Context, MiddlewareFn } from 'grammy'

/**
 * Mengambil ID chat pemilik bot dari environment variable.
 */
export function getOwnerChatId(): string {
  const ownerId = process.env.OWNER_CHAT_ID
  if (!ownerId) {
    throw new Error('OWNER_CHAT_ID belum dikonfigurasi di environment variable.')
  }
  return ownerId.trim()
}

/**
 * Middleware untuk membatasi akses bot hanya kepada pemilik (OWNER_CHAT_ID).
 * Jika pengirim atau chat bukan pemilik, update diabaikan sepenuhnya secara senyap tanpa membalas apa pun.
 */
export function createOwnerFilter(ownerId?: string): MiddlewareFn<Context> {
  return async (ctx, next) => {
    let targetOwnerId: string
    try {
      targetOwnerId = ownerId ?? getOwnerChatId()
    } catch {
      // Jika OWNER_CHAT_ID tidak ada, abaikan semua pesan
      return
    }

    const senderId = ctx.from?.id !== undefined ? String(ctx.from.id) : undefined
    const chatId = ctx.chat?.id !== undefined ? String(ctx.chat.id) : undefined

    // Periksa apakah senderId atau chatId cocok dengan ID pemilik
    const isOwner = senderId === targetOwnerId || chatId === targetOwnerId

    if (!isOwner) {
      // Abaikan update dari pengguna atau obrolan lain tanpa membalas apa pun
      return
    }

    await next()
  }
}
