import { Composer, InlineKeyboard } from 'grammy'
import type { BotContext } from '../bot.js'
import { parseDeadlineWib, formatDeadlineHumanWib, DeadlineParseError } from '../../lib/tanggal.js'
import { tambah as tambahKerjaan } from '../../features/kerjaan/service.js'

export const kerjaanComposer = new Composer<BotContext>()

const CONTOH_JALAN_PINTAS =
  '/kerjaan Revisi Desain | Revisi mockup dashboard | besok 18.00'

/**
 * Handler untuk command /kerjaan.
 * Mendukung dua mode:
 * 1. Mode jalan pintas: /kerjaan judul | deskripsi | deadline
 * 2. Mode bertahap: /kerjaan (tanpa argumen)
 */
kerjaanComposer.command('kerjaan', async (ctx) => {
  const rawArgs = ctx.match?.trim()

  // 1. Jika ada argumen, gunakan mode jalan pintas satu baris
  if (rawArgs) {
    const parts = rawArgs.split('|').map((p) => p.trim())

    if (parts.length !== 3) {
      await ctx.reply(
        `❌ Format jalan pintas kerjaan salah. Harus terdiri dari 3 bagian yang dipisahkan garis vertikal (|).\n\n` +
        `Format:\n/kerjaan judul | deskripsi | deadline\n\n` +
        `Contoh:\n${CONTOH_JALAN_PINTAS}\n\n` +
        `Catatan: Gunakan tanda minus (-) jika tanpa deskripsi.`
      )
      return
    }

    const [judul, deskripsiRaw, deadlineRaw] = parts

    if (!judul) {
      await ctx.reply(`❌ Judul kerjaan tidak boleh kosong.\n\nContoh:\n${CONTOH_JALAN_PINTAS}`)
      return
    }

    const deskripsi = deskripsiRaw === '-' || deskripsiRaw === '' ? null : deskripsiRaw

    let deadlineDate: Date
    try {
      deadlineDate = parseDeadlineWib(deadlineRaw)
    } catch (err: any) {
      const errorMsg =
        err instanceof DeadlineParseError ? err.message : 'Deadline tidak dapat dipahami.'
      await ctx.reply(
        `❌ ${errorMsg}\n\nContoh format deadline: 'hari ini', 'besok', 'lusa', 'senin', '5 okt', '5/10', '5 okt 18.00'`
      )
      return
    }

    try {
      const kerjaanBaru = await tambahKerjaan({
        judul,
        deskripsi,
        deadline: deadlineDate.toISOString(),
      })

      const formattedDeadline = formatDeadlineHumanWib(kerjaanBaru.deadline)
      await ctx.reply(
        `✅ Kerjaan berhasil ditambahkan!\n\n` +
        `📌 Judul: ${kerjaanBaru.judul}\n` +
        `📝 Deskripsi: ${kerjaanBaru.deskripsi ?? '-'}\n` +
        `⏰ Deadline: ${formattedDeadline}`
      )
    } catch (err: any) {
      await ctx.reply(`❌ Gagal menyimpan kerjaan: ${err.message || 'Terjadi kesalahan sistem.'}`)
    }

    return
  }

  // 2. Mode bertahap: mulai tanya-jawab
  ctx.session = {
    flow: 'kerjaan',
    step: 'kerjaan_menunggu_judul',
    payload: {},
  }

  await ctx.reply(
    `💼 Membuat Kerjaan Baru (Mode Bertahap)\n\n` +
    `Silakan masukkan judul kerjaan:\n` +
    `(Ketik /batal kapan saja untuk membatalkan)`
  )
})

/**
 * Handler command /lewati untuk melewati input deskripsi pada kerjaan.
 */
kerjaanComposer.command('lewati', async (ctx, next) => {
  if (ctx.session?.flow === 'kerjaan' && ctx.session.step === 'kerjaan_menunggu_deskripsi') {
    ctx.session.payload = {
      ...ctx.session.payload,
      deskripsi: null,
    }
    ctx.session.step = 'kerjaan_menunggu_deadline'

    await ctx.reply(
      `📝 Deskripsi dilewati.\n\n` +
      `⏰ Masukkan deadline kerjaan:\n` +
      `(Contoh: 'hari ini', 'besok', 'lusa', 'senin', '5 okt', '5/10', atau sertakan jam seperti '5 okt 18.00')`
    )
    return
  }

  return next()
})

/**
 * Handler tombol inline untuk konfirmasi simpan atau batal kerjaan.
 */
kerjaanComposer.callbackQuery(/^kerjaan:konfirmasi:(simpan|batal)$/, async (ctx) => {
  await ctx.answerCallbackQuery()

  if (ctx.session?.flow !== 'kerjaan' || ctx.session.step !== 'kerjaan_konfirmasi') {
    await ctx.reply(
      '⚠️ Sesi konfirmasi kerjaan sudah tidak aktif. Silakan ketik /kerjaan untuk membuat kerjaan baru.'
    )
    return
  }

  const aksi = ctx.match[1]

  if (aksi === 'batal') {
    ctx.session = {}
    await ctx.reply('❌ Pembuatan kerjaan dibatalkan.')
    return
  }

  // Aksi simpan
  const payload = ctx.session.payload
  if (!payload?.judul || !payload?.deadline) {
    ctx.session = {}
    await ctx.reply('❌ Terjadi kesalahan data sesi tidak lengkap. Pembuatan kerjaan dibatalkan.')
    return
  }

  try {
    const kerjaanBaru = await tambahKerjaan({
      judul: payload.judul,
      deskripsi: payload.deskripsi ?? null,
      deadline: payload.deadline,
    })

    const deadlineFormatted = formatDeadlineHumanWib(kerjaanBaru.deadline)

    // Bersihkan sesi setelah berhasil disimpan
    ctx.session = {}

    await ctx.reply(
      `✅ Kerjaan berhasil disimpan!\n\n` +
      `📌 Judul: ${kerjaanBaru.judul}\n` +
      `📝 Deskripsi: ${kerjaanBaru.deskripsi ?? '-'}\n` +
      `⏰ Deadline: ${deadlineFormatted}`
    )
  } catch (err: any) {
    await ctx.reply(`❌ Gagal menyimpan kerjaan ke database: ${err.message || 'Terjadi kesalahan sistem.'}`)
  }
})

/**
 * Handler pesan teks percakapan bertahap untuk kerjaan.
 */
kerjaanComposer.on('message:text', async (ctx, next) => {
  const session = ctx.session
  if (!session || session.flow !== 'kerjaan') {
    return next()
  }

  const text = ctx.message.text.trim()

  // Jika berupa slash command lain (misal /start, /help, /batal), teruskan ke middleware berikutnya
  if (text.startsWith('/')) {
    return next()
  }

  // Tahap 1: Menunggu Judul Kerjaan
  if (session.step === 'kerjaan_menunggu_judul') {
    if (!text) {
      await ctx.reply('❌ Judul kerjaan tidak boleh kosong. Silakan masukkan judul kerjaan:')
      return
    }

    session.payload = {
      ...session.payload,
      judul: text,
    }
    session.step = 'kerjaan_menunggu_deskripsi'

    await ctx.reply(
      `📌 Judul: ${text}\n\n` +
      `Masukkan deskripsi apa yang harus dikerjakan:\n` +
      `(Ketik /lewati atau tanda minus (-) jika tanpa deskripsi)`
    )
    return
  }

  // Tahap 2: Menunggu Deskripsi Kerjaan
  if (session.step === 'kerjaan_menunggu_deskripsi') {
    const deskripsi = text === '-' || text.toLowerCase() === 'lewati' ? null : text

    session.payload = {
      ...session.payload,
      deskripsi,
    }
    session.step = 'kerjaan_menunggu_deadline'

    await ctx.reply(
      `📝 Deskripsi: ${deskripsi ?? '-'}\n\n` +
      `⏰ Masukkan deadline kerjaan:\n` +
      `(Contoh: 'hari ini', 'besok', 'lusa', 'senin', '5 okt', '5/10', atau sertakan jam seperti '5 okt 18.00')`
    )
    return
  }

  // Tahap 3: Menunggu Deadline Kerjaan
  if (session.step === 'kerjaan_menunggu_deadline') {
    let deadlineDate: Date
    try {
      deadlineDate = parseDeadlineWib(text)
    } catch (err: any) {
      const errorMsg =
        err instanceof DeadlineParseError ? err.message : 'Deadline tidak dapat dipahami.'
      await ctx.reply(
        `❌ ${errorMsg}\n\nSilakan masukkan ulang deadline yang benar:\n` +
        `(Contoh: 'besok', 'lusa', 'senin', '5 okt', '5/10', '5 okt 18.00')`
      )
      return
    }

    const deadlineIso = deadlineDate.toISOString()
    const deadlineFormatted = formatDeadlineHumanWib(deadlineDate)

    session.payload = {
      ...session.payload,
      deadline: deadlineIso,
      deadlineFormatted,
    }
    session.step = 'kerjaan_konfirmasi'

    const keyboard = new InlineKeyboard()
      .text('✅ Simpan', 'kerjaan:konfirmasi:simpan')
      .text('❌ Batal', 'kerjaan:konfirmasi:batal')

    await ctx.reply(
      `📋 Ringkasan Kerjaan Baru:\n` +
      `• Judul: ${session.payload.judul}\n` +
      `• Deskripsi: ${session.payload.deskripsi ?? '-'}\n` +
      `• Deadline: ${deadlineFormatted}\n\n` +
      `Apakah data di atas sudah benar?`,
      { reply_markup: keyboard }
    )
    return
  }

  return next()
})
