export interface Kerjaan {
  id: string
  judul: string
  deskripsi: string | null
  deadline: string // ISO timestamptz string
  selesai: boolean
  created_at: string
}

export interface TambahKerjaanInput {
  judul: string
  deskripsi?: string | null
  deadline: string | Date
}

export interface UbahKerjaanInput {
  judul?: string
  deskripsi?: string | null
  deadline?: string | Date
  selesai?: boolean
}
