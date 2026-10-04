import { useRouter } from '../context/RouterContext.js'
import { useTheme } from '../context/ThemeContext.js'

interface HeaderProps {
  onToggleSidebar: () => void
}

const ROUTE_NAMES: Record<string, string> = {
  dashboard: 'Dashboard',
  tugas: 'Daftar Tugas',
  kerjaan: 'Daftar Kerjaan',
  catatan: 'Catatan Pribadi',
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const { route } = useRouter()
  const { theme, toggleTheme } = useTheme()

  const currentTitle = ROUTE_NAMES[route] || 'Website Tugas'

  return (
    <header className="md:hidden flex items-center justify-between px-4 py-3.5 border-b border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] sticky top-0 z-20 transition-colors">
      <div className="flex items-center gap-3">
        {/* Tombol Garis Tiga (Hamburger Menu) */}
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Buka Menu Navigasi"
          className="p-2 -ml-1 rounded-xl text-[var(--sidebar-text)] hover:bg-cyan-200/50 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        {/* Nama Halaman Aktif */}
        <h2 className="text-base font-bold tracking-tight text-[var(--sidebar-accent)]">
          {currentTitle}
        </h2>
      </div>

      {/* Theme Toggle Button */}
      <button
        type="button"
        onClick={toggleTheme}
        aria-label="Ganti Tema"
        className="p-2 rounded-xl text-sm bg-[var(--bg-card)] text-[var(--text-main)] shadow-xs border border-[var(--border-main)] hover:opacity-85 transition cursor-pointer"
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
    </header>
  )
}
