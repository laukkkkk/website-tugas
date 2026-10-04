import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Context, Api } from 'grammy'
import type { BotContext } from '../bot.js'

// Mock service tambahTugas
vi.mock('../../features/tugas/service.js', () => {
  return {
    tambah: vi.fn(),
  }
})

import { tambah as mockTambahTugas } from '../../features/tugas/service.js'
import { tugasComposer } from './tugas.js'

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

describe('Bot Handler Tugas (server/bot/handlers/tugas.ts)', () => {
  const next = vi.fn().mockResolvedValue(undefined)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Mode Jalan Pintas (/tugas satu baris)', () => {
    it('berhasil menyimpan tugas dengan format valid dan tanda minus (-) untuk link', async () => {
      const ctx = createMessageContext('/tugas Makalah AI | Kecerdasan Buatan | kelompok | - | 5 okt 23:59')
      const mockResult = {
        id: 'tugas-1',
        judul: 'Makalah AI',
        matkul: 'Kecerdasan Buatan',
        tipe: 'kelompok',
        link_pengumpulan: null,
        deadline: '2026-10-05T23:59:00+07:00',
        selesai: false,
      }
      vi.mocked(mockTambahTugas).mockResolvedValueOnce(mockResult as any)

      await tugasComposer.middleware()(ctx, next)

      expect(mockTambahTugas).toHaveBeenCalledWith(
        expect.objectContaining({
          judul: 'Makalah AI',
          matkul: 'Kecerdasan Buatan',
          tipe: 'kelompok',
          link_pengumpulan: null,
          deadline: expect.any(String),
        })
      )

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('✅ Tugas berhasil ditambahkan!')
      )
    })

    it('berhasil menyimpan tugas dengan link pengumpulan terisi', async () => {
      const ctx = createMessageContext(
        '/tugas Proyek Web | Pemrograman Web | individu | https://github.com/my-repo | besok'
      )
      const mockResult = {
        id: 'tugas-2',
        judul: 'Proyek Web',
        matkul: 'Pemrograman Web',
        tipe: 'individu',
        link_pengumpulan: 'https://github.com/my-repo',
        deadline: '2026-10-04T23:59:00+07:00',
        selesai: false,
      }
      vi.mocked(mockTambahTugas).mockResolvedValueOnce(mockResult as any)

      await tugasComposer.middleware()(ctx, next)

      expect(mockTambahTugas).toHaveBeenCalledWith(
        expect.objectContaining({
          judul: 'Proyek Web',
          matkul: 'Pemrograman Web',
          tipe: 'individu',
          link_pengumpulan: 'https://github.com/my-repo',
        })
      )
    })

    it('menolak jika format kurang dari 5 bagian yang dipisahkan pipe (|)', async () => {
      const ctx = createMessageContext('/tugas Makalah AI | Kecerdasan Buatan | kelompok')

      await tugasComposer.middleware()(ctx, next)

      expect(mockTambahTugas).not.toHaveBeenCalled()
      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('❌ Format jalan pintas tugas salah')
      )
    })

    it('menolak jika judul atau matkul kosong', async () => {
      const ctx = createMessageContext('/tugas   | Kecerdasan Buatan | kelompok | - | besok')

      await tugasComposer.middleware()(ctx, next)

      expect(mockTambahTugas).not.toHaveBeenCalled()
      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('❌ Judul tugas tidak boleh kosong')
      )
    })

    it('menolak jika tipe bukan individu atau kelompok', async () => {
      const ctx = createMessageContext('/tugas Makalah AI | Kecerdasan Buatan | ramai-ramai | - | besok')

      await tugasComposer.middleware()(ctx, next)

      expect(mockTambahTugas).not.toHaveBeenCalled()
      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining("❌ Tipe tugas harus 'individu' atau 'kelompok'")
      )
    })

    it('menolak dan memberi contoh jika deadline tidak dapat dibaca', async () => {
      const ctx = createMessageContext(
        '/tugas Makalah AI | Kecerdasan Buatan | kelompok | - | kemarin sore lusa'
      )

      await tugasComposer.middleware()(ctx, next)

      expect(mockTambahTugas).not.toHaveBeenCalled()
      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Contoh format deadline')
      )
    })
  })

  describe('Mode Bertahap (Tanya-Jawab)', () => {
    it('memulai mode bertahap jika /tugas dipanggil tanpa argumen', async () => {
      const ctx = createMessageContext('/tugas')

      await tugasComposer.middleware()(ctx, next)

      expect(ctx.session.flow).toBe('tugas')
      expect(ctx.session.step).toBe('tugas_menunggu_judul')
      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Silakan masukkan judul tugas')
      )
    })

    it('alur lengkap: judul -> matkul -> tipe -> link -> deadline -> konfirmasi simpan', async () => {
      // 1. User berada di step tugas_menunggu_judul dan mengirim judul
      const session: any = { flow: 'tugas', step: 'tugas_menunggu_judul', payload: {} }
      const ctx1 = createMessageContext('Tugas Jaringan Komputer', session)

      await tugasComposer.middleware()(ctx1, next)

      expect(session.payload.judul).toBe('Tugas Jaringan Komputer')
      expect(session.step).toBe('tugas_menunggu_matkul')
      expect(ctx1.reply).toHaveBeenCalledWith(
        expect.stringContaining('masukkan nama mata kuliah')
      )

      // 2. User mengirim nama matkul
      const ctx2 = createMessageContext('Jaringan Komputer', session)
      await tugasComposer.middleware()(ctx2, next)

      expect(session.payload.matkul).toBe('Jaringan Komputer')
      expect(session.step).toBe('tugas_menunggu_tipe')
      expect(ctx2.reply).toHaveBeenCalledWith(
        expect.stringContaining('Pilih tipe tugas:'),
        expect.objectContaining({ reply_markup: expect.anything() })
      )

      // 3. User menekan tombol inline individu
      const ctx3 = createCallbackContext('tugas:tipe:individu', session)
      await tugasComposer.middleware()(ctx3, next)

      expect(session.payload.tipe).toBe('individu')
      expect(session.step).toBe('tugas_menunggu_link')
      expect(ctx3.answerCallbackQuery).toHaveBeenCalled()

      // 4. User mengirim /lewati untuk link pengumpulan
      const ctx4 = createMessageContext('/lewati', session)
      await tugasComposer.middleware()(ctx4, next)

      expect(session.payload.link_pengumpulan).toBeNull()
      expect(session.step).toBe('tugas_menunggu_deadline')

      // 5. User salah input deadline
      const ctx5 = createMessageContext('kapan-kapan aja deh', session)
      await tugasComposer.middleware()(ctx5, next)

      expect(session.step).toBe('tugas_menunggu_deadline')
      expect(ctx5.reply).toHaveBeenCalledWith(
        expect.stringContaining('Silakan masukkan ulang deadline yang benar')
      )

      // 6. User mengirim deadline yang benar
      const ctx6 = createMessageContext('besok 14.00', session)
      await tugasComposer.middleware()(ctx6, next)

      expect(session.step).toBe('tugas_konfirmasi')
      expect(session.payload.deadline).toBeDefined()
      expect(ctx6.reply).toHaveBeenCalledWith(
        expect.stringContaining('Ringkasan Tugas Baru'),
        expect.objectContaining({ reply_markup: expect.anything() })
      )

      // 7. User menekan tombol simpan
      const ctx7 = createCallbackContext('tugas:konfirmasi:simpan', session)
      vi.mocked(mockTambahTugas).mockResolvedValueOnce({
        id: 'tugas-berhasil',
        judul: 'Tugas Jaringan Komputer',
        matkul: 'Jaringan Komputer',
        tipe: 'individu',
        link_pengumpulan: null,
        deadline: session.payload.deadline,
        selesai: false,
      } as any)

      await tugasComposer.middleware()(ctx7, next)

      expect(mockTambahTugas).toHaveBeenCalledWith(
        expect.objectContaining({
          judul: 'Tugas Jaringan Komputer',
          matkul: 'Jaringan Komputer',
          tipe: 'individu',
          link_pengumpulan: null,
        })
      )
      // Sesi harus dibersihkan setelah disimpan
      expect(ctx7.session).toEqual({})
      expect(ctx7.reply).toHaveBeenCalledWith(
        expect.stringContaining('✅ Tugas berhasil disimpan!')
      )
    })

    it('membatalkan pembuatan tugas jika tombol Batal ditekan saat konfirmasi', async () => {
      const session = {
        flow: 'tugas',
        step: 'tugas_konfirmasi',
        payload: {
          judul: 'Tugas Batal',
          matkul: 'Matkul Test',
          tipe: 'individu',
          deadline: new Date().toISOString(),
        },
      }

      const ctx = createCallbackContext('tugas:konfirmasi:batal', session)

      await tugasComposer.middleware()(ctx, next)

      expect(mockTambahTugas).not.toHaveBeenCalled()
      expect(ctx.session).toEqual({})
      expect(ctx.reply).toHaveBeenCalledWith('❌ Pembuatan tugas dibatalkan.')
    })
  })
})
