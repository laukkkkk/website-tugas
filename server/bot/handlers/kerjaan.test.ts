import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Context, Api } from 'grammy'
import type { BotContext } from '../bot.js'

// Mock service tambahKerjaan
vi.mock('../../features/kerjaan/service.js', () => {
  return {
    tambah: vi.fn(),
  }
})

import { tambah as mockTambahKerjaan } from '../../features/kerjaan/service.js'
import { kerjaanComposer } from './kerjaan.js'

function createMessageContext(text: string, session: any = {}) {
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
  ctx.session = session
  ctx.reply = vi.fn().mockResolvedValue(undefined) as any
  return ctx
}

function createCallbackContext(data: string, session: any = {}) {
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
  ctx.session = session
  ctx.reply = vi.fn().mockResolvedValue(undefined) as any
  ctx.answerCallbackQuery = vi.fn().mockResolvedValue(undefined) as any
  return ctx
}

describe('Bot Handler Kerjaan (server/bot/handlers/kerjaan.ts)', () => {
  const next = vi.fn().mockResolvedValue(undefined)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Mode Jalan Pintas (/kerjaan satu baris)', () => {
    it('berhasil menyimpan kerjaan dengan format valid dan deskripsi terisi', async () => {
      const ctx = createMessageContext(
        '/kerjaan Revisi Desain | Revisi mockup dashboard | besok 18.00'
      )
      const mockResult = {
        id: 'kerjaan-1',
        judul: 'Revisi Desain',
        deskripsi: 'Revisi mockup dashboard',
        deadline: '2026-10-04T18:00:00+07:00',
        selesai: false,
      }
      vi.mocked(mockTambahKerjaan).mockResolvedValueOnce(mockResult as any)

      await kerjaanComposer.middleware()(ctx, next)

      expect(mockTambahKerjaan).toHaveBeenCalledWith(
        expect.objectContaining({
          judul: 'Revisi Desain',
          deskripsi: 'Revisi mockup dashboard',
          deadline: expect.any(String),
        })
      )

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('✅ Kerjaan berhasil ditambahkan!')
      )
    })

    it('berhasil menyimpan kerjaan tanpa deskripsi (menggunakan tanda minus -)', async () => {
      const ctx = createMessageContext('/kerjaan Bayar Tagihan Listrik | - | hari ini 20.00')
      const mockResult = {
        id: 'kerjaan-2',
        judul: 'Bayar Tagihan Listrik',
        deskripsi: null,
        deadline: '2026-10-03T20:00:00+07:00',
        selesai: false,
      }
      vi.mocked(mockTambahKerjaan).mockResolvedValueOnce(mockResult as any)

      await kerjaanComposer.middleware()(ctx, next)

      expect(mockTambahKerjaan).toHaveBeenCalledWith(
        expect.objectContaining({
          judul: 'Bayar Tagihan Listrik',
          deskripsi: null,
          deadline: expect.any(String),
        })
      )
    })

    it('menolak jika format kurang dari 3 bagian yang dipisahkan pipe (|)', async () => {
      const ctx = createMessageContext('/kerjaan Revisi Desain | besok')

      await kerjaanComposer.middleware()(ctx, next)

      expect(mockTambahKerjaan).not.toHaveBeenCalled()
      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('❌ Format jalan pintas kerjaan salah')
      )
    })

    it('menolak jika judul kerjaan kosong', async () => {
      const ctx = createMessageContext('/kerjaan   | Revisi mockup | besok')

      await kerjaanComposer.middleware()(ctx, next)

      expect(mockTambahKerjaan).not.toHaveBeenCalled()
      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('❌ Judul kerjaan tidak boleh kosong')
      )
    })

    it('menolak dan memberi contoh jika deadline tidak dapat dibaca', async () => {
      const ctx = createMessageContext('/kerjaan Revisi Desain | - | kemarin sore lusa')

      await kerjaanComposer.middleware()(ctx, next)

      expect(mockTambahKerjaan).not.toHaveBeenCalled()
      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Contoh format deadline')
      )
    })
  })

  describe('Mode Bertahap (Tanya-Jawab)', () => {
    it('memulai mode bertahap jika /kerjaan dipanggil tanpa argumen', async () => {
      const ctx = createMessageContext('/kerjaan')

      await kerjaanComposer.middleware()(ctx, next)

      expect(ctx.session.flow).toBe('kerjaan')
      expect(ctx.session.step).toBe('kerjaan_menunggu_judul')
      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Silakan masukkan judul kerjaan')
      )
    })

    it('alur lengkap: judul -> deskripsi -> deadline -> konfirmasi simpan', async () => {
      // 1. User berada di step kerjaan_menunggu_judul dan mengirim judul
      const session: any = { flow: 'kerjaan', step: 'kerjaan_menunggu_judul', payload: {} }
      const ctx1 = createMessageContext('Slicing Halaman Dashboard', session)

      await kerjaanComposer.middleware()(ctx1, next)

      expect(session.payload.judul).toBe('Slicing Halaman Dashboard')
      expect(session.step).toBe('kerjaan_menunggu_deskripsi')
      expect(ctx1.reply).toHaveBeenCalledWith(
        expect.stringContaining('Masukkan deskripsi apa yang harus dikerjakan')
      )

      // 2. User mengirim deskripsi (atau /lewati)
      const ctx2 = createMessageContext('Slicing komponen responsive mobile dan desktop', session)
      await kerjaanComposer.middleware()(ctx2, next)

      expect(session.payload.deskripsi).toBe('Slicing komponen responsive mobile dan desktop')
      expect(session.step).toBe('kerjaan_menunggu_deadline')
      expect(ctx2.reply).toHaveBeenCalledWith(
        expect.stringContaining('Masukkan deadline kerjaan')
      )

      // 3. User salah input deadline
      const ctx3 = createMessageContext('kapan-kapan aja deh', session)
      await kerjaanComposer.middleware()(ctx3, next)

      expect(session.step).toBe('kerjaan_menunggu_deadline')
      expect(ctx3.reply).toHaveBeenCalledWith(
        expect.stringContaining('Silakan masukkan ulang deadline yang benar')
      )

      // 4. User mengirim deadline valid
      const ctx4 = createMessageContext('besok 18.00', session)
      await kerjaanComposer.middleware()(ctx4, next)

      expect(session.step).toBe('kerjaan_konfirmasi')
      expect(session.payload.deadline).toBeDefined()
      expect(ctx4.reply).toHaveBeenCalledWith(
        expect.stringContaining('Ringkasan Kerjaan Baru'),
        expect.objectContaining({ reply_markup: expect.anything() })
      )

      // 5. User menekan tombol simpan
      const ctx5 = createCallbackContext('kerjaan:konfirmasi:simpan', session)
      vi.mocked(mockTambahKerjaan).mockResolvedValueOnce({
        id: 'kerjaan-berhasil',
        judul: 'Slicing Halaman Dashboard',
        deskripsi: 'Slicing komponen responsive mobile dan desktop',
        deadline: session.payload.deadline,
        selesai: false,
      } as any)

      await kerjaanComposer.middleware()(ctx5, next)

      expect(mockTambahKerjaan).toHaveBeenCalledWith(
        expect.objectContaining({
          judul: 'Slicing Halaman Dashboard',
          deskripsi: 'Slicing komponen responsive mobile dan desktop',
        })
      )
      // Sesi harus dibersihkan setelah disimpan
      expect(ctx5.session).toEqual({})
      expect(ctx5.reply).toHaveBeenCalledWith(
        expect.stringContaining('✅ Kerjaan berhasil disimpan!')
      )
    })

    it('mendukung /lewati pada deskripsi kerjaan', async () => {
      const session: any = {
        flow: 'kerjaan',
        step: 'kerjaan_menunggu_deskripsi',
        payload: { judul: 'Beli Kebutuhan Server' },
      }
      const ctx = createMessageContext('/lewati', session)

      await kerjaanComposer.middleware()(ctx, next)

      expect(session.payload.deskripsi).toBeNull()
      expect(session.step).toBe('kerjaan_menunggu_deadline')
      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Deskripsi dilewati')
      )
    })

    it('membatalkan pembuatan kerjaan jika tombol Batal ditekan saat konfirmasi', async () => {
      const session = {
        flow: 'kerjaan',
        step: 'kerjaan_konfirmasi',
        payload: {
          judul: 'Kerjaan Batal',
          deskripsi: null,
          deadline: new Date().toISOString(),
        },
      }

      const ctx = createCallbackContext('kerjaan:konfirmasi:batal', session)

      await kerjaanComposer.middleware()(ctx, next)

      expect(mockTambahKerjaan).not.toHaveBeenCalled()
      expect(ctx.session).toEqual({})
      expect(ctx.reply).toHaveBeenCalledWith('❌ Pembuatan kerjaan dibatalkan.')
    })
  })
})
