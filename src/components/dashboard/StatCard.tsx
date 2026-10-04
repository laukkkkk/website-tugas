import React from 'react'
import type { KelasWarna } from '../../../shared/deadline.js'
import { COLOR_SCHEMES } from '../../lib/colors.js'

interface StatCardProps {
  title: string
  value: string | number
  subtext?: string
  icon: React.ReactNode
  color: KelasWarna
  onClick?: () => void
  loading?: boolean
}

export function StatCard({
  title,
  value,
  subtext,
  icon,
  color,
  onClick,
  loading = false,
}: StatCardProps) {
  const scheme = COLOR_SCHEMES[color]

  if (loading) {
    return (
      <div className="p-5 rounded-2xl border border-[var(--border-main)] bg-[var(--bg-card)] shadow-xs animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-4 w-28 bg-slate-200 dark:bg-slate-700 rounded-md"></div>
          <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700"></div>
        </div>
        <div className="h-8 w-20 bg-slate-200 dark:bg-slate-700 rounded-md mt-4"></div>
        <div className="h-3 w-32 bg-slate-200 dark:bg-slate-700 rounded-md mt-2"></div>
      </div>
    )
  }

  const isClickable = Boolean(onClick)

  return (
    <div
      onClick={onClick}
      className={`relative p-5 rounded-2xl border transition-all duration-200 ${scheme.cardBorder} ${scheme.cardBg} ${
        isClickable
          ? 'cursor-pointer hover:shadow-md hover:scale-[1.01] active:scale-[0.99]'
          : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-xs font-bold uppercase tracking-wider ${scheme.title}`}>
            {title}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-3xl font-extrabold tracking-tight ${scheme.value}`}>
              {value}
            </span>
          </div>
        </div>
        <div
          className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-lg ${scheme.iconBg}`}
        >
          {icon}
        </div>
      </div>

      {subtext && (
        <p className={`mt-3 text-xs font-semibold truncate ${scheme.subtext}`}>
          {subtext}
        </p>
      )}
    </div>
  )
}
