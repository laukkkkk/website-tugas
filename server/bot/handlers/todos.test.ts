import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Context, Api } from 'grammy'
import type { BotContext } from '../bot.js'

vi.mock('../../features/todos/service.js', () => {
  return {
    tambah: vi.fn(),
    ambilSemua: vi.fn(),
    ambilById: vi.fn(),
    ceklis: vi.fn(),
    hapus: vi.fn(),
  }
})

import {
  tambah as mockTambahTodo,
  ambilSemua as mockAmbilSemuaTodos,
  ambilById as mockAmbilTodoById,
  ceklis as mockCeklisTodo,
  hapus as mockHapusTodo,
} from '../../features/todos/service.js'
import { todosComposer, renderTodosList } from './todos.js'

function createMessageContext(text: string) {
  const api = new Api('123:mock-token')
  let entities: Array<{ type: string; offset: number; length: number }> | undefined = undefined

  if (text.startsWith('/')) {
    const firstSpace = text.indexOf(' ')
    const cmdLen = firstSpace === -1 ? text.length : firstSpace
    entities = [{ type: 'bot_command', offset: 0, length: cmdLen }]
  }

  const update = {
    update_id: 1,
    message: {
      message_id: 100,
      date: Math.floor(Date.now() / 1000),
      chat: { id: 123456, type: 'private' as const },
      from: { id: 123456, is_bot: false, first_name: 'Owner' },
      text,
      entities,
    },
  }
  const ctx = new Context(update, api, {
    id: 1,
    is_bot: true,
    first_name: 'Bot',
    username: 'TestBot',
  }) as unknown as BotContext
  ctx.session = {}
  ctx.reply = vi.fn().mockResolvedValue(undefined) as any
  return ctx
}

function createCallbackContext(data: string) {
  const api = new Api('123:mock-token')
  const update = {
    update_id: 2,
    callback_query: {
      id: 'cb-1',
      chat_instance: 'instance-1',
      from: { id: 123456, is_bot: false, first_name: 'Owner' },
      message: {
        message_id: 100,
        date: Math.floor(Date.now() / 1000),
        chat: { id: 123456, type: 'private' as const },
        text: 'Previous message',
      },
      data,
    },
  }
  const ctx = new Context(update, api, {
    id: 1,
    is_bot: true,
    first_name: 'Bot',
    username: 'TestBot',
  }) as unknown as BotContext
  ctx.session = {}
  ctx.reply = vi.fn().mockResolvedValue(undefined) as any
  ctx.answerCallbackQuery = vi.fn().mockResolvedValue(undefined) as any
  ctx.editMessageText = vi.fn().mockResolvedValue(undefined) as any
  return ctx
}

describe('Bot Handler Todos (server/bot/handlers/todos.ts)', () => {
  const next = vi.fn().mockResolvedValue(undefined)

  const sampleTodos = [
    {
      id: 'td-1',
      teks: 'Beli tinta printer',
      selesai: false,
      created_at: new Date().toISOString(),
    },
    {
      id: 'td-2',
      teks: 'Baca modul praktikum bab 3',
      selesai: true,
      created_at: new Date().toISOString(),
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Command /todo', () => {
    it('berhasil menambah item to-do baru', async () => {
      vi.mocked(mockTambahTodo).mockResolvedValueOnce({
        id: 'td-new',
        teks: 'Beli kertas A4',
        selesai: false,
        created_at: new Date().toISOString(),
      })

      const ctx = createMessageContext('/todo Beli kertas A4')
      await todosComposer.middleware()(ctx, next)

      expect(mockTambahTodo).toHaveBeenCalledWith({ teks: 'Beli kertas A4' })
      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('✅ To-do berhasil ditambahkan!'),
        expect.anything()
      )
    })

    it('menampilkan petunjuk format jika /todo dipanggil tanpa teks', async () => {
      const ctx = createMessageContext('/todo')
      await todosComposer.middleware()(ctx, next)

      expect(mockTambahTodo).not.toHaveBeenCalled()
      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Format perintah todo:'),
        expect.anything()
      )
    })
  })

  describe('Command /todos dan renderTodosList', () => {
    it('menampilkan pesan belum ada to-do jika kosong', async () => {
      vi.mocked(mockAmbilSemuaTodos).mockResolvedValueOnce([])

      const { text, keyboard } = await renderTodosList()
      expect(text).toContain('Belum ada item to-do tersimpan')
      expect(keyboard).toBeUndefined()
    })

    it('menampilkan daftar to-do dan keyboard checklist + hapus', async () => {
      vi.mocked(mockAmbilSemuaTodos).mockResolvedValueOnce(sampleTodos)

      const ctx = createMessageContext('/todos')
      await todosComposer.middleware()(ctx, next)

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('DAFTAR TO-DO'),
        expect.objectContaining({
          reply_markup: expect.objectContaining({
            inline_keyboard: expect.arrayContaining([
              expect.arrayContaining([
                expect.objectContaining({ text: expect.stringContaining('Beli tinta printer') }),
                expect.objectContaining({ text: '🗑️' }),
              ]),
            ]),
          }),
        })
      )
    })
  })

  describe('Interaksi Inline To-Do', () => {
    it('mengubah status to-do (ceklis/unceklis) saat tombol ditekan', async () => {
      vi.mocked(mockAmbilTodoById).mockResolvedValueOnce(sampleTodos[0]) // selesai: false
      vi.mocked(mockCeklisTodo).mockResolvedValueOnce({ ...sampleTodos[0], selesai: true })
      vi.mocked(mockAmbilSemuaTodos).mockResolvedValueOnce([
        { ...sampleTodos[0], selesai: true },
        sampleTodos[1],
      ])

      const ctx = createCallbackContext('todo:toggle:td-1')
      await todosComposer.middleware()(ctx, next)

      expect(mockCeklisTodo).toHaveBeenCalledWith('td-1', true)
      expect(ctx.answerCallbackQuery).toHaveBeenCalledWith(
        expect.objectContaining({ text: expect.stringContaining('selesai') })
      )
      expect(ctx.editMessageText).toHaveBeenCalledWith(
        expect.stringContaining('DAFTAR TO-DO'),
        expect.anything()
      )
    })

    it('menampilkan konfirmasi hapus saat tombol 🗑️ ditekan', async () => {
      vi.mocked(mockAmbilTodoById).mockResolvedValueOnce(sampleTodos[0])

      const ctx = createCallbackContext('todo:konfirmasi_hapus:td-1')
      await todosComposer.middleware()(ctx, next)

      expect(ctx.editMessageText).toHaveBeenCalledWith(
        expect.stringContaining('Apakah Anda yakin ingin menghapus to-do'),
        expect.objectContaining({
          reply_markup: expect.anything(),
        })
      )
    })

    it('menghapus to-do dan memperbarui daftar saat konfirmasi ya ditekan', async () => {
      vi.mocked(mockHapusTodo).mockResolvedValueOnce(undefined)
      vi.mocked(mockAmbilSemuaTodos).mockResolvedValueOnce([sampleTodos[1]])

      const ctx = createCallbackContext('todo:hapus:td-1')
      await todosComposer.middleware()(ctx, next)

      expect(mockHapusTodo).toHaveBeenCalledWith('td-1')
      expect(ctx.answerCallbackQuery).toHaveBeenCalledWith(
        expect.objectContaining({ text: expect.stringContaining('berhasil dihapus') })
      )
      expect(ctx.editMessageText).toHaveBeenCalledWith(
        expect.stringContaining('Item to-do telah dihapus'),
        expect.anything()
      )
    })

    it('kembali ke daftar to-do saat todo:kembali ditekan', async () => {
      vi.mocked(mockAmbilSemuaTodos).mockResolvedValueOnce(sampleTodos)

      const ctx = createCallbackContext('todo:kembali')
      await todosComposer.middleware()(ctx, next)

      expect(ctx.editMessageText).toHaveBeenCalledWith(
        expect.stringContaining('DAFTAR TO-DO'),
        expect.anything()
      )
    })
  })
})
