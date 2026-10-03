export interface Note {
  id: string
  judul: string
  isi: string
  created_at: string
  updated_at: string
}

export interface TambahNoteInput {
  judul: string
  isi?: string
}

export interface UbahNoteInput {
  judul?: string
  isi?: string
}
