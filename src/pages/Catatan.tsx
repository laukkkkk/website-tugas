import React, { useEffect, useState, useCallback, useMemo } from 'react'
import type { Note, Todo } from '../types/index.js'
import { apiFetch } from '../lib/api.js'
import { formatWaktuWib, urutkanTodos } from '../lib/catatan-helpers.js'
import { ringkasanCatatan } from '../../shared/catatan.js'
import { NoteEditorModal } from '../components/catatan/NoteEditorModal.js'
import { HapusCatatanModal } from '../components/catatan/HapusCatatanModal.js'
import { TodoItem } from '../components/catatan/TodoItem.js'
import { Button, Card, Input } from '../components/index.js'

export function Catatan() {
  // State Catatan
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null)

  // State To-do
  const [todos, setTodos] = useState<Todo[]>([])
  const [newTodoText, setNewTodoText] = useState('')
  const [isAddingTodo, setIsAddingTodo] = useState(false)

  // Global Loading, Error & Notification
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const showNotification = (msg: string) => {
    setSuccessMessage(msg)
    setTimeout(() => {
      setSuccessMessage((curr) => (curr === msg ? null : curr))
    }, 3500)
  }

  // Ambil Data Catatan & To-do secara Paralel
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [notesRes, todosRes] = await Promise.all([
        apiFetch('/api/notes'),
        apiFetch('/api/todos'),
      ])

      if (!notesRes.ok) {
        throw new Error(`Gagal memuat catatan (${notesRes.status})`)
      }
      if (!todosRes.ok) {
        throw new Error(`Gagal memuat to-do (${todosRes.status})`)
      }

      const notesData = (await notesRes.json()) as Note[]
      const todosData = (await todosRes.json()) as Todo[]

      setNotes(Array.isArray(notesData) ? notesData : [])
      setTodos(Array.isArray(todosData) ? todosData : [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan jaringan.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // --- Operasi Catatan ---
  const handleSaveNote = async (payload: { isi: string }) => {
    if (selectedNote) {
      // Edit Catatan
      const res = await apiFetch(`/api/notes/${selectedNote.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isi: payload.isi }),
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.message || `Gagal mengubah catatan (${res.status})`)
      }
      const updated = (await res.json()) as Note
      setNotes((prev) =>
        prev.map((n) => (n.id === updated.id ? updated : n))
      )
      showNotification('Catatan berhasil diperbarui!')
    } else {
      // Tambah Catatan Baru
      const res = await apiFetch('/api/notes', {
        method: 'POST',
        body: JSON.stringify({ isi: payload.isi }),
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.message || `Gagal menambahkan catatan (${res.status})`)
      }
      const baru = (await res.json()) as Note
      setNotes((prev) => [baru, ...prev])
      showNotification('Catatan baru berhasil ditambahkan!')
    }
  }

  const handleConfirmDeleteNote = async (note: Note) => {
    const res = await apiFetch(`/api/notes/${note.id}`, {
      method: 'DELETE',
    })
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(errorData.message || `Gagal menghapus catatan (${res.status})`)
    }
    setNotes((prev) => prev.filter((n) => n.id !== note.id))
    const { judul } = ringkasanCatatan(note.isi)
    showNotification(`Catatan "${judul || 'Tanpa judul'}" berhasil dihapus.`)
  }

  // --- Operasi To-do ---
  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanText = newTodoText.trim()
    if (!cleanText) return

    setIsAddingTodo(true)
    try {
      const res = await apiFetch('/api/todos', {
        method: 'POST',
        body: JSON.stringify({ teks: cleanText }),
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.message || `Gagal menambah to-do (${res.status})`)
      }
      const baru = (await res.json()) as Todo
      setTodos((prev) => [baru, ...prev])
      setNewTodoText('')
      showNotification('To-do berhasil ditambahkan!')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal menambah to-do.'
      setError(message)
    } finally {
      setIsAddingTodo(false)
    }
  }

  const handleToggleTodo = async (todo: Todo) => {
    const statusBaru = !todo.selesai

    // Update optimistik
    setTodos((prev) =>
      prev.map((t) => (t.id === todo.id ? { ...t, selesai: statusBaru } : t))
    )

    try {
      const res = await apiFetch(`/api/todos/${todo.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ selesai: statusBaru }),
      })
      if (!res.ok) {
        throw new Error(`Gagal mengubah status to-do (${res.status})`)
      }
    } catch {
      // Rollback
      setTodos((prev) =>
        prev.map((t) => (t.id === todo.id ? { ...t, selesai: !statusBaru } : t))
      )
      setError('Gagal memperbarui to-do.')
    }
  }

  const handleDeleteTodo = async (todo: Todo) => {
    try {
      const res = await apiFetch(`/api/todos/${todo.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        throw new Error(`Gagal menghapus to-do (${res.status})`)
      }
      setTodos((prev) => prev.filter((t) => t.id !== todo.id))
      showNotification('To-do dihapus.')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal menghapus to-do.'
      setError(message)
    }
  }

  // Sorting to-do (belum selesai di atas, selesai di bawah)
  const sortedTodos = useMemo(() => {
    return urutkanTodos(todos)
  }, [todos])

  const pendingTodosCount = useMemo(() => {
    return todos.filter((t) => !t.selesai).length
  }, [todos])

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-main)]">
            Catatan & To-do
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-sub)] mt-1">
            Simpan rangkuman catatan kuliah dan checklist to-do cepat harian Anda.
          </p>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={fetchData}
          disabled={loading}
          className="self-start sm:self-auto gap-2"
        >
          <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-600' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>{loading ? 'Menyinkronkan...' : 'Sinkronkan'}</span>
        </Button>
      </div>

      {/* Banner Notifikasi Sukses */}
      {successMessage && (
        <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm flex items-center justify-between gap-3 shadow-2xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <span>✅</span>
            <span className="font-medium">{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Banner Error */}
      {error && (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-800 dark:text-red-200 text-xs sm:text-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={fetchData}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-900 dark:text-red-100 transition-colors cursor-pointer"
          >
            Coba lagi
          </button>
        </div>
      )}

      {/* Grid Dua Kolom di Laptop, Satu Kolom di HP */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* ==================== KOLOM KIRI: CATATAN ==================== */}
        <Card className="p-5 sm:p-6 flex flex-col min-h-[500px]">
          {/* Header Kolom Catatan */}
          <div className="flex items-center justify-between pb-4 border-b border-[var(--border-main)]">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">📝</span>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[var(--text-main)]">
                  Catatan
                </h2>
                <p className="text-xs text-[var(--text-sub)] mt-0.5">
                  {notes.length} catatan tersimpan
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => {
                setSelectedNote(null)
                setIsEditorOpen(true)
              }}
              className="gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span>Catatan Baru</span>
            </Button>
          </div>

          {/* Isi Kolom Catatan */}
          <div className="mt-4 flex-1">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="p-4 rounded-2xl border border-[var(--border-main)] bg-[var(--bg-input)]/40 animate-pulse space-y-2"
                  >
                    <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
                    <div className="h-3 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
                    <div className="h-3 w-28 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
                  </div>
                ))}
              </div>
            ) : notes.length === 0 ? (
              <div className="py-16 text-center flex flex-col items-center justify-center">
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center text-2xl mb-3">
                  🗒️
                </div>
                <h3 className="text-sm font-bold text-[var(--text-main)]">
                  Belum ada catatan
                </h3>
                <p className="text-xs text-[var(--text-sub)] mt-1 max-w-xs">
                  Simpan rangkuman kuliah, ide proyek, atau referensi penting Anda di sini.
                </p>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setSelectedNote(null)
                    setIsEditorOpen(true)
                  }}
                  className="mt-4"
                >
                  + Tulis Catatan Pertama
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {notes.map((note) => {
                  const { judul, pratinjau } = ringkasanCatatan(note.isi)
                  const displayJudul = judul || 'Tanpa judul'

                  return (
                    <div
                      key={note.id}
                      onClick={() => {
                        setSelectedNote(note)
                        setIsEditorOpen(true)
                      }}
                      className="group relative p-4 rounded-2xl border border-[var(--border-main)] bg-[var(--bg-input)]/50 hover:bg-[var(--bg-input)] hover:border-cyan-500/50 transition-all cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-bold text-[var(--text-main)] truncate group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                            {displayJudul}
                          </h3>
                          {pratinjau ? (
                            <p className="text-xs text-[var(--text-sub)] mt-1 line-clamp-2 leading-relaxed">
                              {pratinjau}
                            </p>
                          ) : null}
                        </div>

                      {/* Tombol Hapus Catatan */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setNoteToDelete(note)
                        }}
                        title="Hapus catatan"
                        className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-600 hover:bg-red-500/10 dark:hover:text-red-400 transition-colors cursor-pointer opacity-80 group-hover:opacity-100"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-[var(--border-main)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                      <span>Terakhir diedit: {formatWaktuWib(note.updated_at || note.created_at)}</span>
                      <span className="font-medium text-cyan-600 dark:text-cyan-400 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                        Buka &rarr;
                      </span>
                    </div>
                  </div>
                )
              })}
              </div>
            )}
          </div>
        </Card>

        {/* ==================== KOLOM KANAN: TO-DO ==================== */}
        <Card className="p-5 sm:p-6 flex flex-col min-h-[500px]">
          {/* Header Kolom To-do */}
          <div className="flex items-center justify-between pb-4 border-b border-[var(--border-main)]">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">✅</span>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[var(--text-main)]">
                  To-do Cepat
                </h2>
                <p className="text-xs text-[var(--text-sub)] mt-0.5">
                  {pendingTodosCount} to-do aktif
                </p>
              </div>
            </div>
          </div>

          {/* Form Tambah Cepat To-do */}
          <form onSubmit={handleAddTodo} className="mt-4 flex items-center gap-2">
            <Input
              type="text"
              placeholder="Tambahkan to-do baru lalu tekan Enter..."
              value={newTodoText}
              onChange={(e) => setNewTodoText(e.target.value)}
              disabled={isAddingTodo}
              className="flex-1"
            />
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isAddingTodo || !newTodoText.trim()}
              isLoading={isAddingTodo}
              className="shrink-0"
            >
              + Tambah
            </Button>
          </form>

          {/* Daftar Item To-do */}
          <div className="mt-4 flex-1">
            {loading ? (
              <div className="space-y-2.5">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl border border-[var(--border-main)] bg-[var(--bg-input)]/40 animate-pulse flex items-center gap-3"
                  >
                    <div className="w-5 h-5 rounded-md bg-slate-200 dark:bg-slate-800"></div>
                    <div className="h-3 w-44 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
                  </div>
                ))}
              </div>
            ) : sortedTodos.length === 0 ? (
              <div className="py-16 text-center flex flex-col items-center justify-center">
                <div className="w-14 h-14 rounded-2xl bg-[var(--bg-input)] text-[var(--text-muted)] flex items-center justify-center text-2xl mb-3">
                  🎯
                </div>
                <h3 className="text-sm font-bold text-[var(--text-main)]">
                  Semua to-do selesai!
                </h3>
                <p className="text-xs text-[var(--text-sub)] mt-1 max-w-xs">
                  Tidak ada checklist to-do saat ini. Tulis rencana kecilmu di kolom atas.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {sortedTodos.map((todo) => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    onToggle={handleToggleTodo}
                    onDelete={handleDeleteTodo}
                  />
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Modal Editor / Viewer Catatan */}
      <NoteEditorModal
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false)
          setSelectedNote(null)
        }}
        onSubmit={handleSaveNote}
        onDelete={(note) => {
          setIsEditorOpen(false)
          setSelectedNote(null)
          setNoteToDelete(note)
        }}
        note={selectedNote}
      />

      {/* Modal Konfirmasi Hapus Catatan */}
      <HapusCatatanModal
        isOpen={Boolean(noteToDelete)}
        note={noteToDelete}
        onClose={() => setNoteToDelete(null)}
        onConfirm={handleConfirmDeleteNote}
      />
    </div>
  )
}
