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
  // 1. Verifikasi keamanan header X-Reminder-Secret
  const expectedSecret = process.env.REMINDER_SECRET
  const secretHeader = req.headers['x-reminder-secret']

  if (!expectedSecret || secretHeader !== expectedSecret) {
    return res.status(401).json({ error: 'Unauthorized: invalid reminder secret' })
  }

  // 2. Ambil tugas dan kerjaan yang belum selesai (sudah terurut per deadline ASC)
  const [tugasList, kerjaanList] = await Promise.all([
    ambilTugasBelumSelesai(),
    ambilKerjaanBelumSelesai(),
  ])

  // 3. Susun teks pesan reminder murni
  const pesan = susunPesanReminder(tugasList, kerjaanList)

  // 4. Jika tugas dan kerjaan sama-sama kosong, jangan kirim pesan apa pun
  if (!pesan) {
    return res.status(200).json({
      message: 'Tidak ada tugas atau kerjaan yang perlu diingatkan.',
      sent: false,
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
    tugasCount: tugasList.length,
    kerjaanCount: kerjaanList.length,
  })
}
