import { useState } from 'react'
import type { Todo } from '../../types/index.js'
import { useRouter } from '../../context/RouterContext.js'
import { potongTodosAktif } from '../../lib/dashboard-helpers.js'
import { BATAS_TODO } from '../../config/dashboard.js'

interface TodoAktifCardProps {
  todosList: Todo[]
  loading?: boolean
  onToggleTodo?: (todo: Todo) => Promise<void>
}

export function TodoAktifCard({
  todosList,
  loading = false,
  onToggleTodo,
}: TodoAktifCardProps) {
  const { navigate } = useRouter()
  const { items, sisa, keteranganSisa } = potongTodosAktif(todosList, BATAS_TODO)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const handleToggle = async (todo: Todo) => {
    if (!onToggleTodo || togglingId) return
    setTogglingId(todo.id)
    try {
      await onToggleTodo(todo)
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-main)] p-5 sm:p-6 shadow-xs flex flex-col h-full text-[var(--text-main)] transition-colors">
      <div className="flex items-center justify-between pb-4 border-b border-[var(--border-main)]">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[var(--text-main)] flex items-center gap-2">
            <span>✅</span>
            <span>To-do Aktif</span>
          </h2>
          <p className="text-xs text-[var(--text-sub)] mt-0.5 font-medium">
            Maksimal {BATAS_TODO} to-do aktif yang belum selesai
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/catatan')}
          className="text-xs font-bold text-cyan-700 dark:text-cyan-300 hover:text-cyan-800 dark:hover:text-cyan-200 transition-colors flex items-center gap-1 cursor-pointer"
        >
          Lihat semua
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="mt-4 flex-1 flex flex-col justify-between">
        {loading ? (
          <div className="space-y-2.5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="p-3.5 rounded-xl border border-[var(--border-main)] bg-[var(--bg-page)] animate-pulse flex items-center gap-3"
              >
                <div className="w-5 h-5 bg-slate-200 dark:bg-slate-700 rounded-lg shrink-0"></div>
                <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded-md"></div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="py-10 text-center flex flex-col items-center justify-center my-auto">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center text-2xl mb-3">
              🎉
            </div>
            <p className="text-sm font-bold text-[var(--text-main)]">
              Semua to-do selesai!
            </p>
            <p className="text-xs text-[var(--text-sub)] mt-1 max-w-xs font-medium">
              Bagus sekali! Tidak ada to-do yang tertunda saat ini.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {items.map((todo) => {
              const isBusy = togglingId === todo.id

              return (
                <div
                  key={todo.id}
                  className="group flex items-center justify-between gap-3 p-3.5 rounded-xl border border-[var(--border-main)] bg-[var(--bg-page)] hover:border-cyan-400 dark:hover:border-cyan-600 transition-colors shadow-2xs"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <label className="relative flex items-center justify-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={todo.selesai}
                        disabled={isBusy}
                        onChange={() => handleToggle(todo)}
                        className="sr-only peer"
                        aria-label={`Tandai "${todo.teks}" sebagai ${todo.selesai ? 'belum selesai' : 'selesai'}`}
                      />
                      <div
                        className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${
                          todo.selesai
                            ? 'bg-cyan-600 border-cyan-600 text-white'
                            : 'border-[var(--border-main)] hover:border-cyan-500 bg-[var(--bg-input)]'
                        } ${isBusy ? 'opacity-50 animate-pulse' : ''}`}
                      >
                        {todo.selesai && (
                          <svg className="w-3.5 h-3.5 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </label>

                    <span
                      className={`text-sm break-words flex-1 transition-all ${
                        todo.selesai
                          ? 'line-through text-[var(--text-muted)]'
                          : 'text-[var(--text-main)] font-medium'
                      }`}
                    >
                      {todo.teks}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Keterangan sisa to-do jika ada lebih dari BATAS_TODO */}
        {!loading && sisa > 0 && (
          <div className="mt-4 pt-3 border-t border-[var(--border-main)] flex items-center justify-between text-xs text-[var(--text-sub)]">
            <span className="font-medium">{keteranganSisa}</span>
            <button
              type="button"
              onClick={() => navigate('/catatan')}
              className="font-bold text-cyan-700 dark:text-cyan-300 hover:underline flex items-center gap-1 cursor-pointer"
            >
              Lihat semua &rarr;
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
