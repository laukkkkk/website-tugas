import { useRouter, type PageRoute } from '../context/RouterContext.js'
import { useAuth } from '../context/AuthContext.js'
import { useTheme } from '../context/ThemeContext.js'

interface SidebarProps {
  onItemClick?: () => void
}

interface MenuItem {
  route: PageRoute
  label: string
  path: string
  icon: string
}

const MENU_ITEMS: MenuItem[] = [
  { route: 'dashboard', label: 'Dashboard', path: '/', icon: '📊' },
  { route: 'tugas', label: 'Tugas', path: '/tugas', icon: '📋' },
  { route: 'kerjaan', label: 'Kerjaan', path: '/kerjaan', icon: '💼' },
  { route: 'catatan', label: 'Catatan', path: '/catatan', icon: '📝' },
]

export function Sidebar({ onItemClick }: SidebarProps) {
  const { route, navigate } = useRouter()
  const { logout, user } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const handleNav = (path: string) => {
    navigate(path)
    if (onItemClick) {
      onItemClick()
    }
  }

  const handleLogout = async () => {
    if (onItemClick) onItemClick()
    await logout()
  }

  return (
    <aside className="flex flex-col h-full w-64 border-r border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] transition-colors">
      {/* Brand Header */}
      <div className="p-6 border-b border-[var(--sidebar-border)] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xl shadow-sm text-white bg-[var(--primary-main)]">
            📋
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight text-[var(--sidebar-accent)]">
              Website Tugas
            </h1>
            <p className="text-xs text-[var(--sidebar-muted)]">
              Personal Task Manager
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {MENU_ITEMS.map((item) => {
          const isActive = route === item.route
          return (
            <button
              key={item.route}
              type="button"
              onClick={() => handleNav(item.path)}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-left font-medium transition-all ${
                isActive
                  ? 'bg-[var(--sidebar-active)] text-[var(--sidebar-accent)] shadow-xs font-bold'
                  : 'text-[var(--sidebar-text)] hover:bg-cyan-200/40 dark:hover:bg-slate-800/80'
              }`}
            >
              <span className="text-xl leading-none">{item.icon}</span>
              <span className="text-sm font-semibold">{item.label}</span>
              {isActive && (
                <span className="ml-auto w-2 h-2 rounded-full bg-[var(--primary-main)]" />
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer Info & Actions */}
      <div className="p-4 border-t border-[var(--sidebar-border)] space-y-3">
        {/* User email & Theme Toggle */}
        <div className="flex items-center justify-between px-2 py-1">
          <div className="text-xs text-[var(--sidebar-muted)] truncate max-w-[140px] font-medium">
            {user?.email || 'Akun Pemilik'}
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
            aria-label="Toggle Mode Gelap/Terang"
            className="p-2 rounded-xl text-sm bg-[var(--bg-card)] text-[var(--text-main)] shadow-xs border border-[var(--border-main)] hover:opacity-85 transition cursor-pointer"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>

        {/* Tombol Keluar */}
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-800 dark:text-red-200 bg-red-100/80 dark:bg-red-950/60 border border-red-300 dark:border-red-800 hover:bg-red-200/80 dark:hover:bg-red-900/60 transition cursor-pointer"
        >
          <span>🚪</span>
          <span>Keluar Akun</span>
        </button>
      </div>
    </aside>
  )
}
