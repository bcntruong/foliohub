import { ALLOWED_IMAGE_TYPES, MAX_MEDIA_BYTES } from '@foliohub/contracts'
import { Hono } from 'hono'
import { requireSession } from '../auth/session'
import { ApiError, STATUS } from '../http'
import { authMiddleware } from '../middleware/auth'
import type { AppEnvironment } from '../types'

interface MediaAccessRow {
  object_key: string
  content_type: string
  original_name: string
  user_id: string
  visibility: 'private' | 'public'
}

const AVATAR_OBJECT_PREFIX = 'avatars'

export const mediaRoutes = new Hono<AppEnvironment>()

mediaRoutes.post('/portfolio/:portfolioId/avatar', authMiddleware, async (context) => {
  const portfolioId = context.req.param('portfolioId')
  const owned = await context.env.DB.prepare('SELECT id FROM portfolios WHERE id = ? AND user_id = ?')
    .bind(portfolioId, context.get('user').id)
    .first()
  if (!owned) throw new ApiError(STATUS.notFound, 'Không tìm thấy portfolio', 'PORTFOLIO_NOT_FOUND')

  const body = await context.req.parseBody()
  const image = body.image
  if (!(image instanceof File)) {
    throw new ApiError(STATUS.badRequest, 'Chưa chọn ảnh', 'IMAGE_REQUIRED')
  }
  if (!ALLOWED_IMAGE_TYPES.includes(image.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    throw new ApiError(STATUS.unsupportedMediaType, 'Chỉ hỗ trợ JPEG, PNG hoặc WebP', 'INVALID_IMAGE_TYPE')
  }
  if (image.size > MAX_MEDIA_BYTES) {
    throw new ApiError(STATUS.payloadTooLarge, 'Ảnh tối đa 5 MB', 'IMAGE_TOO_LARGE')
  }

  const id = crypto.randomUUID()
  const extension = image.type.split('/')[1] ?? 'image'
  const objectKey = `${AVATAR_OBJECT_PREFIX}/${context.get('user').id}/${portfolioId}/${id}.${extension}`
  await context.env.MEDIA.put(objectKey, image.stream(), { httpMetadata: { contentType: image.type } })
  try {
    await context.env.DB.batch([
      context.env.DB.prepare(
        `INSERT INTO media
          (id, user_id, portfolio_id, object_key, original_name, content_type, size_bytes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(id, context.get('user').id, portfolioId, objectKey, image.name, image.type, image.size, Date.now()),
      context.env.DB.prepare('UPDATE portfolios SET avatar_media_id = ?, updated_at = ? WHERE id = ?').bind(
        id,
        Date.now(),
        portfolioId,
      ),
    ])
  } catch (error) {
    await context.env.MEDIA.delete(objectKey)
    throw error
  }
  return context.json({ media: { id, url: `/v1/media/${id}` } }, 201)
})

mediaRoutes.get('/:id', async (context) => {
  const row = await context.env.DB.prepare(
    `SELECT media.object_key, media.content_type, media.original_name, media.user_id, portfolios.visibility
     FROM media JOIN portfolios ON portfolios.id = media.portfolio_id WHERE media.id = ?`,
  )
    .bind(context.req.param('id'))
    .first<MediaAccessRow>()
  if (!row) throw new ApiError(STATUS.notFound, 'Không tìm thấy ảnh', 'MEDIA_NOT_FOUND')

  if (row.visibility === 'private') {
    const session = await requireSession(context).catch(() => null)
    if (session?.user.id !== row.user_id) {
      throw new ApiError(STATUS.notFound, 'Không tìm thấy ảnh', 'MEDIA_NOT_FOUND')
    }
  }
  const object = await context.env.MEDIA.get(row.object_key)
  if (!object) throw new ApiError(STATUS.notFound, 'Không tìm thấy ảnh', 'MEDIA_NOT_FOUND')
  return new Response(object.body, {
    headers: {
      'Cache-Control': row.visibility === 'public' ? 'public, max-age=3600' : 'private, no-store',
      'Content-Type': row.content_type,
      ETag: object.httpEtag,
    },
  })
})
