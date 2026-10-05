import type { Bindings } from '../types'

export interface AvatarMediaReference {
  avatar_media_id: string | null
  avatar_object_key: string | null
}

type AvatarCleanupBindings = Pick<Bindings, 'DB' | 'MEDIA'>

export async function cleanupReplacedAvatar(
  env: AvatarCleanupBindings,
  previousAvatar: AvatarMediaReference,
) {
  if (!previousAvatar.avatar_media_id || !previousAvatar.avatar_object_key) return

  try {
    await env.MEDIA.delete(previousAvatar.avatar_object_key)
    await env.DB.prepare('DELETE FROM media WHERE id = ?')
      .bind(previousAvatar.avatar_media_id)
      .run()
  } catch (error) {
    console.error('Không thể xóa ảnh đại diện cũ', error)
  }
}
