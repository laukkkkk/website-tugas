import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ambilBelumSelesai as ambilTugasBelumSelesai } from '../server/features/tugas/service.js'
import { ambilBelumSelesai as ambilKerjaanBelumSelesai } from '../server/features/kerjaan/service.js'
import { susunPesanReminder } from '../shared/pesan-reminder.js'
import { splitMessage } from '../server/bot/handlers/list.js'
import { getBot } from '../server/bot/bot.js'

/**
 * Endpoint pengingat harian (daily reminder) via Telegram.
 * Dipanggil secara terjadwal (misalnya oleh cron-job.org jam 09.00 WIB).
 * Dilindungi header X-Reminder-Secret.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Hanya metode GET atau POST yang didukung (req.method opsional untuk kompatibilitas pengujian)
  if (req.method && req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method Not Allowed',
      message: `Metode ${req.method} tidak didukung. Gunakan GET atau POST.`,
    })
  }

  try {
    // 1. Verifikasi keamanan header X-Reminder-Secret (atau Authorization Bearer)
    const expectedSecret = process.env.REMINDER_SECRET
    const rawSecret = req.headers['x-reminder-secret']
    const secretHeader = Array.isArray(rawSecret) ? rawSecret[0] : rawSecret
    const authHeader = req.headers['authorization']
    const bearerSecret = typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : undefined

    const providedSecret = secretHeader || bearerSecret

    if (!expectedSecret || providedSecret !== expectedSecret) {
      return res.status(401).json({ error: 'Unauthorized: invalid reminder secret' })
    }

    // 2. Ambil tugas dan kerjaan yang belum selesai (sudah terurut per deadline ASC)
    // Query ke Supabase via service selalu dijalankan di setiap pemanggilan yang lolos pengecekan secret.
    const [tugasList, kerjaanList] = await Promise.all([
      ambilTugasBelumSelesai(),
      ambilKerjaanBelumSelesai(),
    ])

    const tugasCount = tugasList.length
    const kerjaanCount = kerjaanList.length

    // 3. Susun teks pesan reminder murni
    const pesan = susunPesanReminder(tugasList, kerjaanList)

    // 4. Jika tugas dan kerjaan sama-sama kosong, jangan kirim pesan apa pun
    if (!pesan) {
      return res.status(200).json({
        message: 'Tidak ada tugas atau kerjaan yang perlu diingatkan.',
        sent: false,
        tugasCount,
        kerjaanCount,
      })
    }

    // 5. Kirim pesan ke pemilik bot Telegram
    const ownerChatId = process.env.OWNER_CHAT_ID
    if (!ownerChatId) {
      return res.status(500).json({ error: 'OWNER_CHAT_ID belum disetel di environment variables.' })
    }

    const bot = getBot()
    const chunks = splitMessage(pesan, 4000)

    for (const chunk of chunks) {
      await bot.api.sendMessage(ownerChatId, chunk, { parse_mode: 'Markdown' })
    }

    return res.status(200).json({
      message: 'Pengingat berhasil dikirim ke Telegram.',
      sent: true,
      tugasCount,
      kerjaanCount,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return res.status(500).json({
      error: 'Internal Server Error',
      message,
    })
  }
}
