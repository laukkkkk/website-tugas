import { Composer, InlineKeyboard } from 'grammy'
import type { BotContext } from '../bot.js'
import {
  tambah as tambahNote,
  ambilSemua as ambilSemuaNotes,
  ambilById as ambilNoteById,
  hapus as hapusNote,
} from '../../features/notes/service.js'
import type { Note } from '../../features/notes/types.js'
import { ringkasanCatatan } from '../../../shared/catatan.js'

export const notesComposer = new Composer<BotContext>()

/**
 * Membentuk tampilan daftar catatan dan keyboard inline.
 */
export async function renderNotesList(): Promise<{ text: string; keyboard?: InlineKeyboard }> {
  const notes = await ambilSemuaNotes()

  if (notes.length === 0) {
    return {
      text: '📑 Belum ada catatan tersimpan.\n\nTambah catatan baru dengan:\n`/note isi catatan`',
    }
  }

  const lines = ['📑 *DAFTAR CATATAN TERSIMPAN*', '']
  const buttonRows: { text: string; callback_data: string }[][] = []

  notes.forEach((note: Note, index: number) => {
    const { judul } = ringkasanCatatan(note.isi)
    const displayJudul = judul || 'Tanpa judul'
    lines.push(`${index + 1}. *${displayJudul}*`)
    const shortTitle = displayJudul.length > 25 ? `${displayJudul.slice(0, 24)}…` : displayJudul
    buttonRows.push([{ text: `📖 ${index + 1}. ${shortTitle}`, callback_data: `note:baca:${note.id}` }])
  })

  lines.push('')
  lines.push('Klik tombol di bawah untuk melihat isi catatan:')

  return {
    text: lines.join('\n'),
    keyboard: InlineKeyboard.from(buttonRows),
  }
}

/**
 * Handler command /note untuk menambah catatan baru.
 * - Jika ada teks setelah /note: langsung disimpan sebagai isi catatan tanpa simbol pemisah.
 * - Jika tanpa teks: membalas 'Tulis isi catatannya' dan menyimpan pesan berikutnya via bot_sessions.
 */
notesComposer.command('note', async (ctx) => {
  const rawArgs = ctx.match?.trim()

  // 1. Mode jalan pintas langsung: teks setelah /note adalah isi
  if (rawArgs) {
    try {
      ctx.session = {}
      const noteBaru = await tambahNote({ isi: rawArgs })
      const ringkasan = ringkasanCatatan(noteBaru.isi)
      const pratinjauTeks = ringkasan.pratinjau ? `\n\n${ringkasan.pratinjau}` : ''
      await ctx.reply(
        `✅ Catatan berhasil disimpan!\n\n` +
        `📝 *${ringkasan.judul}*` +
        `${pratinjauTeks}\n\n` +
        `Ketik /notes untuk melihat semua catatan.`,
        { parse_mode: 'Markdown' }
      )
    } catch (err: any) {
      ctx.session = {}
      await ctx.reply(`❌ Gagal menyimpan catatan: ${err.message || 'Terjadi kesalahan sistem.'}`)
    }
    return
  }

  // 2. Mode bertahap: simpan sesi dan minta isi catatan
  ctx.session = {
    flow: 'note',
    step: 'note_menunggu_isi',
    payload: {},
  }

  await ctx.reply('Tulis isi catatannya')
})

/**
 * Handler pesan teks lanjutan untuk alur percakapan catatan.
 */
notesComposer.on('message:text', async (ctx, next) => {
  const session = ctx.session
  if (!session || session.flow !== 'note') {
    return next()
  }

  const text = ctx.message.text.trim()

  // Abaikan slash commands agar dapat ditangani command handler lain (misal /batal)
  if (text.startsWith('/')) {
    return next()
  }

  if (session.step === 'note_menunggu_isi') {
    if (!text) {
      await ctx.reply('Tulis isi catatannya')
      return
    }

    try {
      const noteBaru = await tambahNote({ isi: text })
      ctx.session = {}
      const ringkasan = ringkasanCatatan(noteBaru.isi)
      const pratinjauTeks = ringkasan.pratinjau ? `\n\n${ringkasan.pratinjau}` : ''
      await ctx.reply(
        `✅ Catatan berhasil disimpan!\n\n` +
        `📝 *${ringkasan.judul}*` +
        `${pratinjauTeks}\n\n` +
        `Ketik /notes untuk melihat semua catatan.`,
        { parse_mode: 'Markdown' }
      )
    } catch (err: any) {
      ctx.session = {}
      await ctx.reply(`❌ Gagal menyimpan catatan: ${err.message || 'Terjadi kesalahan sistem.'}`)
    }
  }
})

/**
 * Handler command /notes untuk melihat daftar catatan tersimpan.
 */
notesComposer.command('notes', async (ctx) => {
  const { text, keyboard } = await renderNotesList()
  await ctx.reply(text, {
    parse_mode: 'Markdown',
    reply_markup: keyboard,
  })
})

/**
 * Handler melihat isi catatan tertentu.
 * Callback format: note:baca:<id>
 */
notesComposer.callbackQuery(/^note:baca:([a-zA-Z0-9-]+)$/, async (ctx) => {
  try {
    await ctx.answerCallbackQuery()
  } catch {
    // Abaikan jika callback query kedaluwarsa
  }

  const id = ctx.match[1]

  try {
    const note = await ambilNoteById(id)
    const { judul } = ringkasanCatatan(note.isi)
    const keyboard = new InlineKeyboard()
      .text('🗑️ Hapus Catatan', `note:konfirmasi_hapus:${note.id}`)
      .row()
      .text('🔙 Kembali ke Daftar', 'note:kembali')

    const messageText =
      `📝 *${judul}*\n\n` +
      `${note.isi || '_(Tidak ada isi catatan)_'}`

    await ctx.editMessageText(messageText, {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    })
  } catch {
    // Jika catatan tidak ditemukan (sudah dihapus), kembali ke daftar
    const { text, keyboard } = await renderNotesList()
    try {
      await ctx.editMessageText(text, {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      })
    } catch {
      // Abaikan error edit
    }
  }
})

/**
 * Handler konfirmasi sebelum menghapus catatan.
 * Callback format: note:konfirmasi_hapus:<id>
 */
notesComposer.callbackQuery(/^note:konfirmasi_hapus:([a-zA-Z0-9-]+)$/, async (ctx) => {
  try {
    await ctx.answerCallbackQuery()
  } catch {
    // Abaikan jika query kedaluwarsa
  }

  const id = ctx.match[1]

  try {
    const note = await ambilNoteById(id)
    const { judul } = ringkasanCatatan(note.isi)
    const keyboard = new InlineKeyboard()
      .text('❌ Ya, Hapus Catatan', `note:hapus:${note.id}`)
      .text('Batal', `note:baca:${note.id}`)

    await ctx.editMessageText(
      `⚠️ Apakah Anda yakin ingin menghapus catatan:\n*${judul}*?`,
      {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      }
    )
  } catch {
    const { text, keyboard } = await renderNotesList()
    try {
      await ctx.editMessageText(text, {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      })
    } catch {
      // Abaikan error edit
    }
  }
})

/**
 * Handler eksekusi penghapusan catatan.
 * Callback format: note:hapus:<id>
 */
notesComposer.callbackQuery(/^note:hapus:([a-zA-Z0-9-]+)$/, async (ctx) => {
  try {
    await ctx.answerCallbackQuery({ text: 'Catatan berhasil dihapus! 🗑️' })
  } catch {
    // Abaikan jika query kedaluwarsa
  }

  const id = ctx.match[1]

  try {
    await hapusNote(id)
  } catch {
    // Menekan tombol dua kali atau catatan sudah dihapus tidak memicu unhandled error
  }

  const { text, keyboard } = await renderNotesList()
  try {
    await ctx.editMessageText(
      `🗑️ Catatan telah dihapus.\n\n${text}`,
      {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      }
    )
  } catch {
    // Abaikan error edit
  }
})

/**
 * Handler kembali ke daftar catatan.
 * Callback format: note:kembali
 */
notesComposer.callbackQuery('note:kembali', async (ctx) => {
  try {
    await ctx.answerCallbackQuery()
  } catch {
    // Abaikan
  }

  const { text, keyboard } = await renderNotesList()
  try {
    await ctx.editMessageText(text, {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    })
  } catch {
    // Abaikan
  }
})
