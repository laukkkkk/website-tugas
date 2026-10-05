import type { HTMLAttributes, ReactNode } from 'react'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode
  interactive?: boolean
  className?: string
}

/**
 * Komponen Card bersama dengan latar dan border semantik netral.
 * State interactive memakai hover border cyan lembut secara konsisten.
 */
export function Card({
  children,
  interactive = false,
  className = '',
  ...props
}: CardProps) {
  return (
    <div
      className={`bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl sm:rounded-3xl transition-all ${
        interactive
          ? 'hover:border-cyan-500/50 shadow-xs cursor-pointer'
          : 'shadow-xs'
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
