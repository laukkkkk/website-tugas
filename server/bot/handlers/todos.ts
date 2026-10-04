import { Composer, InlineKeyboard } from 'grammy'
import type { BotContext } from '../bot.js'
import {
  tambah as tambahTodo,
  ambilSemua as ambilSemuaTodos,
  ambilById as ambilTodoById,
  ceklis as ceklisTodo,
  hapus as hapusTodo,
} from '../../features/todos/service.js'
import type { Todo } from '../../features/todos/types.js'

export const todosComposer = new Composer<BotContext>()

/**
 * Membentuk tampilan teks dan keyboard inline daftar to-do.
 */
export async function renderTodosList(): Promise<{ text: string; keyboard?: InlineKeyboard }> {
  const todos = await ambilSemuaTodos()

  if (todos.length === 0) {
    return {
      text: '☑️ Belum ada item to-do tersimpan.\n\nTambah to-do baru dengan:\n`/todo teks kegiatan`',
    }
  }

  const lines = ['☑️ *DAFTAR TO-DO*', '']
  const buttonRows: { text: string; callback_data: string }[][] = []

  todos.forEach((todo: Todo, index: number) => {
    const statusIcon = todo.selesai ? '✅' : '⬜'
    const statusText = todo.selesai ? `~${todo.teks}~` : todo.teks
    lines.push(`${index + 1}. ${statusIcon} ${statusText}`)

    const shortTeks = todo.teks.length > 20 ? `${todo.teks.slice(0, 19)}…` : todo.teks
    buttonRows.push([
      { text: `${statusIcon} ${index + 1}. ${shortTeks}`, callback_data: `todo:toggle:${todo.id}` },
      { text: '🗑️', callback_data: `todo:konfirmasi_hapus:${todo.id}` },
    ])
  })

  lines.push('')
  lines.push('Tekan tombol item untuk ceklis/unceklis, atau tombol 🗑️ untuk menghapus.')

  return {
    text: lines.join('\n'),
    keyboard: InlineKeyboard.from(buttonRows),
  }
}

/**
 * Handler command /todo <teks> untuk menambah to-do baru.
 */
todosComposer.command('todo', async (ctx) => {
  const rawTeks = ctx.match?.trim()

  if (!rawTeks) {
    await ctx.reply(
      'Format perintah todo:\n`/todo teks kegiatan`\n\nContoh:\n`/todo Beli perlengkapan praktikum`',
      { parse_mode: 'Markdown' }
    )
    return
  }

  try {
    const todoBaru = await tambahTodo({ teks: rawTeks })
    await ctx.reply(
      `✅ To-do berhasil ditambahkan!\n\n` +
        `⬜ *${todoBaru.teks}*\n\n` +
        `Ketik /todos untuk melihat dan mengelola daftar to-do.`,
      { parse_mode: 'Markdown' }
    )
  } catch (err: any) {
    await ctx.reply(`❌ Gagal menyimpan to-do: ${err.message || 'Terjadi kesalahan sistem.'}`)
  }
})

/**
 * Handler command /todos untuk melihat daftar to-do.
 */
todosComposer.command('todos', async (ctx) => {
  const { text, keyboard } = await renderTodosList()
  await ctx.reply(text, {
    parse_mode: 'Markdown',
    reply_markup: keyboard,
  })
})

/**
 * Handler toggle ceklis/unceklis status to-do.
 * Callback format: todo:toggle:<id>
 */
todosComposer.callbackQuery(/^todo:toggle:([a-zA-Z0-9-]+)$/, async (ctx) => {
  const id = ctx.match[1]

  try {
    const todo = await ambilTodoById(id)
    const targetStatus = !todo.selesai
    await ceklisTodo(id, targetStatus)

    try {
      await ctx.answerCallbackQuery({
        text: targetStatus ? 'Ditandai selesai! ✅' : 'Ditandai belum selesai ⬜',
      })
    } catch {
      // Abaikan
    }
  } catch {
    try {
      await ctx.answerCallbackQuery({ text: 'To-do tidak ditemukan.' })
    } catch {
      // Abaikan
    }
  }

  const { text, keyboard } = await renderTodosList()
  try {
    await ctx.editMessageText(text, {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    })
  } catch {
    // Abaikan error edit jika pesan tidak berubah
  }
})

/**
 * Handler konfirmasi sebelum menghapus to-do.
 * Callback format: todo:konfirmasi_hapus:<id>
 */
todosComposer.callbackQuery(/^todo:konfirmasi_hapus:([a-zA-Z0-9-]+)$/, async (ctx) => {
  try {
    await ctx.answerCallbackQuery()
  } catch {
    // Abaikan
  }

  const id = ctx.match[1]

  try {
    const todo = await ambilTodoById(id)
    const keyboard = new InlineKeyboard()
      .text('❌ Ya, Hapus To-Do', `todo:hapus:${todo.id}`)
      .text('Batal', 'todo:kembali')

    await ctx.editMessageText(
      `⚠️ Apakah Anda yakin ingin menghapus to-do:\n*${todo.teks}*?`,
      {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      }
    )
  } catch {
    const { text, keyboard } = await renderTodosList()
    try {
      await ctx.editMessageText(text, {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      })
    } catch {
      // Abaikan
    }
  }
})

/**
 * Handler eksekusi penghapusan to-do.
 * Callback format: todo:hapus:<id>
 */
todosComposer.callbackQuery(/^todo:hapus:([a-zA-Z0-9-]+)$/, async (ctx) => {
  try {
    await ctx.answerCallbackQuery({ text: 'To-do berhasil dihapus! 🗑️' })
  } catch {
    // Abaikan
  }

  const id = ctx.match[1]

  try {
    await hapusTodo(id)
  } catch {
    // Abaikan jika sudah terhapus
  }

  const { text, keyboard } = await renderTodosList()
  try {
    await ctx.editMessageText(
      `🗑️ Item to-do telah dihapus.\n\n${text}`,
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
 * Handler kembali ke daftar to-do.
 * Callback format: todo:kembali
 */
todosComposer.callbackQuery('todo:kembali', async (ctx) => {
  try {
    await ctx.answerCallbackQuery()
  } catch {
    // Abaikan
  }

  const { text, keyboard } = await renderTodosList()
  try {
    await ctx.editMessageText(text, {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    })
  } catch {
    // Abaikan
  }
})
