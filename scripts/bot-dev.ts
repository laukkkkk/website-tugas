import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createBot } from '../server/bot/bot.js'

// Memuat environment variables dari .env.local atau .env tanpa mencetak nilainya
function loadEnv() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  const rootDir = path.resolve(__dirname, '..')

  for (const envFile of ['.env.local', '.env']) {
    const fullPath = path.join(rootDir, envFile)
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf-8')
      for (const line of content.split('\n')) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue
        const eqIdx = trimmed.indexOf('=')
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim()
          let val = trimmed.slice(eqIdx + 1).trim()
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1)
          }
          if (process.env[key] === undefined) {
            process.env[key] = val
          }
        }
      }
    }
  }
}

loadEnv()

async function main() {
  console.log('🤖 Menyiapkan bot Telegram untuk pengembangan lokal...')

  if (!process.env.BOT_TOKEN) {
    console.error('❌ BOT_TOKEN belum disetel di file environment.')
    process.exit(1)
  }

  if (!process.env.OWNER_CHAT_ID) {
    console.warn('⚠️ PERINGATAN: OWNER_CHAT_ID belum disetel. Bot akan mengabaikan semua pesan.')
  }

  const bot = createBot()

  // Pastikan webhook dihapus sebelum memulai mode long polling
  console.log('🔄 Memastikan webhook Telegram dinonaktifkan untuk mode polling...')
  try {
    await bot.api.deleteWebhook({ drop_pending_updates: true })
    console.log('✅ Webhook berhasil dihapus (drop pending updates: true).')
  } catch (err: any) {
    console.warn('⚠️ Gagal menghapus webhook (mungkin belum disetel):', err?.message || err)
  }

  // Tangani sinyal penghentian proses (graceful shutdown)
  process.once('SIGINT', () => {
    console.log('\n🛑 Menghentikan bot Telegram (SIGINT)...')
    bot.stop()
  })
  process.once('SIGTERM', () => {
    console.log('\n🛑 Menghentikan bot Telegram (SIGTERM)...')
    bot.stop()
  })

  console.log('🚀 Menjalankan bot Telegram dengan Long Polling...')
  console.log('ℹ️ Hanya pesan dari OWNER_CHAT_ID yang akan diproses.')
  console.log('ℹ️ Tekan Ctrl+C untuk menghentikan bot.')

  await bot.start({
    onStart: (botInfo) => {
      console.log(`✨ Bot @${botInfo.username} berhasil berjalan dan siap menerima pesan!`)
    },
  })
}

main().catch((err) => {
  console.error('❌ Terjadi kesalahan fatal pada bot:', err)
  process.exit(1)
})
