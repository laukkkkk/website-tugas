export interface Note {
  id: string
  isi: string
  created_at: string
  updated_at: string
}

export interface TambahNoteInput {
  isi: string
}

export interface UbahNoteInput {
  isi: string
}
