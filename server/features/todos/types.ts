export interface Todo {
  id: string
  teks: string
  selesai: boolean
  created_at: string
}

export interface TambahTodoInput {
  teks: string
}

export interface UbahTodoInput {
  teks?: string
  selesai?: boolean
}
