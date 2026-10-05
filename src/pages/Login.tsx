import { useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext.js'
import { useRouter } from '../context/RouterContext.js'
import { useTheme } from '../context/ThemeContext.js'
import { Button } from '../components/Button.js'
import { Card } from '../components/Card.js'
import { Input } from '../components/Input.js'

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
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg-page)] text-[var(--text-main)] transition-colors">
      {/* Tombol Tema di Sudut Kanan Atas */}
      <div className="absolute top-4 right-4">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Ganti Tema"
          className="p-2.5 rounded-xl text-sm bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-main)] shadow-xs hover:opacity-85 transition cursor-pointer"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>

      <div className="w-full max-w-md">
        {/* Card Form Login */}
        <Card className="p-8 sm:p-10 shadow-xl border-[var(--border-main)]">
          {/* Logo & Judul */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center text-3xl shadow-md text-white bg-[#00838f]">
              📋
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--sidebar-accent)]">
              Website Tugas
            </h1>
            <p className="text-sm text-[var(--text-sub)] mt-1 font-medium">
              Masuk ke akun pemilik untuk mengelola tugas & kerjaan
            </p>
          </div>

          {/* Kotak Pesan Error */}
          {errorMessage && (
            <div
              role="alert"
              className="mb-6 p-4 rounded-xl text-sm font-semibold bg-red-100 dark:bg-[#450a0a] border border-red-300 dark:border-red-800 text-red-900 dark:text-red-200 flex items-start gap-2.5"
            >
              <span className="text-base leading-none">⚠️</span>
              <span className="flex-1">{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              label="Email Pemilik"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
            />

            <Input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              label="Kata Sandi"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={loading}
              className="w-full"
            >
              Masuk ke Dashboard
            </Button>
          </form>

          {/* Catatan satu akun */}
          <div className="mt-8 text-center text-xs text-[var(--text-sub)] border-t pt-4 border-[var(--border-main)] font-medium">
            Aplikasi privat satu pengguna pribadi.
          </div>
        </Card>
      </div>
    </div>
  )
}
