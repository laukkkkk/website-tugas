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

function createMessageContext(text: string, initialSession: Record<string, any> = {}) {
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
  ctx.session = { ...initialSession }
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
      isi: 'Rangkuman Bab 1\nIsi rangkuman arsitektur von neumann',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'n-2',
      isi: 'Ide Tugas Akhir\nAplikasi reminder satu pengguna terintegrasi bot telegram',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Command /note', () => {
    it('menyimpan catatan baru langsung dengan teks setelah perintah tanpa pemisah', async () => {
      vi.mocked(mockTambahNote).mockResolvedValueOnce({
        id: 'n-new',
        isi: 'jangan lupa buat template capcut',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      const ctx = createMessageContext('/note jangan lupa buat template capcut')
      await notesComposer.middleware()(ctx, next)

      expect(mockTambahNote).toHaveBeenCalledWith({
        isi: 'jangan lupa buat template capcut',
      })
      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('✅ Catatan berhasil disimpan!'),
        expect.anything()
      )
      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('jangan lupa buat template capcut'),
        expect.anything()
      )
    })

    it('jika /note dikirim tanpa teks, bot membalas "Tulis isi catatannya" dan menyetel sesi alur percakapan', async () => {
      const ctx = createMessageContext('/note')
      await notesComposer.middleware()(ctx, next)

      expect(mockTambahNote).not.toHaveBeenCalled()
      expect(ctx.reply).toHaveBeenCalledWith('Tulis isi catatannya')
      expect(ctx.session).toEqual({
        flow: 'note',
        step: 'note_menunggu_isi',
        payload: {},
      })
    })

    it('menyimpan pesan teks berikutnya sebagai isi catatan dalam alur percakapan', async () => {
      vi.mocked(mockTambahNote).mockResolvedValueOnce({
        id: 'n-new',
        isi: 'Rangkuman Pertemuan 1\nPoin penting materi arsitektur komputer',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      const initialSession = {
        flow: 'note',
        step: 'note_menunggu_isi',
        payload: {},
      }
      const ctx = createMessageContext(
        'Rangkuman Pertemuan 1\nPoin penting materi arsitektur komputer',
        initialSession
      )

      await notesComposer.middleware()(ctx, next)

      expect(mockTambahNote).toHaveBeenCalledWith({
        isi: 'Rangkuman Pertemuan 1\nPoin penting materi arsitektur komputer',
      })
      // Sesi harus direset setelah catatan disimpan
      expect(ctx.session).toEqual({})
      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Rangkuman Pertemuan 1'),
        expect.anything()
      )
      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Poin penting materi arsitektur komputer'),
        expect.anything()
      )
    })

    it('meneruskan slash command (seperti /batal) ke middleware berikutnya saat alur percakapan aktif', async () => {
      const initialSession = {
        flow: 'note',
        step: 'note_menunggu_isi',
        payload: {},
      }
      const ctx = createMessageContext('/batal', initialSession)

      await notesComposer.middleware()(ctx, next)

      expect(mockTambahNote).not.toHaveBeenCalled()
      expect(next).toHaveBeenCalled()
    })

    it('konfirmasi setelah menyimpan menampilkan judul turunan dan pratinjau dari shared/catatan.ts', async () => {
      const isiCatatan = 'Judul Catatan Panjang Sekali\nBaris kedua sebagai pratinjau rincian'
      vi.mocked(mockTambahNote).mockResolvedValueOnce({
        id: 'n-3',
        isi: isiCatatan,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      const ctx = createMessageContext(`/note ${isiCatatan}`)
      await notesComposer.middleware()(ctx, next)

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('📝 *Judul Catatan Panjang Sekali*'),
        expect.objectContaining({ parse_mode: 'Markdown' })
      )
      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Baris kedua sebagai pratinjau rincian'),
        expect.objectContaining({ parse_mode: 'Markdown' })
      )
    })
  })

  describe('Command /notes dan renderNotesList', () => {
    it('menampilkan pesan belum ada catatan jika kosong', async () => {
      vi.mocked(mockAmbilSemuaNotes).mockResolvedValueOnce([])

      const { text, keyboard } = await renderNotesList()
      expect(text).toContain('Belum ada catatan tersimpan')
      expect(text).toContain('/note isi catatan')
      expect(keyboard).toBeUndefined()
    })

    it('menampilkan daftar catatan dan tombol inline per catatan dengan judul turunan', async () => {
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
