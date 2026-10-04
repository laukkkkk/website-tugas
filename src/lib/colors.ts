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
    cardBorder: 'border-red-200 dark:border-red-800/80',
    cardBg: 'bg-red-50/90 dark:bg-[#2d0b0b]',
    title: 'text-red-900 dark:text-red-200',
    value: 'text-red-800 dark:text-white',
    iconBg: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
    subtext: 'text-red-900 dark:text-red-200',
    badge: 'bg-red-100 text-red-900 border-red-200 dark:bg-red-950/90 dark:text-red-200 dark:border-red-800',
  },
  kuning: {
    cardBorder: 'border-amber-200 dark:border-amber-800/80',
    cardBg: 'bg-amber-50/90 dark:bg-[#2e1404]',
    title: 'text-amber-950 dark:text-amber-200',
    value: 'text-amber-900 dark:text-white',
    iconBg: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
    subtext: 'text-amber-950 dark:text-amber-200',
    badge: 'bg-amber-100 text-amber-950 border-amber-200 dark:bg-amber-950/90 dark:text-amber-200 dark:border-amber-800',
  },
  hijau: {
    cardBorder: 'border-emerald-200 dark:border-emerald-800/80',
    cardBg: 'bg-emerald-50/90 dark:bg-[#04261b]',
    title: 'text-emerald-950 dark:text-emerald-200',
    value: 'text-emerald-800 dark:text-white',
    iconBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
    subtext: 'text-emerald-950 dark:text-emerald-200',
    badge: 'bg-emerald-100 text-emerald-950 border-emerald-200 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-800',
  },
  netral: {
    cardBorder: 'border-slate-200 dark:border-slate-700',
    cardBg: 'bg-white dark:bg-slate-800',
    title: 'text-slate-900 dark:text-white',
    value: 'text-slate-800 dark:text-white',
    iconBg: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-white',
    subtext: 'text-slate-600 dark:text-slate-300',
    badge: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700 dark:text-white dark:border-slate-600',
  },
}
