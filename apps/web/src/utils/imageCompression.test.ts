import { describe, expect, it } from 'vitest'
import { containedImageSize } from './imageCompression'

describe('containedImageSize', () => {
  it('shrinks a landscape image without changing its aspect ratio', () => {
    expect(containedImageSize(4000, 3000, 512)).toEqual({ width: 512, height: 384 })
  })

  it('does not upscale a small image', () => {
    expect(containedImageSize(320, 240, 512)).toEqual({ width: 320, height: 240 })
  })
})
