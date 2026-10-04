import { useState, type ReactNode } from 'react'
import { Sidebar } from './Sidebar.js'
import { Header } from './Header.js'

export function Layout({ children }: { children: ReactNode }) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)

  const handleCloseDrawer = () => {
    setMobileDrawerOpen(false)
  }

  const handleToggleDrawer = () => {
    setMobileDrawerOpen((prev) => !prev)
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100">
      {/* 1. Sidebar untuk Layar Laptop / Desktop (Tetap di Sisi Kiri) */}
      <div className="hidden md:flex flex-shrink-0 h-full">
        <Sidebar />
      </div>

      {/* 2. Sidebar Mobile Drawer (Panel Mengambang di Atas Konten) */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Latar Gelap Transparan (Backdrop Overlay) */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={handleCloseDrawer}
            aria-label="Tutup Menu"
          />

          {/* Panel Sidebar Sisi Kiri */}
          <div className="relative z-10 flex h-full max-w-xs w-full shadow-2xl animate-in slide-in-from-left duration-200">
            <Sidebar onItemClick={handleCloseDrawer} />
          </div>
        </div>
      )}

      {/* 3. Area Konten Utama */}
      <div className="flex flex-col flex-1 h-full min-w-0 overflow-hidden">
        {/* Header Bar untuk HP */}
        <Header onToggleSidebar={handleToggleDrawer} />

        {/* Konten Halaman */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}
