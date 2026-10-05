import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanupReplacedAvatar } from './avatar'

function cleanupEnvironment(deleteObject = vi.fn().mockResolvedValue(undefined)) {
  const run = vi.fn().mockResolvedValue(undefined)
  const bind = vi.fn(() => ({ run }))
  const prepare = vi.fn(() => ({ bind }))
  return { env: { MEDIA: { delete: deleteObject }, DB: { prepare } }, prepare, bind, run }
}

describe('cleanupReplacedAvatar', () => {
  afterEach(() => vi.restoreAllMocks())

  it('deletes the old R2 object before its media record', async () => {
    const { env, prepare, bind, run } = cleanupEnvironment()

    await cleanupReplacedAvatar(env as never, {
      avatar_media_id: 'old-media',
      avatar_object_key: 'avatars/user/portfolio/old.webp',
    })

    expect(env.MEDIA.delete).toHaveBeenCalledWith('avatars/user/portfolio/old.webp')
    expect(prepare).toHaveBeenCalledWith('DELETE FROM media WHERE id = ?')
    expect(bind).toHaveBeenCalledWith('old-media')
    expect(run).toHaveBeenCalledOnce()
  })

  it('keeps the media record when deleting the R2 object fails', async () => {
    const deleteObject = vi.fn().mockRejectedValue(new Error('R2 unavailable'))
    const { env, prepare } = cleanupEnvironment(deleteObject)
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    await expect(cleanupReplacedAvatar(env as never, {
      avatar_media_id: 'old-media',
      avatar_object_key: 'avatars/user/portfolio/old.webp',
    })).resolves.toBeUndefined()

    expect(prepare).not.toHaveBeenCalled()
  })
})
