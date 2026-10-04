import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const distAssetsDir = path.join(rootDir, 'dist', 'assets')

function loadSecrets(): Map<string, string> {
  const secrets = new Map<string, string>()
  const secretKeys = [
    'SUPABASE_SERVICE_ROLE_KEY',
    'BOT_TOKEN',
    'REMINDER_SECRET',
    'TELEGRAM_WEBHOOK_SECRET',
  ]

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
          if (secretKeys.includes(key) && val.length >= 8) {
            secrets.set(key, val)
          }
        }
      }
    }
  }

  // Juga cek process.env
  for (const key of secretKeys) {
    const val = process.env[key]
    if (val && val.length >= 8 && !secrets.has(key)) {
      secrets.set(key, val)
    }
  }

  return secrets
}

function getAllFiles(dirPath: string): string[] {
  let files: string[] = []
  if (!fs.existsSync(dirPath)) return files

  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name)
    if (entry.isDirectory()) {
      files = files.concat(getAllFiles(fullPath))
    } else {
      files.push(fullPath)
    }
  }
  return files
}

async function main() {
  console.log('🔍 Memulai audit keamanan bundle frontend (dist/)...')

  if (!fs.existsSync(distAssetsDir)) {
    console.error(`❌ Folder ${distAssetsDir} tidak ditemukan! Pastikan sudah menjalankan 'npm run build'.`)
    process.exit(1)
  }

  const files = getAllFiles(distAssetsDir)
  if (files.length === 0) {
    console.error(`❌ Tidak ada file ditemukan di ${distAssetsDir}.`)
    process.exit(1)
  }

  const secrets = loadSecrets()
  let leakFound = false

  // Baca seluruh isi file bundle
  const bundleContents: { file: string; content: string }[] = files.map((f) => ({
    file: path.relative(rootDir, f),
    content: fs.readFileSync(f, 'utf-8'),
  }))

  // 1. Cek nilai literal rahasia
  for (const [key, val] of secrets.entries()) {
    for (const b of bundleContents) {
      if (b.content.includes(val)) {
        console.error(`🚨 BAHAYA: Nilai rahasia '${key}' ditemukan di ${b.file}!`)
        leakFound = true
      }
    }
  }

  // 2. Cek pola kunci server berbahaya
  const dangerousPatterns = [
    'SUPABASE_SERVICE_ROLE_KEY',
    'REMINDER_SECRET',
    'TELEGRAM_WEBHOOK_SECRET',
  ]

  for (const pattern of dangerousPatterns) {
    for (const b of bundleContents) {
      if (b.content.includes(pattern)) {
        console.error(`🚨 PERINGATAN: Nama variabel '${pattern}' ditemukan di ${b.file}!`)
        leakFound = true
      }
    }
  }

  console.log('--------------------------------------------------------')
  if (leakFound) {
    console.error('❌ AUDIT GAGAL: Terdeteksi kebocoran kunci rahasia ke bundle client frontend!')
    process.exit(1)
  } else {
    console.log('✅ AUDIT SUKSES: Bundle frontend bersih!')
    console.log(`   Diverifikasi ${files.length} file di dist/assets: tidak ada SUPABASE_SERVICE_ROLE_KEY, BOT_TOKEN, atau REMINDER_SECRET.`)
    process.exit(0)
  }
}

main()
