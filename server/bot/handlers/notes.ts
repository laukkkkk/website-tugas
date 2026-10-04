import { Composer, InlineKeyboard } from 'grammy'
import type { BotContext } from '../bot.js'
import {
  tambah as tambahNote,
  ambilSemua as ambilSemuaNotes,
  ambilById as ambilNoteById,
  hapus as hapusNote,
} from '../../features/notes/service.js'
import type { Note } from '../../features/notes/types.js'

export const notesComposer = new Composer<BotContext>()

/**
 * Membentuk tampilan daftar catatan dan keyboard inline.
 */
export async function renderNotesList(): Promise<{ text: string; keyboard?: InlineKeyboard }> {
  const notes = await ambilSemuaNotes()

  if (notes.length === 0) {
    return {
      text: '📑 Belum ada catatan tersimpan.\n\nTambah catatan baru dengan:\n`/note judul | isi`',
    }
  }

  const lines = ['📑 *DAFTAR CATATAN TERSIMPAN*', '']
  const keyboard = new InlineKeyboard()

  notes.forEach((note: Note, index: number) => {
    lines.push(`${index + 1}. *${note.judul}*`)
    const shortTitle = note.judul.length > 25 ? `${note.judul.slice(0, 24)}…` : note.judul
    keyboard.text(`📖 ${index + 1}. ${shortTitle}`, `note:baca:${note.id}`).row()
  })

  lines.push('')
  lines.push('Klik tombol di bawah untuk melihat isi catatan:')

  // Bersihkan baris kosong di keyboard
  keyboard.inline_keyboard = keyboard.inline_keyboard.filter((row) => row.length > 0)

  return {
    text: lines.join('\n'),
    keyboard,
  }
}

/**
 * Handler command /note judul | isi untuk menambah catatan baru.
 */
notesComposer.command('note', async (ctx) => {
  const rawArgs = ctx.match?.trim()

  if (!rawArgs) {
    await ctx.reply(
      'Format perintah note:\n`/note judul | isi`\n\nContoh:\n`/note Rangkuman Bab 1 | Poin penting materi arsitektur komputer`',
      { parse_mode: 'Markdown' }
    )
    return
  }

  const parts = rawArgs.split('|').map((p) => p.trim())
  if (parts.length < 2 || !parts[0] || !parts[1]) {
    await ctx.reply(
      '❌ Format note salah. Harus terdiri dari judul dan isi yang dipisahkan garis vertikal (|).\n\n' +
      'Format:\n`/note judul | isi`\n\n' +
      'Contoh:\n`/note Rangkuman Bab 1 | Poin penting materi arsitektur komputer`',
      { parse_mode: 'Markdown' }
    )
    return
  }

  const judul = parts[0]
  // Gabungkan sisa bagian jika pengguna memasukkan karakter | di dalam isi catatan
  const isi = parts.slice(1).join('|').trim()

  try {
    const noteBaru = await tambahNote({ judul, isi })
    await ctx.reply(
      `✅ Catatan berhasil disimpan!\n\n` +
      `📝 *${noteBaru.judul}*\n\n` +
      `${noteBaru.isi || '_(Tidak ada isi catatan)_'}\n\n` +
      `Ketik /notes untuk melihat semua catatan.`,
      { parse_mode: 'Markdown' }
    )
  } catch (err: any) {
    await ctx.reply(`❌ Gagal menyimpan catatan: ${err.message || 'Terjadi kesalahan sistem.'}`)
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
    const keyboard = new InlineKeyboard()
      .text('🗑️ Hapus Catatan', `note:konfirmasi_hapus:${note.id}`)
      .row()
      .text('🔙 Kembali ke Daftar', 'note:kembali')

    const messageText =
      `📝 *${note.judul}*\n\n` +
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
    const keyboard = new InlineKeyboard()
      .text('❌ Ya, Hapus Catatan', `note:hapus:${note.id}`)
      .text('Batal', `note:baca:${note.id}`)

    await ctx.editMessageText(
      `⚠️ Apakah Anda yakin ingin menghapus catatan:\n*${note.judul}*?`,
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
