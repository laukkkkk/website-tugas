import { Bot, session, type Context, type SessionFlavor, type StorageAdapter } from 'grammy'
import { createOwnerFilter } from './owner.js'
import { SupabaseSessionAdapter } from './session.js'
import { tugasComposer } from './handlers/tugas.js'
import { kerjaanComposer } from './handlers/kerjaan.js'
import { listComposer } from './handlers/list.js'
import { notesComposer } from './handlers/notes.js'
import { todosComposer } from './handlers/todos.js'

/**
 * Data sesi yang disimpan untuk alur percakapan bot.
 */
export interface BotSessionData {
  step?: string
  payload?: Record<string, any>
  [key: string]: any
}

/**
 * Context grammY dengan integrasi session flavor.
 */
export type BotContext = Context & SessionFlavor<BotSessionData>

/**
 * Mengambil BOT_TOKEN dari environment variable.
 */
export function getBotToken(): string {
  const token = process.env.BOT_TOKEN
  if (!token) {
    throw new Error('BOT_TOKEN belum dikonfigurasi di environment variable.')
  }
  return token.trim()
}

/**
 * Teks penjelasan semua perintah bot yang didukung.
 */
export const BOT_HELP_MESSAGE = `Halo! Saya bot asisten pengingat tugas dan kerjaan pribadi Anda.

Berikut daftar perintah yang tersedia:
📋 /tugas - Tambah tugas kuliah baru (alur bertahap)
💼 /kerjaan - Tambah kerjaan atau proyek baru (alur bertahap)
📜 /list - Lihat daftar tugas & kerjaan yang belum selesai
📝 /note - Tambah catatan (cukup ketik isinya)
📑 /notes - Lihat daftar catatan tersimpan
☑️ /todo - Tambah to-do item baru
📋 /todos - Lihat dan kelola daftar to-do
❌ /batal - Batalkan input percakapan yang sedang berjalan
ℹ️ /help - Tampilkan pesan bantuan ini`

export interface CreateBotOptions {
  token?: string
  ownerChatId?: string
  storageAdapter?: StorageAdapter<BotSessionData>
  botInfo?: any
}

/**
 * Membuat dan mengonfigurasi instance bot grammY.
 */
export function createBot(options?: CreateBotOptions): Bot<BotContext> {
  const token = options?.token ?? getBotToken()
  const bot = new Bot<BotContext>(token, options?.botInfo ? { botInfo: options.botInfo } : undefined)

  // 1. Middleware awal: Kunci pemilik (hanya tanggapi OWNER_CHAT_ID)
  bot.use(createOwnerFilter(options?.ownerChatId))

  // 2. Middleware sesi: Menggunakan SupabaseSessionAdapter (tabel bot_sessions, TTL 30 menit)
  const storage = options?.storageAdapter ?? new SupabaseSessionAdapter<BotSessionData>()
  bot.use(
    session({
      initial: (): BotSessionData => ({}),
      storage,
      getSessionKey: (ctx) => {
        // Ikat sesi berdasarkan ID obrolan / pengirim
        if (ctx.chat?.id !== undefined) return String(ctx.chat.id)
        if (ctx.from?.id !== undefined) return String(ctx.from.id)
        return undefined
      },
    })
  )

  // 3. Command /start dan /help
  bot.command('start', async (ctx) => {
    await ctx.reply(BOT_HELP_MESSAGE)
  })

  bot.command('help', async (ctx) => {
    await ctx.reply(BOT_HELP_MESSAGE)
  })

  // 4. Command /batal (mereset state sesi aktif)
  bot.command('batal', async (ctx) => {
    ctx.session = {}
    await ctx.reply('✅ Percakapan atau aksi sebelumnya telah dibatalkan.')
  })

  // 5. Daftarkan handler fitur tugas, kerjaan, list, notes, dan todos
  bot.use(tugasComposer)
  bot.use(kerjaanComposer)
  bot.use(listComposer)
  bot.use(notesComposer)
  bot.use(todosComposer)

  return bot
}

let _botInstance: Bot<BotContext> | null = null

/**
 * Mengambil instance bot singleton untuk runtime backend serverless.
 */
export function getBot(): Bot<BotContext> {
  if (!_botInstance) {
    _botInstance = createBot()
  }
  return _botInstance
}
