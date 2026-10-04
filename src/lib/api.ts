import { supabase } from './supabase.js'

/**
 * Event nama yang dipancarkan ketika request API mendapatkan status 401 Unauthorized.
 */
export const AUTH_UNAUTHORIZED_EVENT = 'app:auth:unauthorized'

export interface ApiFetchOptions extends RequestInit {
  onUnauthorized?: () => void
}

/**
 * Wrapper fetch yang otomatis menyisipkan header Authorization: Bearer <token>
 * dari sesi Supabase aktif, serta mengarahkan ke login jika menerima respons 401.
 */
export async function apiFetch(
  input: string | URL | Request,
  options: ApiFetchOptions = {}
): Promise<Response> {
  const { onUnauthorized, headers: customHeaders, ...restOptions } = options

  // 1. Ambil session aktif dari Supabase
  const { data } = await supabase.auth.getSession()
  const accessToken = data.session?.access_token

  // 2. Siapkan headers dengan Authorization Bearer jika token tersedia
  const headers = new Headers(customHeaders || {})
  if (accessToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }
  if (!headers.has('Content-Type') && !(restOptions.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  // 3. Eksekusi fetch request
  const response = await fetch(input, {
    ...restOptions,
    headers,
  })

  // 4. Tangani respons 401 Unauthorized
  if (response.status === 401) {
    if (typeof onUnauthorized === 'function') {
      onUnauthorized()
    }

    // Pancarkan event global agar Router / AuthContext segera merespons
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT))
    }
  }

  return response
}

/**
 * Helper method untuk request JSON yang umum.
 */
export const api = {
  get: (url: string, options?: ApiFetchOptions) =>
    apiFetch(url, { ...options, method: 'GET' }),

  post: (url: string, body?: unknown, options?: ApiFetchOptions) =>
    apiFetch(url, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  put: (url: string, body?: unknown, options?: ApiFetchOptions) =>
    apiFetch(url, {
      ...options,
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  patch: (url: string, body?: unknown, options?: ApiFetchOptions) =>
    apiFetch(url, {
      ...options,
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  delete: (url: string, options?: ApiFetchOptions) =>
    apiFetch(url, { ...options, method: 'DELETE' }),
}
