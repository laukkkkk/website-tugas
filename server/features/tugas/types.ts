export type TipeTugas = 'individu' | 'kelompok'

export interface Tugas {
  id: string
  judul: string
  matkul: string
  tipe: TipeTugas
  link_pengumpulan: string | null
  deadline: string // ISO timestamptz string
  selesai: boolean
  created_at: string
}

export interface TambahTugasInput {
  judul: string
  matkul: string
  tipe: TipeTugas
  link_pengumpulan?: string | null
  deadline: string | Date
}

export interface UbahTugasInput {
  judul?: string
  matkul?: string
  tipe?: TipeTugas
  link_pengumpulan?: string | null
  deadline?: string | Date
  selesai?: boolean
}
