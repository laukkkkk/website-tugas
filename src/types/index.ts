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

export interface Kerjaan {
  id: string
  judul: string
  deskripsi: string | null
  deadline: string // ISO timestamptz string
  selesai: boolean
  created_at: string
}

export interface Note {
  id: string
  judul: string
  isi: string
  created_at: string
  updated_at: string
}

export interface Todo {
  id: string
  teks: string
  selesai: boolean
  created_at: string
}

