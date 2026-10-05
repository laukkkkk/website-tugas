import type { Kerjaan } from '../../types/index.js'
import { hariTersisa, labelSisaWaktu, kelasWarna } from '../../../shared/deadline.js'
import { formatTanggalWib } from '../../../shared/pesan-reminder.js'
import { COLOR_SCHEMES } from '../../lib/colors.js'
import { useRouter } from '../../context/RouterContext.js'
import { potongKerjaanAktif } from '../../lib/dashboard-helpers.js'
import { BATAS_KERJAAN } from '../../config/dashboard.js'

interface KerjaanAktifCardProps {
  kerjaanList: Kerjaan[]
  loading?: boolean
}

export function KerjaanAktifCard({ kerjaanList, loading = false }: KerjaanAktifCardProps) {
  const { navigate } = useRouter()
  const { items, sisa, keteranganSisa } = potongKerjaanAktif(kerjaanList, BATAS_KERJAAN)

  return (
    <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-main)] p-5 sm:p-6 shadow-xs flex flex-col h-full text-[var(--text-main)] transition-colors">
      <div className="flex items-center justify-between pb-4 border-b border-[var(--border-main)]">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[var(--text-main)] flex items-center gap-2">
            <span>💼</span>
            <span>Kerjaan Aktif</span>
          </h2>
          <p className="text-xs text-[var(--text-sub)] mt-0.5 font-medium">
            Maksimal {BATAS_KERJAAN} kerjaan aktif dengan deadline terdekat
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/kerjaan')}
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
        ) : items.length === 0 ? (
          <div className="py-10 text-center flex flex-col items-center justify-center my-auto">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 flex items-center justify-center text-2xl mb-3">
              ✨
            </div>
            <p className="text-sm font-bold text-[var(--text-main)]">
              Semua kerjaan beres!
            </p>
            <p className="text-xs text-[var(--text-sub)] mt-1 max-w-xs font-medium">
              Tidak ada kerjaan atau proyek aktif yang tertunda. Nikmati waktu luangmu!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((kerjaan) => {
              const sisaHari = hariTersisa(kerjaan.deadline)
              const warna = kelasWarna(sisaHari)
              const label = labelSisaWaktu(sisaHari)
              const scheme = COLOR_SCHEMES[warna]
              const tglWib = formatTanggalWib(kerjaan.deadline)

              return (
                <div
                  key={kerjaan.id}
                  className="p-4 rounded-xl border border-[var(--border-main)] bg-[var(--bg-page)] hover:border-cyan-400 dark:hover:border-cyan-600 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-[var(--text-main)] truncate">
                        {kerjaan.judul}
                      </h3>
                      {kerjaan.deskripsi && (
                        <p className="text-xs text-[var(--text-sub)] mt-1 line-clamp-1">
                          {kerjaan.deskripsi}
                        </p>
                      )}
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

                  <div className="mt-3 pt-2.5 border-t border-[var(--border-main)] flex items-center justify-between text-xs text-[var(--text-sub)] font-medium">
                    <span className="flex items-center gap-1.5 truncate">
                      <svg className="w-3.5 h-3.5 opacity-70 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {tglWib}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Keterangan sisa kerjaan jika ada lebih dari BATAS_KERJAAN */}
        {!loading && sisa > 0 && (
          <div className="mt-4 pt-3 border-t border-[var(--border-main)] flex items-center justify-between text-xs text-[var(--text-sub)]">
            <span className="font-medium">{keteranganSisa}</span>
            <button
              type="button"
              onClick={() => navigate('/kerjaan')}
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
