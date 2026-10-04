const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api'

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

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: options.body instanceof FormData
      ? options.headers
      : { 'Content-Type': 'application/json', ...options.headers },
  })
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiErrorBody
    throw new ApiClientError(body.error?.message ?? 'Không thể xử lý yêu cầu', response.status)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export function mediaUrl(path: string | null) {
  if (!path) return null
  return `${API_BASE}${path}`
}

