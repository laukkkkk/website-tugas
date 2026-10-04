import type { Tugas } from '../../types/index.js'
import { hariTersisa, labelSisaWaktu, kelasWarna } from '../../../shared/deadline.js'
import { formatTanggalWib } from '../../../shared/pesan-reminder.js'
import { COLOR_SCHEMES } from '../../lib/colors.js'
import { useRouter } from '../../context/RouterContext.js'

interface TugasTerdekatListProps {
  tugasList: Tugas[]
  loading?: boolean
}

export function TugasTerdekatList({ tugasList, loading = false }: TugasTerdekatListProps) {
  const { navigate } = useRouter()
  const list = tugasList.slice(0, 3)

  return (
    <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-main)] p-5 sm:p-6 shadow-xs flex flex-col h-full text-[var(--text-main)] transition-colors">
      <div className="flex items-center justify-between pb-4 border-b border-[var(--border-main)]">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[var(--text-main)] flex items-center gap-2">
            <span>📋</span>
            <span>Tugas Terdekat</span>
          </h2>
          <p className="text-xs text-[var(--text-sub)] mt-0.5 font-medium">
            Maksimal 3 tugas aktif dengan deadline terdekat
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/tugas')}
          className="text-xs font-bold text-cyan-700 dark:text-cyan-300 hover:text-cyan-800 dark:hover:text-cyan-200 transition-colors flex items-center gap-1 cursor-pointer"
        >
          Lihat semua
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="mt-4 flex-1">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-4 rounded-xl border border-[var(--border-main)] bg-[var(--bg-page)] animate-pulse space-y-2.5"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="h-4 w-48 bg-slate-200 dark:bg-slate-700 rounded-md"></div>
                  <div className="h-5 w-20 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                </div>
                <div className="h-3 w-32 bg-slate-200 dark:bg-slate-700 rounded-md"></div>
              </div>
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="py-10 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center text-2xl mb-3">
              🎉
            </div>
            <p className="text-sm font-bold text-[var(--text-main)]">
              Semua tugas sudah selesai!
            </p>
            <p className="text-xs text-[var(--text-sub)] mt-1 max-w-xs font-medium">
              Tidak ada tugas yang menunggu saat ini. Istirahat sejenak atau nikmati waktu luangmu.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {list.map((tugas) => {
              const sisa = hariTersisa(tugas.deadline)
              const warna = kelasWarna(sisa)
              const label = labelSisaWaktu(sisa)
              const scheme = COLOR_SCHEMES[warna]
              const tglWib = formatTanggalWib(tugas.deadline)

              return (
                <div
                  key={tugas.id}
                  className="p-4 rounded-xl border border-[var(--border-main)] bg-[var(--bg-page)] hover:border-cyan-400 dark:hover:border-cyan-600 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-[var(--text-main)] truncate">
                        {tugas.judul}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-xs font-semibold text-[var(--text-sub)]">
                          {tugas.matkul}
                        </span>
                        <span className="text-[var(--text-sub)] opacity-50">•</span>
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-[var(--bg-muted)] text-[var(--text-main)] font-semibold border border-[var(--border-main)]">
                          {tugas.tipe === 'kelompok' ? '👥 Kelompok' : '👤 Individu'}
                        </span>
                      </div>
                    </div>

                    {/* Badge deadline berwarna */}
                    <div className="shrink-0 text-right">
                      <span
                        className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full border ${scheme.badge}`}
                      >
                        {label}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-[var(--border-main)] flex flex-wrap items-center justify-between text-xs text-[var(--text-sub)] font-medium gap-2">
                    <span className="flex items-center gap-1.5 truncate">
                      <svg className="w-3.5 h-3.5 opacity-70 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {tglWib}
                    </span>

                    {tugas.link_pengumpulan && (
                      <a
                        href={tugas.link_pengumpulan}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-cyan-700 dark:text-cyan-300 hover:underline font-semibold ml-auto"
                      >
                        <span>🔗</span>
                        <span>Link tugas</span>
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
