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
    <aside
      className="flex flex-col h-full w-64 border-r transition-colors"
      style={{
        backgroundColor: 'var(--color-cyan-sidebar)',
        borderColor: theme === 'dark' ? '#1e293b' : '#b2ebf2',
      }}
    >
      {/* Brand Header */}
      <div className="p-6 border-b flex items-center justify-between"
        style={{ borderColor: theme === 'dark' ? '#1e293b' : '#b2ebf2' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xl shadow-sm text-white"
            style={{ backgroundColor: 'var(--color-cyan-main)' }}
          >
            📋
          </div>
          <div>
            <h1
              className="text-lg font-bold leading-tight"
              style={{ color: 'var(--color-cyan-accent)' }}
            >
              Website Tugas
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Personal Task Manager
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {MENU_ITEMS.map((item) => {
          const isActive = route === item.route
          return (
            <button
              key={item.route}
              type="button"
              onClick={() => handleNav(item.path)}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-left font-medium transition-all ${
                isActive
                  ? 'shadow-sm font-semibold'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-cyan-100/50 dark:hover:bg-slate-800/60'
              }`}
              style={{
                backgroundColor: isActive ? 'var(--color-cyan-active)' : undefined,
                color: isActive ? 'var(--color-cyan-accent)' : undefined,
              }}
            >
              <span className="text-xl leading-none">{item.icon}</span>
              <span className="text-sm">{item.label}</span>
              {isActive && (
                <span
                  className="ml-auto w-2 h-2 rounded-full"
                  style={{ backgroundColor: 'var(--color-cyan-main)' }}
                />
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer Info & Actions */}
      <div
        className="p-4 border-t space-y-3"
        style={{ borderColor: theme === 'dark' ? '#1e293b' : '#b2ebf2' }}
      >
        {/* User email & Theme Toggle */}
        <div className="flex items-center justify-between px-2 py-1">
          <div className="text-xs text-slate-600 dark:text-slate-400 truncate max-w-[140px]">
            {user?.email || 'Akun Pemilik'}
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
            aria-label="Toggle Mode Gelap/Terang"
            className="p-2 rounded-lg text-sm bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 hover:opacity-80 transition"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>

        {/* Tombol Keluar */}
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 hover:bg-red-100 dark:hover:bg-red-900/40 transition"
        >
          <span>🚪</span>
          <span>Keluar Akun</span>
        </button>
      </div>
    </aside>
  )
}
