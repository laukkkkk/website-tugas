import type { SupabaseClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '../../lib/supabase.js'
import type { Todo, TambahTodoInput, UbahTodoInput } from './types.js'

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends Error {
  constructor(message: string = 'Item to-do tidak ditemukan') {
    super(message)
    this.name = 'NotFoundError'
  }
}

/**
 * Menambahkan to-do baru.
 */
export async function tambah(
  input: TambahTodoInput,
  client: SupabaseClient = supabaseAdmin
): Promise<Todo> {
  if (!input.teks || typeof input.teks !== 'string' || !input.teks.trim()) {
    throw new ValidationError('Teks to-do wajib diisi.')
  }

  const payload = {
    teks: input.teks.trim(),
    selesai: false,
  }

  const { data, error } = await client
    .from('todos')
    .insert(payload)
    .select('*')
    .single()

  if (error || !data) {
    throw new Error(error?.message || 'Gagal menambahkan to-do ke database.')
  }

  return data as Todo
}

/**
 * Mengambil semua to-do.
 * Urutan: yang belum selesai di atas (selesai ASC: false < true), lalu dibuat terbaru (created_at DESC).
 */
export async function ambilSemua(
  client: SupabaseClient = supabaseAdmin
): Promise<Todo[]> {
  const { data, error } = await client
    .from('todos')
    .select('*')
    .order('selesai', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data || []) as Todo[]
}

/**
 * Mengambil satu to-do berdasarkan ID.
 */
export async function ambilById(
  id: string,
  client: SupabaseClient = supabaseAdmin
): Promise<Todo> {
  if (!id || !id.trim()) {
    throw new ValidationError('ID to-do wajib diisi.')
  }

  const { data, error } = await client
    .from('todos')
    .select('*')
    .eq('id', id.trim())
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    throw new NotFoundError('Item to-do tidak ditemukan.')
  }

  return data as Todo
}

/**
 * Memperbarui to-do (teks dan/atau status selesai).
 */
export async function ubah(
  id: string,
  input: UbahTodoInput,
  client: SupabaseClient = supabaseAdmin
): Promise<Todo> {
  if (!id || !id.trim()) {
    throw new ValidationError('ID to-do wajib diisi.')
  }

  const updates: Record<string, unknown> = {}

  if (input.teks !== undefined) {
    if (typeof input.teks !== 'string' || !input.teks.trim()) {
      throw new ValidationError('Teks to-do tidak boleh kosong.')
    }
    updates.teks = input.teks.trim()
  }

  if (input.selesai !== undefined) {
    if (typeof input.selesai !== 'boolean') {
      throw new ValidationError("Nilai 'selesai' harus berupa boolean (true atau false).")
    }
    updates.selesai = input.selesai
  }

  if (Object.keys(updates).length === 0) {
    throw new ValidationError('Tidak ada data yang diperbarui.')
  }

  await ambilById(id, client)

  const { data, error } = await client
    .from('todos')
    .update(updates)
    .eq('id', id.trim())
    .select('*')
    .single()

  if (error || !data) {
    throw new Error(error?.message || 'Gagal memperbarui item to-do.')
  }

  return data as Todo
}

/**
 * Menandai status selesai to-do (ceklis / unceklis).
 */
export async function ceklis(
  id: string,
  selesai: boolean = true,
  client: SupabaseClient = supabaseAdmin
): Promise<Todo> {
  return ubah(id, { selesai }, client)
}

/**
 * Menghapus to-do berdasarkan ID.
 */
export async function hapus(
  id: string,
  client: SupabaseClient = supabaseAdmin
): Promise<void> {
  if (!id || !id.trim()) {
    throw new ValidationError('ID to-do wajib diisi.')
  }

  await ambilById(id, client)

  const { error } = await client
    .from('todos')
    .delete()
    .eq('id', id.trim())

  if (error) {
    throw new Error(error.message)
  }
}
