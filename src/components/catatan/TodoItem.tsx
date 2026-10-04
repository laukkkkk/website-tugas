import React, { useState } from 'react'
import type { Todo } from '../../types/index.js'

interface TodoItemProps {
  todo: Todo
  onToggle: (todo: Todo) => Promise<void>
  onDelete: (todo: Todo) => Promise<void>
}

export function TodoItem({ todo, onToggle, onDelete }: TodoItemProps) {
  const [isToggling, setIsToggling] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleCheckboxChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation()
    setIsToggling(true)
    try {
      await onToggle(todo)
    } finally {
      setIsToggling(false)
    }
  }

  const handleDeleteClick = async () => {
    setIsDeleting(true)
    try {
      await onDelete(todo)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div
      className={`group flex items-center justify-between gap-3 p-3.5 rounded-xl border transition-all ${
        todo.selesai
          ? 'bg-[var(--bg-page)]/80 border-[var(--border-main)]/60 opacity-75'
          : 'bg-[var(--bg-card)] border-[var(--border-main)] hover:border-cyan-500/50 shadow-2xs'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <label className="relative flex items-center justify-center cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={todo.selesai}
            disabled={isToggling}
            onChange={handleCheckboxChange}
            className="sr-only peer"
            aria-label={`Tandai "${todo.teks}" sebagai ${todo.selesai ? 'belum selesai' : 'selesai'}`}
          />
          <div
            className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${
              todo.selesai
                ? 'bg-cyan-600 border-cyan-600 text-white'
                : 'border-[var(--border-main)] hover:border-cyan-500 bg-[var(--bg-input)]'
            } ${isToggling ? 'opacity-50 animate-pulse' : ''}`}
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

      <button
        type="button"
        onClick={handleDeleteClick}
        disabled={isDeleting}
        title="Hapus to-do"
        className="shrink-0 p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-80 group-hover:opacity-100 cursor-pointer disabled:opacity-40"
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
  )
}
