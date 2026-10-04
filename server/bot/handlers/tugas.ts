import { Composer, InlineKeyboard } from 'grammy'
import type { BotContext } from '../bot.js'
import { parseDeadlineWib, formatDeadlineHumanWib, DeadlineParseError } from '../../lib/tanggal.js'
import { tambah as tambahTugas } from '../../features/tugas/service.js'

export const tugasComposer = new Composer<BotContext>()

const CONTOH_JALAN_PINTAS =
  '/tugas Makalah AI | Kecerdasan Buatan | kelompok | - | 5 okt 23:59'

/**
 * Handler untuk command /tugas.
 * Mendukung dua mode:
 * 1. Mode jalan pintas: /tugas judul | matkul | individu | link | deadline
 * 2. Mode bertahap: /tugas (tanpa argumen)
 */
tugasComposer.command('tugas', async (ctx) => {
  const rawArgs = ctx.match?.trim()

  // 1. Jika ada argumen, gunakan mode jalan pintas satu baris
  if (rawArgs) {
    const parts = rawArgs.split('|').map((p) => p.trim())

    if (parts.length !== 5) {
      await ctx.reply(
        `❌ Format jalan pintas tugas salah. Harus terdiri dari 5 bagian yang dipisahkan garis vertikal (|).\n\n` +
          `Format:\n/tugas judul | matkul | individu/kelompok | link | deadline\n\n` +
          `Contoh:\n${CONTOH_JALAN_PINTAS}\n\n` +
          `Catatan: Gunakan tanda minus (-) jika tidak ada link pengumpulan.`
      )
      return
    }

    const [judul, matkul, tipeRaw, linkRaw, deadlineRaw] = parts

    if (!judul) {
      await ctx.reply(`❌ Judul tugas tidak boleh kosong.\n\nContoh:\n${CONTOH_JALAN_PINTAS}`)
      return
    }

    if (!matkul) {
      await ctx.reply(`❌ Mata kuliah tidak boleh kosong.\n\nContoh:\n${CONTOH_JALAN_PINTAS}`)
      return
    }

    const tipeNorm = tipeRaw.toLowerCase()
    if (tipeNorm !== 'individu' && tipeNorm !== 'kelompok') {
      await ctx.reply(
        `❌ Tipe tugas harus 'individu' atau 'kelompok'.\n\nContoh:\n${CONTOH_JALAN_PINTAS}`
      )
      return
    }

    const link = linkRaw === '-' || linkRaw === '' ? null : linkRaw

    let deadlineDate: Date
    try {
      deadlineDate = parseDeadlineWib(deadlineRaw)
    } catch (err: any) {
      const errorMsg =
        err instanceof DeadlineParseError ? err.message : 'Deadline tidak dapat dipahami.'
      await ctx.reply(
        `❌ ${errorMsg}\n\nContoh format deadline: 'hari ini', 'besok', 'lusa', 'senin', '5 okt', '5/10', '5 okt 14.00'`
      )
      return
    }

    try {
      const tugasBaru = await tambahTugas({
        judul,
        matkul,
        tipe: tipeNorm,
        link_pengumpulan: link,
        deadline: deadlineDate.toISOString(),
      })

      const formattedDeadline = formatDeadlineHumanWib(tugasBaru.deadline)
      await ctx.reply(
        `✅ Tugas berhasil ditambahkan!\n\n` +
          `📌 Judul: ${tugasBaru.judul}\n` +
          `📚 Mata Kuliah: ${tugasBaru.matkul}\n` +
          `👥 Tipe: ${tugasBaru.tipe === 'individu' ? 'Individu' : 'Kelompok'}\n` +
          `⏰ Deadline: ${formattedDeadline}\n` +
          `🔗 Link: ${tugasBaru.link_pengumpulan ?? '-'}`
      )
    } catch (err: any) {
      await ctx.reply(`❌ Gagal menyimpan tugas: ${err.message || 'Terjadi kesalahan sistem.'}`)
    }

    return
  }

  // 2. Mode bertahap: mulai tanya-jawab
  ctx.session = {
    flow: 'tugas',
    step: 'tugas_menunggu_judul',
    payload: {},
  }

  await ctx.reply(
    `📝 Membuat Tugas Baru (Mode Bertahap)\n\n` +
      `Silakan masukkan judul tugas:\n` +
      `(Ketik /batal kapan saja untuk membatalkan)`
  )
})

/**
 * Handler command /lewati untuk melewati input opsional (link pengumpulan).
 */
tugasComposer.command('lewati', async (ctx) => {
  if (ctx.session?.flow === 'tugas' && ctx.session.step === 'tugas_menunggu_link') {
    ctx.session.payload = {
      ...ctx.session.payload,
      link_pengumpulan: null,
    }
    ctx.session.step = 'tugas_menunggu_deadline'

    await ctx.reply(
      `🔗 Link pengumpulan dilewati.\n\n` +
        `⏰ Masukkan deadline tugas:\n` +
        `(Contoh: 'hari ini', 'besok', 'lusa', 'senin', '5 okt', '5/10', atau sertakan jam seperti '5 okt 14.00')`
    )
    return
  }

  await ctx.reply('Tidak ada langkah yang bisa dilewati saat ini.')
})

/**
 * Handler tombol inline untuk memilih tipe tugas (Individu / Kelompok).
 */
tugasComposer.callbackQuery(/^tugas:tipe:(individu|kelompok)$/, async (ctx) => {
  await ctx.answerCallbackQuery()

  if (ctx.session?.flow !== 'tugas' || ctx.session.step !== 'tugas_menunggu_tipe') {
    await ctx.reply('⚠️ Sesi pembuatan tugas ini sudah tidak aktif atau telah kedaluwarsa. Silakan ketik /tugas untuk mengulang.')
    return
  }

  const match = ctx.match
  const tipe = match[1] as 'individu' | 'kelompok'

  ctx.session.payload = {
    ...ctx.session.payload,
    tipe,
  }
  ctx.session.step = 'tugas_menunggu_link'

  await ctx.reply(
    `✅ Tipe dipilih: ${tipe === 'individu' ? '👤 Individu' : '👥 Kelompok'}\n\n` +
      `🔗 Masukkan link pengumpulan tugas:\n` +
      `(Ketik /lewati atau tanda minus (-) jika belum ada link)`
  )
})

/**
 * Handler tombol inline untuk konfirmasi simpan atau batal.
 */
tugasComposer.callbackQuery(/^tugas:konfirmasi:(simpan|batal)$/, async (ctx) => {
  await ctx.answerCallbackQuery()

  if (ctx.session?.flow !== 'tugas' || ctx.session.step !== 'tugas_konfirmasi') {
    await ctx.reply('⚠️ Sesi konfirmasi tugas sudah tidak aktif. Silakan ketik /tugas untuk membuat tugas baru.')
    return
  }

  const aksi = ctx.match[1]

  if (aksi === 'batal') {
    ctx.session = {}
    await ctx.reply('❌ Pembuatan tugas dibatalkan.')
    return
  }

  // Aksi simpan
  const payload = ctx.session.payload
  if (!payload?.judul || !payload?.matkul || !payload?.tipe || !payload?.deadline) {
    ctx.session = {}
    await ctx.reply('❌ Terjadi kesalahan data sesi tidak lengkap. Pembuatan tugas dibatalkan.')
    return
  }

  try {
    const tugasBaru = await tambahTugas({
      judul: payload.judul,
      matkul: payload.matkul,
      tipe: payload.tipe,
      link_pengumpulan: payload.link_pengumpulan ?? null,
      deadline: payload.deadline,
    })

    const deadlineFormatted = formatDeadlineHumanWib(tugasBaru.deadline)

    // Bersihkan sesi setelah berhasil disimpan
    ctx.session = {}

    await ctx.reply(
      `✅ Tugas berhasil disimpan!\n\n` +
        `📌 Judul: ${tugasBaru.judul}\n` +
        `📚 Mata Kuliah: ${tugasBaru.matkul}\n` +
        `👥 Tipe: ${tugasBaru.tipe === 'individu' ? 'Individu' : 'Kelompok'}\n` +
        `⏰ Deadline: ${deadlineFormatted}\n` +
        `🔗 Link: ${tugasBaru.link_pengumpulan ?? '-'}`
    )
  } catch (err: any) {
    await ctx.reply(`❌ Gagal menyimpan tugas ke database: ${err.message || 'Terjadi kesalahan sistem.'}`)
  }
})

/**
 * Handler pesan teks percakapan bertahap.
 */
tugasComposer.on('message:text', async (ctx, next) => {
  const session = ctx.session
  if (!session || session.flow !== 'tugas') {
    return next()
  }

  const text = ctx.message.text.trim()

  // Jika berupa slash command lain (misal /start, /help, /batal), teruskan ke middleware berikutnya
  if (text.startsWith('/')) {
    return next()
  }

  // Tahap 1: Menunggu Judul
  if (session.step === 'tugas_menunggu_judul') {
    if (!text) {
      await ctx.reply('❌ Judul tugas tidak boleh kosong. Silakan masukkan judul tugas:')
      return
    }

    session.payload = {
      ...session.payload,
      judul: text,
    }
    session.step = 'tugas_menunggu_matkul'

    await ctx.reply(`📌 Judul: ${text}\n\nSelanjutnya, masukkan nama mata kuliah:`)
    return
  }

  // Tahap 2: Menunggu Mata Kuliah
  if (session.step === 'tugas_menunggu_matkul') {
    if (!text) {
      await ctx.reply('❌ Nama mata kuliah tidak boleh kosong. Silakan masukkan nama mata kuliah:')
      return
    }

    session.payload = {
      ...session.payload,
      matkul: text,
    }
    session.step = 'tugas_menunggu_tipe'

    const keyboard = new InlineKeyboard()
      .text('👤 Individu', 'tugas:tipe:individu')
      .text('👥 Kelompok', 'tugas:tipe:kelompok')

    await ctx.reply(
      `📚 Mata Kuliah: ${text}\n\nPilih tipe tugas:`,
      { reply_markup: keyboard }
    )
    return
  }

  // Tahap 3: Menunggu Tipe (jika pengguna mengetik manual alih-alih klik tombol inline)
  if (session.step === 'tugas_menunggu_tipe') {
    const norm = text.toLowerCase()
    if (norm === 'individu' || norm === 'kelompok') {
      session.payload = {
        ...session.payload,
        tipe: norm,
      }
      session.step = 'tugas_menunggu_link'

      await ctx.reply(
        `✅ Tipe dipilih: ${norm === 'individu' ? '👤 Individu' : '👥 Kelompok'}\n\n` +
          `🔗 Masukkan link pengumpulan tugas:\n` +
          `(Ketik /lewati atau tanda minus (-) jika belum ada link)`
      )
      return
    }

    const keyboard = new InlineKeyboard()
      .text('👤 Individu', 'tugas:tipe:individu')
      .text('👥 Kelompok', 'tugas:tipe:kelompok')

    await ctx.reply(
      `Silakan pilih tipe tugas menggunakan tombol di bawah atau ketik 'individu' / 'kelompok':`,
      { reply_markup: keyboard }
    )
    return
  }

  // Tahap 4: Menunggu Link Pengumpulan
  if (session.step === 'tugas_menunggu_link') {
    const link = text === '-' || text.toLowerCase() === 'lewati' ? null : text

    session.payload = {
      ...session.payload,
      link_pengumpulan: link,
    }
    session.step = 'tugas_menunggu_deadline'

    await ctx.reply(
      `🔗 Link: ${link ?? '-'}\n\n` +
        `⏰ Masukkan deadline tugas:\n` +
        `(Contoh: 'hari ini', 'besok', 'lusa', 'senin', '5 okt', '5/10', atau sertakan jam seperti '5 okt 14.00')`
    )
    return
  }

  // Tahap 5: Menunggu Deadline
  if (session.step === 'tugas_menunggu_deadline') {
    let deadlineDate: Date
    try {
      deadlineDate = parseDeadlineWib(text)
    } catch (err: any) {
      const errorMsg =
        err instanceof DeadlineParseError ? err.message : 'Deadline tidak dapat dipahami.'
      await ctx.reply(
        `❌ ${errorMsg}\n\nSilakan masukkan ulang deadline yang benar:\n` +
          `(Contoh: 'besok', 'lusa', 'senin', '5 okt', '5/10', '5 okt 14.00')`
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
    session.step = 'tugas_konfirmasi'

    const keyboard = new InlineKeyboard()
      .text('✅ Simpan', 'tugas:konfirmasi:simpan')
      .text('❌ Batal', 'tugas:konfirmasi:batal')

    await ctx.reply(
      `📋 Ringkasan Tugas Baru:\n` +
        `• Judul: ${session.payload.judul}\n` +
        `• Mata Kuliah: ${session.payload.matkul}\n` +
        `• Tipe: ${session.payload.tipe === 'individu' ? 'Individu' : 'Kelompok'}\n` +
        `• Link: ${session.payload.link_pengumpulan ?? '-'}\n` +
        `• Deadline: ${deadlineFormatted}\n\n` +
        `Apakah data di atas sudah benar?`,
      { reply_markup: keyboard }
    )
    return
  }

  return next()
})
