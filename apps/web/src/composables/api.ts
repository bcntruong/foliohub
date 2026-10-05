const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api'
const AUTH_TOKEN_KEY = 'foliohub_auth_token'

interface ApiErrorBody {
  error?: { message?: string }
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message)
  }
}

export function setAuthToken(token: string | null) {
  if (token) sessionStorage.setItem(AUTH_TOKEN_KEY, token)
  else sessionStorage.removeItem(AUTH_TOKEN_KEY)
}

function authHeaders(headers?: HeadersInit) {
  const result = new Headers(headers)
  const token = sessionStorage.getItem(AUTH_TOKEN_KEY)
  if (token) result.set('Authorization', `Bearer ${token}`)
  return result
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = authHeaders(options.headers)
  if (!(options.body instanceof FormData)) headers.set('Content-Type', 'application/json')

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers,
  })
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiErrorBody
    throw new ApiClientError(body.error?.message ?? 'Không thể xử lý yêu cầu', response.status)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export async function fetchMedia(path: string, signal?: AbortSignal) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: authHeaders(),
    signal,
  })
  if (!response.ok) throw new ApiClientError('Không thể tải ảnh', response.status)
  return response.blob()
}
