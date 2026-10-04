const { mockGetSession } = vi.hoisted(() => {
  return {
    mockGetSession: vi.fn(),
  }
})

vi.mock('./supabase.js', () => {
  return {
    supabase: {
      auth: {
        getSession: mockGetSession,
      },
    },
  }
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiFetch, api, AUTH_UNAUTHORIZED_EVENT } from './api.js'

describe('API Fetch Wrapper (src/lib/api.ts)', () => {
  const mockFetch = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', mockFetch)
  })

  it('menyisipkan header Authorization: Bearer <token> jika session tersedia', async () => {
    mockGetSession.mockResolvedValueOnce({
      data: {
        session: {
          access_token: 'valid-jwt-token-123',
        },
      },
    })

    const mockResponse = new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
    mockFetch.mockResolvedValueOnce(mockResponse)

    const response = await apiFetch('/api/me')

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/me',
      expect.objectContaining({
        headers: expect.any(Headers),
      })
    )

    const fetchCall = mockFetch.mock.calls[0]
    const headers = fetchCall[1]?.headers as Headers
    expect(headers.get('Authorization')).toBe('Bearer valid-jwt-token-123')
    expect(response.status).toBe(200)
  })

  it('tidak menyisipkan header Authorization jika tidak ada session', async () => {
    mockGetSession.mockResolvedValueOnce({
      data: { session: null },
    })

    const mockResponse = new Response('OK', { status: 200 })
    mockFetch.mockResolvedValueOnce(mockResponse)

    await apiFetch('/api/health')

    const fetchCall = mockFetch.mock.calls[0]
    const headers = fetchCall[1]?.headers as Headers
    expect(headers.get('Authorization')).toBeNull()
  })

  it('memancarkan event auth unauthorized dan memanggil callback saat respons 401', async () => {
    mockGetSession.mockResolvedValueOnce({
      data: { session: { access_token: 'expired-token' } },
    })

    const mockResponse = new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
    })
    mockFetch.mockResolvedValueOnce(mockResponse)

    const mockWindow = new EventTarget()
    ;(globalThis as any).window = mockWindow
    ;(globalThis as any).CustomEvent = class CustomEvent extends Event {
      detail: any
      constructor(type: string, init?: any) {
        super(type)
        this.detail = init?.detail
      }
    }

    const onUnauthorized = vi.fn()
    const eventSpy = vi.fn()
    mockWindow.addEventListener(AUTH_UNAUTHORIZED_EVENT, eventSpy)

    const response = await apiFetch('/api/tugas', { onUnauthorized })

    expect(response.status).toBe(401)
    expect(onUnauthorized).toHaveBeenCalledTimes(1)
    expect(eventSpy).toHaveBeenCalledTimes(1)

    delete (globalThis as any).window
    delete (globalThis as any).CustomEvent
  })

  it('helper api.get, api.post, api.delete memanggil apiFetch dengan method yang benar', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } })
    mockFetch.mockResolvedValue(new Response('OK', { status: 200 }))

    await api.get('/api/test-get')
    expect(mockFetch).toHaveBeenLastCalledWith(
      '/api/test-get',
      expect.objectContaining({ method: 'GET' })
    )

    await api.post('/api/test-post', { nama: 'Tes' })
    expect(mockFetch).toHaveBeenLastCalledWith(
      '/api/test-post',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ nama: 'Tes' }),
      })
    )

    await api.delete('/api/test-delete')
    expect(mockFetch).toHaveBeenLastCalledWith(
      '/api/test-delete',
      expect.objectContaining({ method: 'DELETE' })
    )
  })
})
