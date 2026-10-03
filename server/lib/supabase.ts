import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Mengambil Supabase URL dari environment variables.
 */
export function getSupabaseUrl(): string {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  if (!url) {
    throw new Error('SUPABASE_URL atau VITE_SUPABASE_URL belum dikonfigurasi di environment variable.')
  }
  return url
}

/**
 * Mengambil Supabase Service Role Key (khusus server).
 */
export function getSupabaseServiceRoleKey(): string {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi di environment variable.')
  }
  return serviceKey
}

/**
 * Mengambil Supabase Anon Key.
 */
export function getSupabaseAnonKey(): string {
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  if (!anonKey) {
    throw new Error('VITE_SUPABASE_ANON_KEY atau SUPABASE_ANON_KEY belum dikonfigurasi di environment variable.')
  }
  return anonKey
}

let _supabaseAdmin: SupabaseClient | null = null

/**
 * Klien Supabase Admin dengan Service Role Key.
 * Hanya digunakan di sisi server/backend (melewati Row Level Security).
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    const url = getSupabaseUrl()
    const serviceRoleKey = getSupabaseServiceRoleKey()

    _supabaseAdmin = createClient(url, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  }
  return _supabaseAdmin
}

/**
 * Shortcut instance Supabase Admin.
 * Menggunakan Proxy agar inisialisasi dilakukan saat pertama kali diakses,
 * sehingga tidak melempar error saat module di-import sebelum env dimuat.
 */
export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const client = getSupabaseAdmin()
    const value = Reflect.get(client, prop, receiver)
    return typeof value === 'function' ? value.bind(client) : value
  },
})

/**
 * Membuat klien Supabase untuk token akses pengguna tertentu.
 * Menggunakan Anon Key dan menyertakan header Authorization: Bearer <accessToken>,
 * sehingga request tunduk pada aturan Row Level Security (role: authenticated).
 */
export function createSupabaseUserClient(accessToken: string): SupabaseClient {
  const url = getSupabaseUrl()
  const anonKey = getSupabaseAnonKey()

  return createClient(url, anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
