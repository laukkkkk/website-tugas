import { useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext.js'
import { useRouter } from '../context/RouterContext.js'
import { useTheme } from '../context/ThemeContext.js'

export function Login() {
  const { login } = useAuth()
  const { navigate } = useRouter()
  const { theme, toggleTheme } = useTheme()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!email.trim() || !password) {
      setErrorMessage('Silakan masukkan email dan kata sandi Anda.')
      return
    }

    setLoading(true)
    const result = await login(email, password)
    setLoading(false)

    if (!result.success) {
      setErrorMessage(result.error || 'Email atau kata sandi salah. Silakan coba lagi.')
    } else {
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white dark:bg-slate-950 transition-colors">
      {/* Tombol Tema di Sudut Kanan Atas */}
      <div className="absolute top-4 right-4">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Ganti Tema"
          className="p-2.5 rounded-xl text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>

      <div className="w-full max-w-md">
        {/* Card Form Login */}
        <div
          className="p-8 sm:p-10 rounded-3xl shadow-xl border transition-all"
          style={{
            backgroundColor: theme === 'dark' ? '#111d2e' : '#ffffff',
            borderColor: theme === 'dark' ? '#1e293b' : '#b2ebf2',
          }}
        >
          {/* Logo & Judul */}
          <div className="text-center mb-8">
            <div
              className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center text-3xl shadow-md text-white"
              style={{ backgroundColor: 'var(--color-cyan-main)' }}
            >
              📋
            </div>
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ color: 'var(--color-cyan-accent)' }}
            >
              Website Tugas
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Masuk ke akun pemilik untuk mengelola tugas & kerjaan
            </p>
          </div>

          {/* Kotak Pesan Error */}
          {errorMessage && (
            <div
              role="alert"
              className="mb-6 p-4 rounded-xl text-sm font-medium bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 flex items-start gap-2.5 animate-in fade-in"
            >
              <span className="text-base leading-none">⚠️</span>
              <span className="flex-1">{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-wider mb-2 text-slate-700 dark:text-slate-300"
              >
                Email Pemilik
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full px-4 py-3 rounded-xl border bg-slate-50/50 dark:bg-slate-900/60 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition"
                style={{
                  outlineColor: 'var(--color-cyan-main)',
                }}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-wider mb-2 text-slate-700 dark:text-slate-300"
              >
                Kata Sandi
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border bg-slate-50/50 dark:bg-slate-900/60 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition"
                style={{
                  outlineColor: 'var(--color-cyan-main)',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-sm shadow-md hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer text-slate-900"
              style={{
                backgroundColor: 'var(--color-cyan-main)',
              }}
            >
              {loading ? 'Sedang Memeriksa...' : 'Masuk ke Dashboard'}
            </button>
          </form>

          {/* Catatan satu akun */}
          <div className="mt-8 text-center text-xs text-slate-400 dark:text-slate-500 border-t pt-4 border-slate-100 dark:border-slate-800">
            Aplikasi privat satu pengguna pribadi.
          </div>
        </div>
      </div>
    </div>
  )
}
