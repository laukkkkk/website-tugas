import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from './AuthContext.js'

export type PageRoute = 'dashboard' | 'tugas' | 'kerjaan' | 'catatan' | 'login'

interface RouterContextType {
  route: PageRoute
  pathname: string
  navigate: (path: string) => void
}

const RouterContext = createContext<RouterContextType | undefined>(undefined)

export function pathToRoute(path: string): PageRoute {
  const clean = path.toLowerCase().replace(/\/+$/, '') || '/'
  if (clean === '/login') return 'login'
  if (clean === '/tugas') return 'tugas'
  if (clean === '/kerjaan') return 'kerjaan'
  if (clean === '/catatan' || clean === '/notes') return 'catatan'
  return 'dashboard' // Default untuk '/' dan '/dashboard'
}

export function routeToPath(route: PageRoute): string {
  switch (route) {
    case 'login':
      return '/login'
    case 'tugas':
      return '/tugas'
    case 'kerjaan':
      return '/kerjaan'
    case 'catatan':
      return '/catatan'
    default:
      return '/'
  }
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth()
  const [pathname, setPathname] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname || '/'
    }
    return '/'
  })

  // Sinkronisasi dengan browser popstate (tombol back/forward)
  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname || '/')
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigate = (newPath: string) => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', newPath)
    }
    setPathname(newPath)
  }

  // Sinkronisasi URL jika session berubah
  useEffect(() => {
    if (loading) return
    if (!session && pathname !== '/login') {
      window.history.replaceState({}, '', '/login')
      setPathname('/login')
    }
  }, [session, loading])

  const route = pathToRoute(pathname)

  return (
    <RouterContext.Provider value={{ route, pathname, navigate }}>
      {children}
    </RouterContext.Provider>
  )
}

export function useRouter(): RouterContextType {
  const context = useContext(RouterContext)
  if (!context) {
    throw new Error('useRouter must be used within a RouterProvider')
  }
  return context
}
