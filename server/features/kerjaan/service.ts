import type { SupabaseClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '../../lib/supabase.js'
import { parseDeadlineInput } from '../../../shared/deadline.js'
import type { Kerjaan, TambahKerjaanInput, UbahKerjaanInput } from './types.js'

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends Error {
  constructor(message: string = 'Kerjaan tidak ditemukan') {
    super(message)
    this.name = 'NotFoundError'
  }
}

/**
 * Validasi dan normalisasi deadline ke format ISO string.
 * Jika hanya berisi tanggal (YYYY-MM-DD), default jam diset ke 23:59:00 WIB (+07:00).
 */
export function normalizeDeadline(deadlineInput: string | Date | undefined | null): string {
  if (!deadlineInput) {
    throw new ValidationError('Deadline wajib diisi.')
  }

  let dateObj: Date
  if (typeof deadlineInput === 'string') {
    const trimmed = deadlineInput.trim()
    if (!trimmed) {
      throw new ValidationError('Deadline tidak boleh kosong.')
    }
    dateObj = parseDeadlineInput(trimmed)
  } else {
    dateObj = deadlineInput
  }

  if (isNaN(dateObj.getTime())) {
    throw new ValidationError('Deadline harus tanggal yang valid.')
  }

  return dateObj.toISOString()
}

/**
 * Menambahkan kerjaan baru.
 */
export async function tambah(
  input: TambahKerjaanInput,
  client: SupabaseClient = supabaseAdmin
): Promise<Kerjaan> {
  if (!input.judul || typeof input.judul !== 'string' || !input.judul.trim()) {
    throw new ValidationError('Judul kerjaan wajib diisi.')
  }

  const deadlineIso = normalizeDeadline(input.deadline)

  const payload = {
    judul: input.judul.trim(),
    deskripsi: input.deskripsi?.trim() || null,
    deadline: deadlineIso,
    selesai: false,
  }

  const { data, error } = await client
    .from('kerjaan')
    .insert(payload)
    .select('*')
    .single()

  if (error || !data) {
    throw new Error(error?.message || 'Gagal menambahkan kerjaan ke database.')
  }

  return data as Kerjaan
}

/**
 * Mengambil semua kerjaan.
 * Urutan: yang belum selesai di atas (diurutkan per deadline terdekat), lalu yang selesai di bawah.
 */
export async function ambilSemua(
  client: SupabaseClient = supabaseAdmin
): Promise<Kerjaan[]> {
  const { data, error } = await client
    .from('kerjaan')
    .select('*')
    .order('selesai', { ascending: true })
    .order('deadline', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data || []) as Kerjaan
}

/**
 * Mengambil hanya kerjaan yang belum selesai.
 * Diurutkan dari deadline terdekat.
 */
export async function ambilBelumSelesai(
  client: SupabaseClient = supabaseAdmin
): Promise<Kerjaan[]> {
  const { data, error } = await client
    .from('kerjaan')
    .select('*')
    .eq('selesai', false)
    .order('deadline', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data || []) as Kerjaan
}

/**
 * Mengambil satu kerjaan berdasarkan ID.
 */
export async function ambilById(
  id: string,
  client: SupabaseClient = supabaseAdmin
): Promise<Kerjaan> {
  if (!id || !id.trim()) {
    throw new ValidationError('ID kerjaan wajib diisi.')
  }

  const { data, error } = await client
    .from('kerjaan')
    .select('*')
    .eq('id', id.trim())
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    throw new NotFoundError('Kerjaan tidak ditemukan.')
  }

  return data as Kerjaan
}

/**
 * Memperbarui data kerjaan.
 */
export async function ubah(
  id: string,
  input: UbahKerjaanInput,
  client: SupabaseClient = supabaseAdmin
): Promise<Kerjaan> {
  if (!id || !id.trim()) {
    throw new ValidationError('ID kerjaan wajib diisi.')
  }

  const updates: Record<string, unknown> = {}

  if (input.judul !== undefined) {
    if (typeof input.judul !== 'string' || !input.judul.trim()) {
      throw new ValidationError('Judul kerjaan tidak boleh kosong.')
    }
    updates.judul = input.judul.trim()
  }

  if (input.deskripsi !== undefined) {
    updates.deskripsi = input.deskripsi?.trim() || null
  }

  if (input.deadline !== undefined) {
    updates.deadline = normalizeDeadline(input.deadline)
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

  // Pastikan record ada
  await ambilById(id, client)

  const { data, error } = await client
    .from('kerjaan')
    .update(updates)
    .eq('id', id.trim())
    .select('*')
    .single()

  if (error || !data) {
    throw new Error(error?.message || 'Gagal memperbarui data kerjaan.')
  }

  return data as Kerjaan
}

/**
 * Menghapus kerjaan berdasarkan ID.
 */
export async function hapus(
  id: string,
  client: SupabaseClient = supabaseAdmin
): Promise<void> {
  if (!id || !id.trim()) {
    throw new ValidationError('ID kerjaan wajib diisi.')
  }

  await ambilById(id, client)

  const { error } = await client
    .from('kerjaan')
    .delete()
    .eq('id', id.trim())

  if (error) {
    throw new Error(error.message)
  }
}

/**
 * Menandai status selesai kerjaan (ceklis / unceklis).
 */
export async function tandaiSelesai(
  id: string,
  selesai: boolean = true,
  client: SupabaseClient = supabaseAdmin
): Promise<Kerjaan> {
  return ubah(id, { selesai }, client)
}
