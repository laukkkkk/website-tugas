import type { StorageAdapter } from 'grammy'
import type { SupabaseClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '../lib/supabase.js'

/**
 * Batas waktu inaktivitas sesi: 30 menit (dalam milidetik).
 */
export const SESSION_TTL_MS = 30 * 60 * 1000

export interface SupabaseSessionAdapterOptions {
  supabase?: SupabaseClient
  ttlMs?: number
  tableName?: string
}

/**
 * StorageAdapter untuk grammY yang menyimpan sesi percakapan ke tabel Supabase `bot_sessions`.
 * Sesi yang tidak aktif selama lebih dari 30 menit akan kedaluwarsa dan di-reset.
 */
export class SupabaseSessionAdapter<T> implements StorageAdapter<T> {
  private supabase: SupabaseClient
  private ttlMs: number
  private tableName: string

  constructor(options?: SupabaseSessionAdapterOptions) {
    this.supabase = options?.supabase ?? supabaseAdmin
    this.ttlMs = options?.ttlMs ?? SESSION_TTL_MS
    this.tableName = options?.tableName ?? 'bot_sessions'
  }

  /**
   * Membaca sesi berdasarkan key.
   * Jika sesi sudah tidak aktif lebih dari 30 menit, sesi dihapus dan mengembalikan undefined (reset).
   */
  async read(key: string): Promise<T | undefined> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('value, updated_at')
      .eq('key', key)
      .maybeSingle()

    if (error || !data) {
      return undefined
    }

    const updatedAt = new Date(data.updated_at).getTime()
    const now = Date.now()

    // Cek kedaluwarsa (inaktivitas > 30 menit)
    if (now - updatedAt > this.ttlMs) {
      await this.delete(key)
      return undefined
    }

    return data.value as T
  }

  /**
   * Menyimpan atau memperbarui sesi berdasarkan key ke tabel bot_sessions.
   */
  async write(key: string, value: T): Promise<void> {
    const nowIso = new Date().toISOString()
    const { error } = await this.supabase
      .from(this.tableName)
      .upsert(
        {
          key,
          value,
          updated_at: nowIso,
        },
        { onConflict: 'key' }
      )

    if (error) {
      console.error(`Gagal menyimpan sesi untuk key "${key}":`, error.message)
    }
  }

  /**
   * Menghapus sesi berdasarkan key.
   */
  async delete(key: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('key', key)

    if (error) {
      console.error(`Gagal menghapus sesi untuk key "${key}":`, error.message)
    }
  }
}
