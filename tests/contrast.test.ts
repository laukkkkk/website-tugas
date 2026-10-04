import { describe, it, expect } from 'vitest'

/**
 * Menghitung relative luminance sesuai rumus WCAG 2.1
 * https://www.w3.org/WAI/GL/wiki/Relative_luminance
 */
export function hexKeLuminance(hex: string): number {
  const cleanHex = hex.replace('#', '')
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255

  const linearize = (val: number) =>
    val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4)

  const rLin = linearize(r)
  const gLin = linearize(g)
  const bLin = linearize(b)

  return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin
}

/**
 * Menghitung contrast ratio antara dua warna hex (1:1 hingga 21:1)
 */
export function rasioKontras(hex1: string, hex2: string): number {
  const l1 = hexKeLuminance(hex1)
  const l2 = hexKeLuminance(hex2)
  const brighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (brighter + 0.05) / (darker + 0.05)
}

describe('Validasi Rasio Kontras WCAG AA (>= 4.5:1)', () => {
  describe('Mode Terang (Light Mode)', () => {
    const bgCard = '#ffffff'
    const bgPage = '#f8fafc'
    const sidebarBg = '#e0f7fa'

    it('Teks utama (--text-main) memenuhi WCAG AA pada kartu', () => {
      const textMain = '#0f172a'
      const ratio = rasioKontras(textMain, bgCard)
      expect(ratio).toBeGreaterThanOrEqual(4.5)
    })

    it('Teks sekunder (--text-sub) memenuhi WCAG AA pada kartu', () => {
      const textSub = '#475569'
      const ratio = rasioKontras(textSub, bgCard)
      expect(ratio).toBeGreaterThanOrEqual(4.5)
    })

    it('Teks utama (--text-main) memenuhi WCAG AA pada latar halaman', () => {
      const textMain = '#0f172a'
      const ratio = rasioKontras(textMain, bgPage)
      expect(ratio).toBeGreaterThanOrEqual(4.5)
    })

    it('Teks sekunder (--text-sub) memenuhi WCAG AA pada latar halaman', () => {
      const textSub = '#475569'
      const ratio = rasioKontras(textSub, bgPage)
      expect(ratio).toBeGreaterThanOrEqual(4.5)
    })

    it('Teks sidebar (--sidebar-text) memenuhi WCAG AA pada sidebar', () => {
      const sidebarText = '#1e293b'
      const ratio = rasioKontras(sidebarText, sidebarBg)
      expect(ratio).toBeGreaterThanOrEqual(4.5)
    })

    it('Aksen sidebar (--sidebar-accent) memenuhi WCAG AA pada sidebar', () => {
      const sidebarAccent = '#00606b'
      const ratio = rasioKontras(sidebarAccent, sidebarBg)
      expect(ratio).toBeGreaterThanOrEqual(4.5)
    })
  })

  describe('Mode Gelap (Dark Mode)', () => {
    const bgCard = '#1e293b'
    const bgPage = '#0f172a'
    const sidebarBg = '#111d2e'

    it('Teks utama (#ffffff) memenuhi kontras tinggi pada kartu gelap', () => {
      const textMain = '#ffffff'
      const ratio = rasioKontras(textMain, bgCard)
      expect(ratio).toBeGreaterThanOrEqual(4.5)
      expect(ratio).toBeGreaterThan(10) // Sangat kontras dan tajam
    })

    it('Teks sekunder (minimal #cbd5e1) memenuhi WCAG AA pada kartu gelap', () => {
      const textSub = '#cbd5e1'
      const ratio = rasioKontras(textSub, bgCard)
      expect(ratio).toBeGreaterThanOrEqual(4.5)
    })

    it('Teks utama (#ffffff) memenuhi WCAG AA pada latar halaman gelap', () => {
      const textMain = '#ffffff'
      const ratio = rasioKontras(textMain, bgPage)
      expect(ratio).toBeGreaterThanOrEqual(4.5)
      expect(ratio).toBeGreaterThan(15)
    })

    it('Teks sekunder (#cbd5e1) memenuhi WCAG AA pada latar halaman gelap', () => {
      const textSub = '#cbd5e1'
      const ratio = rasioKontras(textSub, bgPage)
      expect(ratio).toBeGreaterThanOrEqual(4.5)
    })

    it('Teks sidebar (#ffffff) memenuhi WCAG AA pada sidebar gelap', () => {
      const sidebarText = '#ffffff'
      const ratio = rasioKontras(sidebarText, sidebarBg)
      expect(ratio).toBeGreaterThanOrEqual(4.5)
    })

    it('Aksen sidebar (#80deea) memenuhi WCAG AA pada sidebar gelap', () => {
      const sidebarAccent = '#80deea'
      const ratio = rasioKontras(sidebarAccent, sidebarBg)
      expect(ratio).toBeGreaterThanOrEqual(4.5)
    })
  })

  describe('Kartu & Badge Deadline Berwarna (COLOR_SCHEMES)', () => {
    it('Merah: kontras pada kartu terang dan gelap', () => {
      // Terang: red-900 pada red-50
      const ratioLight = rasioKontras('#7f1d1d', '#fef2f2')
      expect(ratioLight).toBeGreaterThanOrEqual(4.5)

      // Gelap: text putih pada latar merah gelap (#2d0b0b)
      const ratioDark = rasioKontras('#ffffff', '#2d0b0b')
      expect(ratioDark).toBeGreaterThanOrEqual(4.5)

      // Gelap badge: text red-200 (#fecaca) pada red-950 (#450a0a)
      const ratioDarkBadge = rasioKontras('#fecaca', '#450a0a')
      expect(ratioDarkBadge).toBeGreaterThanOrEqual(4.5)
    })

    it('Kuning: kontras pada kartu terang dan gelap', () => {
      // Terang: amber-950 pada amber-50
      const ratioLight = rasioKontras('#451a03', '#fffbeb')
      expect(ratioLight).toBeGreaterThanOrEqual(4.5)

      // Gelap: text putih pada latar amber gelap (#2e1404)
      const ratioDark = rasioKontras('#ffffff', '#2e1404')
      expect(ratioDark).toBeGreaterThanOrEqual(4.5)

      // Gelap badge: text amber-200 (#fde68a) pada amber-950 (#451a03)
      const ratioDarkBadge = rasioKontras('#fde68a', '#451a03')
      expect(ratioDarkBadge).toBeGreaterThanOrEqual(4.5)
    })

    it('Hijau: kontras pada kartu terang dan gelap', () => {
      // Terang: emerald-950 pada emerald-50
      const ratioLight = rasioKontras('#022c22', '#ecfdf5')
      expect(ratioLight).toBeGreaterThanOrEqual(4.5)

      // Gelap: text putih pada latar emerald gelap (#04261b)
      const ratioDark = rasioKontras('#ffffff', '#04261b')
      expect(ratioDark).toBeGreaterThanOrEqual(4.5)

      // Gelap badge: text emerald-200 (#a7f3d0) pada emerald-950 (#022c22)
      const ratioDarkBadge = rasioKontras('#a7f3d0', '#022c22')
      expect(ratioDarkBadge).toBeGreaterThanOrEqual(4.5)
    })
  })
})
