import type { SupabaseClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '../../lib/supabase.js'
import { parseDeadlineInput } from '../../../shared/deadline.js'
import type { Tugas, TambahTugasInput, UbahTugasInput } from './types.js'

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends Error {
  constructor(message: string = 'Tugas tidak ditemukan') {
    super(message)
    this.name = 'NotFoundError'
  }
}

/**
 * Validasi dan normalisasi deadline ke ISO string.
 * Jika hanya format tanggal YYYY-MM-DD, default jam diset ke 23:59:00 WIB (+07:00).
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
 * Validasi tipe tugas ('individu' | 'kelompok')
 */
export function validateTipe(tipe: unknown): 'individu' | 'kelompok' {
  if (tipe !== 'individu' && tipe !== 'kelompok') {
    throw new ValidationError("Tipe tugas harus 'individu' atau 'kelompok'.")
  }
  return tipe
}

/**
 * Menambahkan tugas baru.
 */
export async function tambah(
  input: TambahTugasInput,
  client: SupabaseClient = supabaseAdmin
): Promise<Tugas> {
  if (!input.judul || typeof input.judul !== 'string' || !input.judul.trim()) {
    throw new ValidationError('Judul tugas wajib diisi.')
  }

  if (!input.matkul || typeof input.matkul !== 'string' || !input.matkul.trim()) {
    throw new ValidationError('Mata kuliah wajib diisi.')
  }

  const tipe = validateTipe(input.tipe)
  const deadlineIso = normalizeDeadline(input.deadline)

  const payload = {
    judul: input.judul.trim(),
    matkul: input.matkul.trim(),
    tipe,
    link_pengumpulan: input.link_pengumpulan?.trim() || null,
    deadline: deadlineIso,
    selesai: false,
  }

  const { data, error } = await client
    .from('tugas')
    .insert(payload)
    .select('*')
    .single()

  if (error || !data) {
    throw new Error(error?.message || 'Gagal menambahkan tugas ke database.')
  }

  return data as Tugas
}

/**
 * Mengambil semua tugas.
 * Urutan: yang belum selesai di atas (diurutkan per deadline terdekat), lalu yang selesai di bawah.
 */
export async function ambilSemua(
  client: SupabaseClient = supabaseAdmin
): Promise<Tugas[]> {
  const { data, error } = await client
    .from('tugas')
    .select('*')
    .order('selesai', { ascending: true })
    .order('deadline', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data || []) as Tugas[]
}

/**
 * Mengambil hanya tugas yang belum selesai.
 * Diurutkan dari deadline terdekat.
 */
export async function ambilBelumSelesai(
  client: SupabaseClient = supabaseAdmin
): Promise<Tugas[]> {
  const { data, error } = await client
    .from('tugas')
    .select('*')
    .eq('selesai', false)
    .order('deadline', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data || []) as Tugas[]
}

/**
 * Mengambil satu tugas berdasarkan ID.
 */
export async function ambilById(
  id: string,
  client: SupabaseClient = supabaseAdmin
): Promise<Tugas> {
  if (!id || !id.trim()) {
    throw new ValidationError('ID tugas wajib diisi.')
  }

  const { data, error } = await client
    .from('tugas')
    .select('*')
    .eq('id', id.trim())
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    throw new NotFoundError('Tugas tidak ditemukan.')
  }

  return data as Tugas
}

/**
 * Memperbarui data tugas.
 */
export async function ubah(
  id: string,
  input: UbahTugasInput,
  client: SupabaseClient = supabaseAdmin
): Promise<Tugas> {
  if (!id || !id.trim()) {
    throw new ValidationError('ID tugas wajib diisi.')
  }

  const updates: Record<string, unknown> = {}

  if (input.judul !== undefined) {
    if (typeof input.judul !== 'string' || !input.judul.trim()) {
      throw new ValidationError('Judul tugas tidak boleh kosong.')
    }
    updates.judul = input.judul.trim()
  }

  if (input.matkul !== undefined) {
    if (typeof input.matkul !== 'string' || !input.matkul.trim()) {
      throw new ValidationError('Mata kuliah tidak boleh kosong.')
    }
    updates.matkul = input.matkul.trim()
  }

  if (input.tipe !== undefined) {
    updates.tipe = validateTipe(input.tipe)
  }

  if (input.deadline !== undefined) {
    updates.deadline = normalizeDeadline(input.deadline)
  }

  if (input.link_pengumpulan !== undefined) {
    updates.link_pengumpulan = input.link_pengumpulan?.trim() || null
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

  // Pastikan record ada sebelum update
  await ambilById(id, client)

  const { data, error } = await client
    .from('tugas')
    .update(updates)
    .eq('id', id.trim())
    .select('*')
    .single()

  if (error || !data) {
    throw new Error(error?.message || 'Gagal memperbarui data tugas.')
  }

  return data as Tugas
}

/**
 * Menghapus tugas berdasarkan ID.
 */
export async function hapus(
  id: string,
  client: SupabaseClient = supabaseAdmin
): Promise<void> {
  if (!id || !id.trim()) {
    throw new ValidationError('ID tugas wajib diisi.')
  }

  // Cek keberadaan data
  await ambilById(id, client)

  const { error } = await client
    .from('tugas')
    .delete()
    .eq('id', id.trim())

  if (error) {
    throw new Error(error.message)
  }
}

/**
 * Menandai status selesai tugas (ceklis / unceklis).
 */
export async function tandaiSelesai(
  id: string,
  selesai: boolean = true,
  client: SupabaseClient = supabaseAdmin
): Promise<Tugas> {
  return ubah(id, { selesai }, client)
}
