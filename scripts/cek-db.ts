import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { supabaseAdmin } from '../server/lib/supabase.js'

// Otomatis memuat .env.local atau .env jika dijalankan langsung lewat script
function loadEnvFiles() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  const rootDir = path.resolve(__dirname, '..')

  const envFiles = ['.env.local', '.env']
  for (const file of envFiles) {
    const fullPath = path.join(rootDir, file)
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf-8')
      for (const line of content.split('\n')) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue
        const eqIdx = trimmed.indexOf('=')
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim()
          let val = trimmed.slice(eqIdx + 1).trim()
          // Hapus kutip jika ada
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

loadEnvFiles()

async function main() {
  console.log('--- 🔍 Menjalankan Pemeriksaan Database Supabase ---')

  const dummyTugas = {
    judul: 'Tes Koneksi Database Automated Script',
    matkul: 'Uji Coba Fondasi',
    tipe: 'individu' as const,
    link_pengumpulan: 'https://example.com/pengumpulan-tes',
    deadline: new Date(Date.now() + 2 * 86400000).toISOString(),
    selesai: false,
  }

  // 1. Tulis satu baris percobaan ke tabel tugas
  console.log('1. Menulis satu baris percobaan ke tabel tugas...')
  const { data: insertedData, error: insertError } = await supabaseAdmin
    .from('tugas')
    .insert(dummyTugas)
    .select()
    .single()

  if (insertError) {
    console.error('❌ Gagal menulis ke tabel tugas:', insertError.message)
    process.exit(1)
  }

  console.log('✅ Baris berhasil ditulis dengan ID:', insertedData.id)

  // 2. Membaca baris tersebut
  console.log('2. Membaca baris yang baru ditulis...')
  const { data: readData, error: readError } = await supabaseAdmin
    .from('tugas')
    .select('*')
    .eq('id', insertedData.id)
    .single()

  if (readError) {
    console.error('❌ Gagal membaca baris dari tabel tugas:', readError.message)
    process.exit(1)
  }

  console.log('✅ Berhasil membaca data:')
  console.log('   - Judul   :', readData.judul)
  console.log('   - Matkul  :', readData.matkul)
  console.log('   - Tipe    :', readData.tipe)
  console.log('   - Deadline:', readData.deadline)

  // 3. Menghapus baris percobaan
  console.log('3. Menghapus baris percobaan...')
  const { error: deleteError } = await supabaseAdmin
    .from('tugas')
    .delete()
    .eq('id', insertedData.id)

  if (deleteError) {
    console.error('❌ Gagal menghapus baris percobaan:', deleteError.message)
    process.exit(1)
  }

  console.log('✅ Baris percobaan berhasil dihapus.')
  console.log('🎉 Semua tes operasi database (Insert, Read, Delete) BERHASIL!')
}

main().catch((err) => {
  console.error('❌ Terjadi kesalahan fatal:', err)
  process.exit(1)
})
