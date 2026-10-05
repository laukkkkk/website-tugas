import type { HTMLAttributes, ReactNode } from 'react'

export type BadgeVariant = 'neutral' | 'cyan' | 'merah' | 'kuning' | 'hijau' | 'selesai'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  children?: ReactNode
  className?: string
}

/**
 * Komponen Badge bersama untuk tipe tugas, deadline, dan status.
 * Memastikan teks di latar berwarna kontras tinggi sesuai WCAG AA.
 */
export function Badge({
  variant = 'neutral',
  children,
  className = '',
  ...props
}: BadgeProps) {
  const variantStyles: Record<BadgeVariant, string> = {
    neutral:
      'bg-[var(--bg-input)] text-[var(--text-sub)] border border-[var(--border-main)]',
    cyan:
      'bg-cyan-500/10 text-cyan-800 dark:text-cyan-200 border border-cyan-500/30',
    merah:
      'bg-red-100 text-red-900 border-red-200 dark:bg-[#450a0a] dark:text-red-200 dark:border-red-800 border',
    kuning:
      'bg-amber-100 text-amber-950 border-amber-200 dark:bg-[#451a03] dark:text-amber-200 dark:border-amber-800 border',
    hijau:
      'bg-emerald-100 text-emerald-950 border-emerald-200 dark:bg-[#022c22] dark:text-emerald-200 dark:border-emerald-800 border',
    selesai:
      'bg-[var(--bg-input)] text-[var(--text-muted)] border border-[var(--border-main)]',
  }

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}
