import { describe, it, expect } from 'vitest'
import { pathToRoute, routeToPath } from './RouterContext.js'

describe('Router Utilities (src/context/RouterContext.ts)', () => {
  it('memetakan path URL ke route yang tepat', () => {
    expect(pathToRoute('/')).toBe('dashboard')
    expect(pathToRoute('/dashboard')).toBe('dashboard')
    expect(pathToRoute('/tugas')).toBe('tugas')
    expect(pathToRoute('/tugas/')).toBe('tugas')
    expect(pathToRoute('/kerjaan')).toBe('kerjaan')
    expect(pathToRoute('/catatan')).toBe('catatan')
    expect(pathToRoute('/notes')).toBe('catatan')
    expect(pathToRoute('/login')).toBe('login')
  })

  it('memetakan route ke path URL yang tepat', () => {
    expect(routeToPath('dashboard')).toBe('/')
    expect(routeToPath('tugas')).toBe('/tugas')
    expect(routeToPath('kerjaan')).toBe('/kerjaan')
    expect(routeToPath('catatan')).toBe('/catatan')
    expect(routeToPath('login')).toBe('/login')
  })
})
