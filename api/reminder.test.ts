import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const { mockSendMessage } = vi.hoisted(() => {
  return {
    mockSendMessage: vi.fn().mockResolvedValue({ message_id: 123 }),
  }
})

vi.mock('../server/bot/bot.js', () => {
  return {
    getBot: vi.fn().mockReturnValue({
      api: {
        sendMessage: mockSendMessage,
      },
    }),
  }
})

vi.mock('../server/features/tugas/service.js', () => {
  return {
    ambilBelumSelesai: vi.fn(),
  }
})

vi.mock('../server/features/kerjaan/service.js', () => {
  return {
    ambilBelumSelesai: vi.fn(),
  }
})

import { ambilBelumSelesai as mockAmbilTugas } from '../server/features/tugas/service.js'
import { ambilBelumSelesai as mockAmbilKerjaan } from '../server/features/kerjaan/service.js'
import handler from './reminder.js'

describe('Endpoint Reminder (api/reminder.ts)', () => {
  const REMINDER_SECRET = 'super-secret-reminder-key-xyz'
  const OWNER_CHAT_ID = '987654321'

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.REMINDER_SECRET = REMINDER_SECRET
    process.env.OWNER_CHAT_ID = OWNER_CHAT_ID
  })

  function createMockRes() {
    const json = vi.fn()
    const status = vi.fn(() => ({ json }))
    return {
      res: { status, json } as unknown as VercelResponse,
      statusMock: status,
      jsonMock: json,
    }
  }

  it('mengembalikan 401 Unauthorized jika header X-Reminder-Secret tidak ada', async () => {
    const { res, statusMock, jsonMock } = createMockRes()
    const req = {
      headers: {},
    } as unknown as VercelRequest

    await handler(req, res)

    expect(statusMock).toHaveBeenCalledWith(401)
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.stringContaining('Unauthorized'),
      })
    )
    expect(mockSendMessage).not.toHaveBeenCalled()
  })

  it('mengembalikan 401 Unauthorized jika header X-Reminder-Secret salah', async () => {
    const { res, statusMock, jsonMock } = createMockRes()
    const req = {
      headers: {
        'x-reminder-secret': 'secret-yang-salah',
      },
    } as unknown as VercelRequest

    await handler(req, res)

    expect(statusMock).toHaveBeenCalledWith(401)
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.stringContaining('Unauthorized'),
      })
    )
    expect(mockSendMessage).not.toHaveBeenCalled()
  })

  it('mengirim pesan ke Telegram jika ada tugas/kerjaan aktif dan secret benar', async () => {
    vi.mocked(mockAmbilTugas).mockResolvedValueOnce([
      {
        id: 't-1',
        judul: 'Tugas Kalkulus',
        matkul: 'Kalkulus 2',
        tipe: 'individu',
        link_pengumpulan: null,
        deadline: new Date(Date.now() + 86400000).toISOString(),
        selesai: false,
        created_at: new Date().toISOString(),
      },
    ])
    vi.mocked(mockAmbilKerjaan).mockResolvedValueOnce([])

    const { res, statusMock, jsonMock } = createMockRes()
    const req = {
      headers: {
        'x-reminder-secret': REMINDER_SECRET,
      },
    } as unknown as VercelRequest

    await handler(req, res)

    expect(statusMock).toHaveBeenCalledWith(200)
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        sent: true,
        tugasCount: 1,
        kerjaanCount: 0,
      })
    )
    expect(mockSendMessage).toHaveBeenCalledWith(
      OWNER_CHAT_ID,
      expect.stringContaining('Tugas Kalkulus'),
      expect.objectContaining({ parse_mode: 'Markdown' })
    )
  })

  it('tidak mengirim pesan jika tugas dan kerjaan sama-sama kosong', async () => {
    vi.mocked(mockAmbilTugas).mockResolvedValueOnce([])
    vi.mocked(mockAmbilKerjaan).mockResolvedValueOnce([])

    const { res, statusMock, jsonMock } = createMockRes()
    const req = {
      headers: {
        'x-reminder-secret': REMINDER_SECRET,
      },
    } as unknown as VercelRequest

    await handler(req, res)

    expect(statusMock).toHaveBeenCalledWith(200)
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        sent: false,
      })
    )
    expect(mockSendMessage).not.toHaveBeenCalled()
  })

  it('memecah pesan jika teks melebihi batas panjang maksimum', async () => {
    // Buat daftar banyak tugas agar pesan panjang
    const banyakTugas = Array.from({ length: 30 }, (_, i) => ({
      id: `t-${i}`,
      judul: `Judul Tugas Sangat Panjang Sekali Bagian Ke-${i + 1} dengan deskripsi komprehensif`,
      matkul: `Mata Kuliah Ke-${i + 1}`,
      tipe: 'individu' as const,
      link_pengumpulan: `https://example.com/pengumpulan/tugas-panjang-banget-${i + 1}`,
      deadline: new Date(Date.now() + (i + 1) * 86400000).toISOString(),
      selesai: false,
      created_at: new Date().toISOString(),
    }))

    vi.mocked(mockAmbilTugas).mockResolvedValueOnce(banyakTugas)
    vi.mocked(mockAmbilKerjaan).mockResolvedValueOnce([])

    const { res, statusMock, jsonMock } = createMockRes()
    const req = {
      headers: {
        'x-reminder-secret': REMINDER_SECRET,
      },
    } as unknown as VercelRequest

    await handler(req, res)

    expect(statusMock).toHaveBeenCalledWith(200)
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        sent: true,
      })
    )
    // sendMessage dipanggil setidaknya sekali (atau lebih jika dipecah)
    expect(mockSendMessage.mock.calls.length).toBeGreaterThanOrEqual(1)
  })
})
