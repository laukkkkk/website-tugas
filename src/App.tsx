import { ThemeProvider } from './context/ThemeContext.js'
import { AuthProvider, useAuth } from './context/AuthContext.js'
import { RouterProvider, useRouter } from './context/RouterContext.js'
import { Layout } from './components/Layout.js'
import { Login } from './pages/Login.js'
import { Dashboard } from './pages/Dashboard.js'
import { Tugas } from './pages/Tugas.js'
import { Kerjaan } from './pages/Kerjaan.js'
import { Catatan } from './pages/Catatan.js'

function AppContent() {
  const { loading, session } = useAuth()
  const { route } = useRouter()

  // Tampilkan layar memuat saat memeriksa status otentikasi awal
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg animate-bounce text-white"
            style={{ backgroundColor: 'var(--color-cyan-main)' }}
          >
            📋
          </div>
          <div className="text-sm font-semibold tracking-wide text-slate-500 dark:text-slate-400">
            Memuat Website Tugas...
          </div>
        </div>
      </div>
    )
  }

  // Jika belum login atau rute login
  if (!session || route === 'login') {
    return <Login />
  }

  // Halaman terotentikasi dalam Layout
  return (
    <Layout>
      {route === 'dashboard' && <Dashboard />}
      {route === 'tugas' && <Tugas />}
      {route === 'kerjaan' && <Kerjaan />}
      {route === 'catatan' && <Catatan />}
    </Layout>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RouterProvider>
          <AppContent />
        </RouterProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
