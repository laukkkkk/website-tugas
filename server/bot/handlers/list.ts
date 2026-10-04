import { Composer, InlineKeyboard } from 'grammy'
import type { BotContext } from '../bot.js'
import {
  ambilBelumSelesai as ambilTugasBelumSelesai,
  tandaiSelesai as tandaiSelesaiTugas,
} from '../../features/tugas/service.js'
import {
  ambilBelumSelesai as ambilKerjaanBelumSelesai,
  tandaiSelesai as tandaiSelesaiKerjaan,
} from '../../features/kerjaan/service.js'
import { hariTersisa, labelSisaWaktu } from '../../../shared/deadline.js'
import { formatDeadlineHumanWib } from '../../lib/tanggal.js'
import type { Tugas } from '../../features/tugas/types.js'
import type { Kerjaan } from '../../features/kerjaan/types.js'

export const listComposer = new Composer<BotContext>()

/**
 * Batas aman panjang karakter pesan teks Telegram (maks 4096 karakter).
 */
export const TELEGRAM_MAX_TEXT_LENGTH = 3500

/**
 * Mengambil emoji indikator warna deadline berdasarkan selisih hari.
 */
export function getIndicatorEmoji(selisihHari: number): string {
  if (selisihHari < 2) return '🔴'
  if (selisihHari < 4) return '🟡'
  if (selisihHari < 7) return '🟢'
  return '⚪'
}

export type ListFilter = 'all' | 'tugas' | 'kerjaan'

export interface RenderListResult {
  text: string
  keyboard?: InlineKeyboard
}

/**
 * Membentuk konten teks dan keyboard inline untuk daftar tugas & kerjaan yang belum selesai.
 */
export async function renderListContent(
  filter: ListFilter = 'all'
): Promise<RenderListResult> {
  const buttonRows: { text: string; callback_data: string }[][] = []

  let tugasList: Tugas[] = []
  let kerjaanList: Kerjaan[] = []

  if (filter === 'all' || filter === 'tugas') {
    tugasList = await ambilTugasBelumSelesai()
  }

  if (filter === 'all' || filter === 'kerjaan') {
    kerjaanList = await ambilKerjaanBelumSelesai()
  }

  const totalItem = tugasList.length + kerjaanList.length

  if (totalItem === 0) {
    if (filter === 'tugas') {
      return { text: '🎉 Tidak ada tugas yang belum selesai! Semuanya sudah beres.' }
    }
    if (filter === 'kerjaan') {
      return { text: '🎉 Tidak ada kerjaan yang belum selesai! Semuanya sudah beres.' }
    }
    return { text: '🎉 Tidak ada tugas maupun kerjaan yang belum selesai! Semuanya sudah beres.' }
  }

  const sections: string[] = []

  // 1. Bagian Tugas
  if (tugasList.length > 0) {
    const lines: string[] = ['📋 *DAFTAR TUGAS KULIAH*']
    tugasList.forEach((t, i) => {
      const sisaHari = hariTersisa(t.deadline)
      const label = labelSisaWaktu(sisaHari)
      const emoji = getIndicatorEmoji(sisaHari)
      const formattedDate = formatDeadlineHumanWib(t.deadline)
      const tipeLabel = t.tipe === 'kelompok' ? '👥 Kelompok' : '👤 Individu'

      let itemText =
        `${i + 1}. *${t.judul}* (${t.matkul}) [${tipeLabel}]\n` +
        `   ${emoji} Deadline: ${formattedDate} (${label})`
      if (t.link_pengumpulan) {
        itemText += `\n   🔗 Link: ${t.link_pengumpulan}`
      }
      lines.push(itemText)

      const shortTitle = t.judul.length > 25 ? `${t.judul.slice(0, 24)}…` : t.judul
      buttonRows.push([{ text: `✅ Selesai: ${shortTitle}`, callback_data: `selesai:tugas:${t.id}:${filter}` }])
    })
    sections.push(lines.join('\n\n'))
  } else if (filter === 'tugas') {
    sections.push('📋 *DAFTAR TUGAS KULIAH*\n(Tidak ada tugas yang belum selesai)')
  }

  // 2. Bagian Kerjaan
  if (kerjaanList.length > 0) {
    const lines: string[] = ['💼 *DAFTAR KERJAAN / PROYEK*']
    kerjaanList.forEach((k, i) => {
      const sisaHari = hariTersisa(k.deadline)
      const label = labelSisaWaktu(sisaHari)
      const emoji = getIndicatorEmoji(sisaHari)
      const formattedDate = formatDeadlineHumanWib(k.deadline)

      let itemText =
        `${i + 1}. *${k.judul}*\n` +
        `   ${emoji} Deadline: ${formattedDate} (${label})`
      if (k.deskripsi) {
        itemText += `\n   📝 ${k.deskripsi}`
      }
      lines.push(itemText)

      const shortTitle = k.judul.length > 25 ? `${k.judul.slice(0, 24)}…` : k.judul
      buttonRows.push([{ text: `✅ Selesai: ${shortTitle}`, callback_data: `selesai:kerjaan:${k.id}:${filter}` }])
    })
    sections.push(lines.join('\n\n'))
  } else if (filter === 'kerjaan') {
    sections.push('💼 *DAFTAR KERJAAN / PROYEK*\n(Tidak ada kerjaan yang belum selesai)')
  }

  const fullText = sections.join('\n\n───────────────\n\n')

  return {
    text: fullText,
    keyboard: buttonRows.length > 0 ? InlineKeyboard.from(buttonRows) : undefined,
  }
}

/**
 * Memecah teks pesan jika melewati batas panjang karakter Telegram.
 */
export function splitMessage(text: string, maxLength: number = TELEGRAM_MAX_TEXT_LENGTH): string[] {
  if (text.length <= maxLength) {
    return [text]
  }

  const chunks: string[] = []
  const paragraphs = text.split('\n\n')
  let currentChunk = ''

  for (const paragraph of paragraphs) {
    if ((currentChunk + '\n\n' + paragraph).length > maxLength) {
      if (currentChunk) {
        chunks.push(currentChunk.trim())
        currentChunk = ''
      }
      // Jika satu paragraf saja lebih besar dari maxLength
      if (paragraph.length > maxLength) {
        const lines = paragraph.split('\n')
        for (const line of lines) {
          if ((currentChunk + '\n' + line).length > maxLength) {
            if (currentChunk) chunks.push(currentChunk.trim())
            currentChunk = line
          } else {
            currentChunk = currentChunk ? `${currentChunk}\n${line}` : line
          }
        }
      } else {
        currentChunk = paragraph
      }
    } else {
      currentChunk = currentChunk ? `${currentChunk}\n\n${paragraph}` : paragraph
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim())
  }

  return chunks
}

/**
 * Handler untuk command /list.
 * Mendukung:
 * - /list (semua tugas & kerjaan)
 * - /list tugas
 * - /list kerjaan
 */
listComposer.command('list', async (ctx) => {
  const arg = ctx.match?.trim().toLowerCase()
  let filter: ListFilter = 'all'

  if (arg === 'tugas') {
    filter = 'tugas'
  } else if (arg === 'kerjaan') {
    filter = 'kerjaan'
  }

  const { text, keyboard } = await renderListContent(filter)
  const chunks = splitMessage(text)

  for (let i = 0; i < chunks.length; i++) {
    const isLast = i === chunks.length - 1
    await ctx.reply(chunks[i], {
      parse_mode: 'Markdown',
      reply_markup: isLast ? keyboard : undefined,
    })
  }
})

/**
 * Handler tombol inline 'Selesai' untuk tugas atau kerjaan.
 * Callback format: selesai:(tugas|kerjaan):<id>:<filter>
 */
listComposer.callbackQuery(
  /^selesai:(tugas|kerjaan):([a-zA-Z0-9-]+):([a-z]+)$/,
  async (ctx) => {
    // 1. Acknowledge callback query cepat ke Telegram
    try {
      await ctx.answerCallbackQuery({ text: 'Ditandai selesai! 🎉' })
    } catch {
      // Abaikan jika query sudah kedaluwarsa
    }

    const match = ctx.match
    const tipe = match[1] as 'tugas' | 'kerjaan'
    const id = match[2]
    const filter = (match[3] as ListFilter) || 'all'

    // 2. Tandai selesai lewat service database
    try {
      if (tipe === 'tugas') {
        await tandaiSelesaiTugas(id, true)
      } else if (tipe === 'kerjaan') {
        await tandaiSelesaiKerjaan(id, true)
      }
    } catch {
      // Menekan tombol dua kali atau data sudah selesai tidak boleh menyebabkan error
    }

    // 3. Render ulang pesan daftar terbarukan
    const { text, keyboard } = await renderListContent(filter)

    try {
      await ctx.editMessageText(text, {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      })
    } catch {
      // Abaikan error jika pesan tidak berubah (misal tombol ditekan bersamaan/ganda)
    }
  }
)
