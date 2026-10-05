// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchMedia, setAuthToken } from './api'

describe('fetchMedia', () => {
  afterEach(() => {
    setAuthToken(null)
    vi.unstubAllGlobals()
  })

  it('authenticates private media requests with the stored bearer token', async () => {
    const image = new Blob(['image'], { type: 'image/png' })
    const fetchMock = vi.fn().mockResolvedValue(new Response(image))
    vi.stubGlobal('fetch', fetchMock)
    setAuthToken('session-token')

    await expect(fetchMedia('/v1/media/avatar-id')).resolves.toEqual(image)
    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit]

    expect(new Headers(options.headers).get('Authorization')).toBe('Bearer session-token')
    expect(options.credentials).toBe('include')
  })
})
