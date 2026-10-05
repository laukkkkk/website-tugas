import type { Note } from '../../types/index.js'
import { ringkasanCatatan } from '../../../shared/catatan.js'
import { formatWaktuWib } from '../../lib/catatan-helpers.js'
import { useRouter } from '../../context/RouterContext.js'
import { potongCatatanTerbaru } from '../../lib/dashboard-helpers.js'
import { BATAS_CATATAN } from '../../config/dashboard.js'

interface CatatanTerbaruCardProps {
  notesList: Note[]
  loading?: boolean
}

export function CatatanTerbaruCard({ notesList, loading = false }: CatatanTerbaruCardProps) {
  const { navigate } = useRouter()
  const { items, sisa, keteranganSisa } = potongCatatanTerbaru(notesList, BATAS_CATATAN)

  return (
    <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-main)] p-5 sm:p-6 shadow-xs flex flex-col h-full text-[var(--text-main)] transition-colors">
      <div className="flex items-center justify-between pb-4 border-b border-[var(--border-main)]">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[var(--text-main)] flex items-center gap-2">
            <span>📝</span>
            <span>Catatan Terbaru</span>
          </h2>
          <p className="text-xs text-[var(--text-sub)] mt-0.5 font-medium">
            Maksimal {BATAS_CATATAN} catatan yang terakhir diedit
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
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-4 rounded-xl border border-[var(--border-main)] bg-[var(--bg-page)] animate-pulse space-y-2.5"
              >
                <div className="h-4 w-40 bg-slate-200 dark:bg-slate-700 rounded-md"></div>
                <div className="h-3 w-3/4 bg-slate-200 dark:bg-slate-700 rounded-md"></div>
                <div className="h-2.5 w-28 bg-slate-200 dark:bg-slate-700 rounded-md"></div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="py-10 text-center flex flex-col items-center justify-center my-auto">
            <div className="w-14 h-14 rounded-2xl bg-cyan-100 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 flex items-center justify-center text-2xl mb-3">
              📌
            </div>
            <p className="text-sm font-bold text-[var(--text-main)]">
              Belum ada catatan
            </p>
            <p className="text-xs text-[var(--text-sub)] mt-1 max-w-xs font-medium">
              Tulis catatan atau ide penting pertama Anda di halaman Catatan.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((note) => {
              const { judul, pratinjau } = ringkasanCatatan(note.isi)
              const displayJudul = judul || 'Tanpa judul'

              return (
                <div
                  key={note.id}
                  onClick={() => navigate('/catatan')}
                  className="group p-4 rounded-xl border border-[var(--border-main)] bg-[var(--bg-page)] hover:border-cyan-400 dark:hover:border-cyan-600 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-[var(--text-main)] truncate group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                        {displayJudul}
                      </h3>
                      {pratinjau ? (
                        <p className="text-xs text-[var(--text-sub)] mt-1 line-clamp-2 leading-relaxed">
                          {pratinjau}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-[var(--border-main)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                    <span>Terakhir diedit: {formatWaktuWib(note.updated_at || note.created_at)}</span>
                    <span className="font-medium text-cyan-600 dark:text-cyan-400 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                      Buka &rarr;
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Keterangan sisa catatan jika ada lebih dari BATAS_CATATAN */}
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
