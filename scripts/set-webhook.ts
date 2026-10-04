import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

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
          if (
            (val.startsWith('"') && val.endsWith('"')) ||
            (val.startsWith("'") && val.endsWith("'"))
          ) {
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

const BOT_TOKEN = process.env.BOT_TOKEN
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET

interface TelegramResponse<T = unknown> {
  ok: boolean
  result?: T
  description?: string
  error_code?: number
}

async function callTelegram<T = unknown>(
  method: string,
  payload?: Record<string, unknown>
): Promise<TelegramResponse<T>> {
  if (!BOT_TOKEN) {
    throw new Error('BOT_TOKEN belum disetel di environment variable (.env / .env.local).')
  }

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/${method}`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: payload ? JSON.stringify(payload) : undefined,
  })

  return (await response.json()) as TelegramResponse<T>
}

async function main() {
  const args = process.argv.slice(2)
  const command = args[0]?.trim()

  if (!BOT_TOKEN) {
    console.error('❌ Error: BOT_TOKEN wajib disetel di file environment (.env / .env.local).')
    process.exit(1)
  }

  // Opsi 1: Menghapus webhook
  if (command === '--delete' || command === '-d' || command === 'delete') {
    console.log('🗑️  Menghapus webhook Telegram...')
    try {
      const res = await callTelegram('deleteWebhook', {
        drop_pending_updates: true,
      })
      if (res.ok) {
        console.log('✅ Webhook berhasil dihapus dari Telegram.')
      } else {
        console.error(`❌ Gagal menghapus webhook: ${res.description || 'Unknown error'}`)
        process.exit(1)
      }
    } catch (err) {
      console.error('❌ Terjadi kesalahan saat menghapus webhook:', err)
      process.exit(1)
    }
    return
  }

  // Opsi 2: Melihat info status webhook saat ini
  if (command === '--info' || command === '-i' || command === 'info') {
    console.log('ℹ️  Mengambil status webhook Telegram...')
    try {
      const res = await callTelegram<Record<string, unknown>>('getWebhookInfo')
      if (res.ok) {
        console.log('📋 Status Webhook Saat Ini:')
        console.log(JSON.stringify(res.result, null, 2))
      } else {
        console.error(`❌ Gagal mengambil info webhook: ${res.description}`)
        process.exit(1)
      }
    } catch (err) {
      console.error('❌ Terjadi kesalahan:', err)
      process.exit(1)
    }
    return
  }

  // Opsi 3: Bantuan / Help
  if (command === '--help' || command === '-h' || command === 'help') {
    console.log(`
Penggunaan skrip set-webhook:
  npx tsx scripts/set-webhook.ts <URL_PRODUKSI>     # Daftarkan webhook ke URL produksi
  npx tsx scripts/set-webhook.ts --delete          # Hapus webhook Telegram
  npx tsx scripts/set-webhook.ts --info            # Lihat info status webhook saat ini

Contoh:
  npx tsx scripts/set-webhook.ts https://website-tugas.vercel.app
`)
    return
  }

  // Opsi 4: Mendaftarkan Webhook ke URL Produksi
  let baseUrl = command || process.env.APP_URL || process.env.VERCEL_URL

  if (!baseUrl) {
    console.error(`
❌ Error: URL produksi belum diberikan!

Penggunaan:
  npx tsx scripts/set-webhook.ts https://<project-anda>.vercel.app

Atau set APP_URL / VERCEL_URL di file .env / environment.
`)
    process.exit(1)
  }

  // Normalisasi URL
  baseUrl = baseUrl.trim()
  if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    baseUrl = `https://${baseUrl}`
  }

  if (baseUrl.startsWith('http://')) {
    console.warn('⚠️ Peringatan: Telegram mengharuskan HTTPS untuk webhook produksi.')
  }

  baseUrl = baseUrl.replace(/\/+$/, '')
  const webhookUrl = baseUrl.endsWith('/api/bot') ? baseUrl : `${baseUrl}/api/bot`

  console.log(`🌐 Mendaftarkan webhook Telegram ke: ${webhookUrl}`)

  if (!WEBHOOK_SECRET) {
    console.warn(
      '⚠️ PERINGATAN: TELEGRAM_WEBHOOK_SECRET belum disetel. Disarankan menyetel secret_token demi keamanan request.'
    )
  }

  try {
    const payload: Record<string, unknown> = {
      url: webhookUrl,
      allowed_updates: ['message', 'callback_query'],
      drop_pending_updates: false,
    }

    if (WEBHOOK_SECRET) {
      payload.secret_token = WEBHOOK_SECRET
    }

    const res = await callTelegram('setWebhook', payload)

    if (res.ok) {
      console.log('✅ Webhook Telegram BERHASIL didaftarkan!')
      console.log(`   URL Endpoint: ${webhookUrl}`)
      if (WEBHOOK_SECRET) {
        console.log('   Secret Token: [Dikonfigurasi]')
      }

      // Ambil konfirmasi status
      const info = await callTelegram<Record<string, unknown>>('getWebhookInfo')
      if (info.ok && info.result) {
        console.log('\n📊 Konfirmasi Telegram Webhook Info:')
        console.log(`   URL Terdaftar: ${info.result.url}`)
        console.log(`   Pending Updates: ${info.result.pending_update_count ?? 0}`)
        console.log(`   Custom Certificate: ${info.result.has_custom_certificate ? 'Ya' : 'Tidak'}`)
      }
    } else {
      console.error(`❌ Gagal mendaftarkan webhook Telegram: ${res.description}`)
      process.exit(1)
    }
  } catch (err) {
    console.error('❌ Terjadi kesalahan saat memanggil API Telegram:', err)
    process.exit(1)
  }
}

main()
