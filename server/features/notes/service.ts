import type { SupabaseClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '../../lib/supabase.js'
import type { Note, TambahNoteInput, UbahNoteInput } from './types.js'

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends Error {
  constructor(message: string = 'Catatan tidak ditemukan') {
    super(message)
    this.name = 'NotFoundError'
  }
}

/**
 * Menambahkan catatan baru.
 * Hanya kolom 'isi' yang disimpan, wajib dan tidak boleh kosong atau hanya spasi.
 */
export async function tambah(
  input: TambahNoteInput,
  client: SupabaseClient = supabaseAdmin
): Promise<Note> {
  if (!input.isi || typeof input.isi !== 'string' || !input.isi.trim()) {
    throw new ValidationError('Isi catatan wajib diisi.')
  }

  const payload = {
    isi: input.isi.trim(),
  }

  const { data, error } = await client
    .from('notes')
    .insert(payload)
    .select('*')
    .single()

  if (error || !data) {
    throw new Error(error?.message || 'Gagal menambahkan catatan ke database.')
  }

  return data as Note
}

/**
 * Mengambil semua catatan.
 * Urutan: yang terakhir diedit di atas (updated_at DESC).
 */
export async function ambilSemua(
  client: SupabaseClient = supabaseAdmin
): Promise<Note[]> {
  const { data, error } = await client
    .from('notes')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data || []) as Note[]
}

/**
 * Mengambil satu catatan berdasarkan ID.
 */
export async function ambilById(
  id: string,
  client: SupabaseClient = supabaseAdmin
): Promise<Note> {
  if (!id || !id.trim()) {
    throw new ValidationError('ID catatan wajib diisi.')
  }

  const { data, error } = await client
    .from('notes')
    .select('*')
    .eq('id', id.trim())
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    throw new NotFoundError('Catatan tidak ditemukan.')
  }

  return data as Note
}

/**
 * Memperbarui catatan.
 * Hanya kolom 'isi' yang diperbarui, wajib dan tidak boleh kosong atau hanya spasi.
 * Otomatis memperbarui kolom updated_at ke waktu sekarang.
 */
export async function ubah(
  id: string,
  input: UbahNoteInput,
  client: SupabaseClient = supabaseAdmin
): Promise<Note> {
  if (!id || !id.trim()) {
    throw new ValidationError('ID catatan wajib diisi.')
  }

  if (!input.isi || typeof input.isi !== 'string' || !input.isi.trim()) {
    throw new ValidationError('Isi catatan tidak boleh kosong.')
  }

  // Pastikan record ada
  await ambilById(id, client)

  const updates = {
    isi: input.isi.trim(),
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await client
    .from('notes')
    .update(updates)
    .eq('id', id.trim())
    .select('*')
    .single()

  if (error || !data) {
    throw new Error(error?.message || 'Gagal memperbarui catatan.')
  }

  return data as Note
}

/**
 * Menghapus catatan berdasarkan ID.
 */
export async function hapus(
  id: string,
  client: SupabaseClient = supabaseAdmin
): Promise<void> {
  if (!id || !id.trim()) {
    throw new ValidationError('ID catatan wajib diisi.')
  }

  // Pastikan record ada sebelum dihapus
  await ambilById(id, client)

  const { error } = await client
    .from('notes')
    .delete()
    .eq('id', id.trim())

  if (error) {
    throw new Error(error.message || 'Gagal menghapus catatan.')
  }
}
