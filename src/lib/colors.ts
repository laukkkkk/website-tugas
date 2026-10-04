import type { KelasWarna } from '../../shared/deadline.js'

export interface ColorScheme {
  cardBorder: string
  cardBg: string
  title: string
  value: string
  iconBg: string
  subtext: string
  badge: string
}

export const COLOR_SCHEMES: Record<KelasWarna, ColorScheme> = {
  merah: {
    cardBorder: 'border-red-200 dark:border-red-900/70',
    cardBg: 'bg-red-50/80 dark:bg-red-950/30',
    title: 'text-red-900 dark:text-red-200',
    value: 'text-red-600 dark:text-red-400',
    iconBg: 'bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300',
    subtext: 'text-red-700/80 dark:text-red-300/80',
    badge: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/70 dark:text-red-300 dark:border-red-800',
  },
  kuning: {
    cardBorder: 'border-amber-200 dark:border-amber-900/70',
    cardBg: 'bg-amber-50/80 dark:bg-amber-950/30',
    title: 'text-amber-950 dark:text-amber-200',
    value: 'text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300',
    subtext: 'text-amber-800/80 dark:text-amber-300/80',
    badge: 'bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800',
  },
  hijau: {
    cardBorder: 'border-emerald-200 dark:border-emerald-900/70',
    cardBg: 'bg-emerald-50/80 dark:bg-emerald-950/30',
    title: 'text-emerald-950 dark:text-emerald-200',
    value: 'text-emerald-600 dark:text-emerald-400',
    iconBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300',
    subtext: 'text-emerald-800/80 dark:text-emerald-300/80',
    badge: 'bg-emerald-100 text-emerald-900 border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800',
  },
  netral: {
    cardBorder: 'border-slate-200 dark:border-slate-800',
    cardBg: 'bg-slate-50/80 dark:bg-slate-900/40',
    title: 'text-slate-800 dark:text-slate-200',
    value: 'text-slate-600 dark:text-slate-400',
    iconBg: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    subtext: 'text-slate-500 dark:text-slate-400',
    badge: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  },
}
