import { useState } from 'react'
import type { Tugas, Kerjaan } from '../../types/index.js'
import { susunPesanReminder } from '../../../shared/pesan-reminder.js'

interface TelegramPreviewCardProps {
  tugasList: Tugas[]
  kerjaanList: Kerjaan[]
  loading?: boolean
}

export function TelegramPreviewCard({
  tugasList,
  kerjaanList,
  loading = false,
}: TelegramPreviewCardProps) {
  const [copied, setCopied] = useState(false)

  // Susun pesan menggunakan fungsi murni yang sama persis dengan backend / cron reminder
  const message = susunPesanReminder(tugasList, kerjaanList)

  const handleCopy = async () => {
    if (!message) return
    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback jika navigator.clipboard tidak diizinkan
      const textArea = document.createElement('textarea')
      textArea.value = message
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs flex flex-col h-full">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#229ED9]/15 text-[#229ED9] flex items-center justify-center font-bold text-sm">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .36z" />
            </svg>
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Pesan Telegram jam 09.00</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Pratinjau otomatis reminder harian via Bot
            </p>
          </div>
        </div>

        {message && !loading && (
          <button
            type="button"
            onClick={handleCopy}
            title="Salin teks pesan"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <svg className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-emerald-600 dark:text-emerald-400">Tersalin!</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Salin</span>
              </>
            )}
          </button>
        )}
      </div>

      <div className="mt-4 flex-1 flex flex-col justify-center">
        {loading ? (
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 animate-pulse space-y-3">
            <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded-md"></div>
            <div className="h-3 w-3/4 bg-slate-200 dark:bg-slate-700 rounded-md"></div>
            <div className="h-3 w-5/6 bg-slate-200 dark:bg-slate-700 rounded-md"></div>
            <div className="h-3 w-2/3 bg-slate-200 dark:bg-slate-700 rounded-md"></div>
          </div>
        ) : !message ? (
          <div className="py-10 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center text-xl mb-3">
              🔕
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Tidak ada pesan pengingat
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
              Bot tidak akan mengirimkan reminder jam 09.00 WIB karena tidak ada tugas atau kerjaan yang menunggu.
            </p>
          </div>
        ) : (
          <div className="relative rounded-xl border border-[#229ED9]/30 dark:border-[#229ED9]/20 bg-[#F4F9FD] dark:bg-[#16212b] p-4 font-sans text-xs sm:text-sm text-slate-800 dark:text-slate-100 leading-relaxed shadow-xs">
            <div className="flex items-center justify-between text-[11px] font-semibold text-[#229ED9] pb-2 mb-2 border-b border-[#229ED9]/20">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#229ED9] animate-pulse"></span>
                Format Telegram (HTML/Markdown)
              </span>
              <span>09.00 WIB</span>
            </div>

            <div className="whitespace-pre-wrap break-words font-mono text-xs text-slate-800 dark:text-slate-200 leading-relaxed overflow-x-auto">
              {message}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
