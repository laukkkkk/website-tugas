import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Context, Api } from 'grammy'
import type { BotContext } from '../bot.js'

vi.mock('../../features/notes/service.js', () => {
  return {
    tambah: vi.fn(),
    ambilSemua: vi.fn(),
    ambilById: vi.fn(),
    hapus: vi.fn(),
  }
})

import {
  tambah as mockTambahNote,
  ambilSemua as mockAmbilSemuaNotes,
  ambilById as mockAmbilNoteById,
  hapus as mockHapusNote,
} from '../../features/notes/service.js'
import { notesComposer, renderNotesList } from './notes.js'

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

describe('Bot Handler Notes (server/bot/handlers/notes.ts)', () => {
  const next = vi.fn().mockResolvedValue(undefined)

  const sampleNotes = [
    {
      id: 'n-1',
      judul: 'Rangkuman Bab 1',
      isi: 'Isi rangkuman arsitektur von neumann',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'n-2',
      judul: 'Ide Tugas Akhir',
      isi: 'Aplikasi reminder satu pengguna terintegrasi bot telegram',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Command /note', () => {
    it('berhasil menyimpan catatan baru dengan format judul | isi', async () => {
      vi.mocked(mockTambahNote).mockResolvedValueOnce({
        id: 'n-new',
        judul: 'Rangkuman Bab 1',
        isi: 'Poin penting arsitektur komputer',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      const ctx = createMessageContext(
        '/note Rangkuman Bab 1 | Poin penting arsitektur komputer'
      )
      await notesComposer.middleware()(ctx, next)

      expect(mockTambahNote).toHaveBeenCalledWith({
        judul: 'Rangkuman Bab 1',
        isi: 'Poin penting arsitektur komputer',
      })
      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('✅ Catatan berhasil disimpan!'),
        expect.anything()
      )
    })

    it('menampilkan petunjuk format jika argumen tidak diberikan atau kurang dari 2 bagian', async () => {
      const ctx1 = createMessageContext('/note')
      await notesComposer.middleware()(ctx1, next)
      expect(mockTambahNote).not.toHaveBeenCalled()
      expect(ctx1.reply).toHaveBeenCalledWith(
        expect.stringContaining('Format perintah note:'),
        expect.anything()
      )

      const ctx2 = createMessageContext('/note Hanya Judul Tanpa Pipe')
      await notesComposer.middleware()(ctx2, next)
      expect(mockTambahNote).not.toHaveBeenCalled()
      expect(ctx2.reply).toHaveBeenCalledWith(
        expect.stringContaining('❌ Format note salah'),
        expect.anything()
      )
    })
  })

  describe('Command /notes dan renderNotesList', () => {
    it('menampilkan pesan belum ada catatan jika kosong', async () => {
      vi.mocked(mockAmbilSemuaNotes).mockResolvedValueOnce([])

      const { text, keyboard } = await renderNotesList()
      expect(text).toContain('Belum ada catatan tersimpan')
      expect(keyboard).toBeUndefined()
    })

    it('menampilkan daftar catatan dan tombol inline per catatan', async () => {
      vi.mocked(mockAmbilSemuaNotes).mockResolvedValueOnce(sampleNotes)

      const ctx = createMessageContext('/notes')
      await notesComposer.middleware()(ctx, next)

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('DAFTAR CATATAN TERSIMPAN'),
        expect.objectContaining({
          reply_markup: expect.objectContaining({
            inline_keyboard: expect.arrayContaining([
              expect.arrayContaining([expect.objectContaining({ text: expect.stringContaining('Rangkuman Bab 1') })]),
            ]),
          }),
        })
      )
    })
  })

  describe('Interaksi Inline Catatan', () => {
    it('menampilkan detail isi catatan saat note:baca:<id> ditekan', async () => {
      vi.mocked(mockAmbilNoteById).mockResolvedValueOnce(sampleNotes[0])

      const ctx = createCallbackContext('note:baca:n-1')
      await notesComposer.middleware()(ctx, next)

      expect(mockAmbilNoteById).toHaveBeenCalledWith('n-1')
      expect(ctx.editMessageText).toHaveBeenCalledWith(
        expect.stringContaining('Isi rangkuman arsitektur von neumann'),
        expect.objectContaining({
          reply_markup: expect.anything(),
        })
      )
    })

    it('menampilkan konfirmasi hapus saat tombol hapus ditekan', async () => {
      vi.mocked(mockAmbilNoteById).mockResolvedValueOnce(sampleNotes[0])

      const ctx = createCallbackContext('note:konfirmasi_hapus:n-1')
      await notesComposer.middleware()(ctx, next)

      expect(ctx.editMessageText).toHaveBeenCalledWith(
        expect.stringContaining('Apakah Anda yakin ingin menghapus catatan'),
        expect.objectContaining({
          reply_markup: expect.anything(),
        })
      )
    })

    it('menghapus catatan dan memperbarui daftar saat konfirmasi ya ditekan', async () => {
      vi.mocked(mockHapusNote).mockResolvedValueOnce(undefined)
      vi.mocked(mockAmbilSemuaNotes).mockResolvedValueOnce([sampleNotes[1]])

      const ctx = createCallbackContext('note:hapus:n-1')
      await notesComposer.middleware()(ctx, next)

      expect(mockHapusNote).toHaveBeenCalledWith('n-1')
      expect(ctx.answerCallbackQuery).toHaveBeenCalledWith(
        expect.objectContaining({ text: expect.stringContaining('berhasil dihapus') })
      )
      expect(ctx.editMessageText).toHaveBeenCalledWith(
        expect.stringContaining('Catatan telah dihapus'),
        expect.anything()
      )
    })

    it('kembali ke daftar catatan saat note:kembali ditekan', async () => {
      vi.mocked(mockAmbilSemuaNotes).mockResolvedValueOnce(sampleNotes)

      const ctx = createCallbackContext('note:kembali')
      await notesComposer.middleware()(ctx, next)

      expect(ctx.editMessageText).toHaveBeenCalledWith(
        expect.stringContaining('DAFTAR CATATAN TERSIMPAN'),
        expect.anything()
      )
    })
  })
})
