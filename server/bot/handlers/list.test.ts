import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Context, Api } from 'grammy'
import type { BotContext } from '../bot.js'

vi.mock('../../features/tugas/service.js', () => {
  return {
    ambilBelumSelesai: vi.fn(),
    tandaiSelesai: vi.fn(),
  }
})

vi.mock('../../features/kerjaan/service.js', () => {
  return {
    ambilBelumSelesai: vi.fn(),
    tandaiSelesai: vi.fn(),
  }
})

import {
  ambilBelumSelesai as mockAmbilTugas,
  tandaiSelesai as mockTandaiSelesaiTugas,
} from '../../features/tugas/service.js'
import {
  ambilBelumSelesai as mockAmbilKerjaan,
  tandaiSelesai as mockTandaiSelesaiKerjaan,
} from '../../features/kerjaan/service.js'
import { listComposer, renderListContent, splitMessage } from './list.js'

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

describe('Bot Handler List (server/bot/handlers/list.ts)', () => {
  const next = vi.fn().mockResolvedValue(undefined)

  const sampleTugas = [
    {
      id: 't-1',
      judul: 'Tugas Matematika',
      matkul: 'Kalkulus',
      tipe: 'individu' as const,
      link_pengumpulan: 'https://classroom.google.com/c/123',
      deadline: new Date(Date.now() + 86400000).toISOString(), // Besok
      selesai: false,
      created_at: new Date().toISOString(),
    },
    {
      id: 't-2',
      judul: 'Makalah Etika',
      matkul: 'Etika Profesi',
      tipe: 'kelompok' as const,
      link_pengumpulan: null,
      deadline: new Date(Date.now() + 3 * 86400000).toISOString(), // 3 hari lagi
      selesai: false,
      created_at: new Date().toISOString(),
    },
  ]

  const sampleKerjaan = [
    {
      id: 'k-1',
      judul: 'Fix Bug Login',
      deskripsi: 'Perbaiki token session expired',
      deadline: new Date(Date.now() + 86400000).toISOString(),
      selesai: false,
      created_at: new Date().toISOString(),
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('renderListContent', () => {
    it('menampilkan kedua bagian tugas dan kerjaan jika ada item aktif', async () => {
      vi.mocked(mockAmbilTugas).mockResolvedValueOnce(sampleTugas)
      vi.mocked(mockAmbilKerjaan).mockResolvedValueOnce(sampleKerjaan)

      const result = await renderListContent('all')

      expect(result.text).toContain('DAFTAR TUGAS KULIAH')
      expect(result.text).toContain('Tugas Matematika')
      expect(result.text).toContain('Makalah Etika')
      expect(result.text).toContain('DAFTAR KERJAAN / PROYEK')
      expect(result.text).toContain('Fix Bug Login')
      expect(result.keyboard).toBeDefined()
      // Ada 3 tombol Selesai
      expect(result.keyboard?.inline_keyboard.length).toBe(3)
    })

    it('hanya menampilkan tugas ketika filter adalah "tugas"', async () => {
      vi.mocked(mockAmbilTugas).mockResolvedValueOnce(sampleTugas)

      const result = await renderListContent('tugas')

      expect(mockAmbilKerjaan).not.toHaveBeenCalled()
      expect(result.text).toContain('DAFTAR TUGAS KULIAH')
      expect(result.text).not.toContain('DAFTAR KERJAAN / PROYEK')
      expect(result.keyboard?.inline_keyboard.length).toBe(2)
    })

    it('hanya menampilkan kerjaan ketika filter adalah "kerjaan"', async () => {
      vi.mocked(mockAmbilKerjaan).mockResolvedValueOnce(sampleKerjaan)

      const result = await renderListContent('kerjaan')

      expect(mockAmbilTugas).not.toHaveBeenCalled()
      expect(result.text).toContain('DAFTAR KERJAAN / PROYEK')
      expect(result.text).not.toContain('DAFTAR TUGAS KULIAH')
      expect(result.keyboard?.inline_keyboard.length).toBe(1)
    })

    it('menampilkan pesan selesai ketika tidak ada item yang belum selesai', async () => {
      vi.mocked(mockAmbilTugas).mockResolvedValueOnce([])
      vi.mocked(mockAmbilKerjaan).mockResolvedValueOnce([])

      const result = await renderListContent('all')

      expect(result.text).toContain('Tidak ada tugas maupun kerjaan yang belum selesai')
      expect(result.keyboard).toBeUndefined()
    })
  })

  describe('splitMessage', () => {
    it('tidak memecah pesan jika panjangnya di bawah batas', () => {
      const text = 'Halo dunia, ini pesan pendek.'
      const chunks = splitMessage(text, 100)
      expect(chunks).toEqual([text])
    })

    it('memecah pesan panjang menjadi beberapa bagian tanpa error', () => {
      const p1 = 'A'.repeat(60)
      const p2 = 'B'.repeat(60)
      const text = `${p1}\n\n${p2}`
      const chunks = splitMessage(text, 70)

      expect(chunks.length).toBe(2)
      expect(chunks[0]).toBe(p1)
      expect(chunks[1]).toBe(p2)
    })
  })

  describe('Command /list', () => {
    it('menampilkan semua tugas & kerjaan saat /list dipanggil tanpa argumen', async () => {
      vi.mocked(mockAmbilTugas).mockResolvedValueOnce(sampleTugas)
      vi.mocked(mockAmbilKerjaan).mockResolvedValueOnce(sampleKerjaan)

      const ctx = createMessageContext('/list')
      await listComposer.middleware()(ctx, next)

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('DAFTAR TUGAS KULIAH'),
        expect.objectContaining({
          parse_mode: 'Markdown',
          reply_markup: expect.anything(),
        })
      )
    })

    it('menampilkan hanya tugas saat /list tugas dipanggil', async () => {
      vi.mocked(mockAmbilTugas).mockResolvedValueOnce(sampleTugas)

      const ctx = createMessageContext('/list tugas')
      await listComposer.middleware()(ctx, next)

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('DAFTAR TUGAS KULIAH'),
        expect.anything()
      )
      expect(mockAmbilKerjaan).not.toHaveBeenCalled()
    })

    it('menampilkan hanya kerjaan saat /list kerjaan dipanggil', async () => {
      vi.mocked(mockAmbilKerjaan).mockResolvedValueOnce(sampleKerjaan)

      const ctx = createMessageContext('/list kerjaan')
      await listComposer.middleware()(ctx, next)

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('DAFTAR KERJAAN / PROYEK'),
        expect.anything()
      )
      expect(mockAmbilTugas).not.toHaveBeenCalled()
    })
  })

  describe('Callback tombol Selesai', () => {
    it('menandai tugas selesai dan memperbarui pesan', async () => {
      vi.mocked(mockTandaiSelesaiTugas).mockResolvedValueOnce({} as any)
      // Setelah t-1 selesai, tersisa t-2 dan k-1
      vi.mocked(mockAmbilTugas).mockResolvedValueOnce([sampleTugas[1]])
      vi.mocked(mockAmbilKerjaan).mockResolvedValueOnce(sampleKerjaan)

      const ctx = createCallbackContext('selesai:tugas:t-1:all')
      await listComposer.middleware()(ctx, next)

      expect(ctx.answerCallbackQuery).toHaveBeenCalledWith(
        expect.objectContaining({ text: expect.stringContaining('selesai') })
      )
      expect(mockTandaiSelesaiTugas).toHaveBeenCalledWith('t-1', true)
      expect(ctx.editMessageText).toHaveBeenCalledWith(
        expect.stringContaining('Makalah Etika'),
        expect.objectContaining({
          parse_mode: 'Markdown',
          reply_markup: expect.anything(),
        })
      )
    })

    it('menandai kerjaan selesai dan memperbarui pesan', async () => {
      vi.mocked(mockTandaiSelesaiKerjaan).mockResolvedValueOnce({} as any)
      vi.mocked(mockAmbilKerjaan).mockResolvedValueOnce([])

      const ctx = createCallbackContext('selesai:kerjaan:k-1:kerjaan')
      await listComposer.middleware()(ctx, next)

      expect(mockTandaiSelesaiKerjaan).toHaveBeenCalledWith('k-1', true)
      expect(ctx.editMessageText).toHaveBeenCalledWith(
        expect.stringContaining('Tidak ada kerjaan yang belum selesai'),
        expect.anything()
      )
    })

    it('tidak melempar error jika tombol ditekan dua kali (idempotent)', async () => {
      // Simulasikan database melempar error karena sudah selesai / dihapus
      vi.mocked(mockTandaiSelesaiTugas).mockRejectedValueOnce(new Error('Tugas sudah selesai'))
      vi.mocked(mockAmbilTugas).mockResolvedValueOnce([])
      vi.mocked(mockAmbilKerjaan).mockResolvedValueOnce([])

      const ctx = createCallbackContext('selesai:tugas:t-1:all')

      // Tidak boleh melempar unhandled error
      await expect(listComposer.middleware()(ctx, next)).resolves.not.toThrow()
      expect(ctx.answerCallbackQuery).toHaveBeenCalled()
    })
  })
})
