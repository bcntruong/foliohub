import { describe, expect, it } from 'vitest'
import { generateToken, hashPassword, hashToken, verifyPassword } from './crypto'

describe('password security', () => {
  it('accepts the original password and rejects a different one', async () => {
    const password = await hashPassword('correct-horse-battery-staple')

    await expect(
      verifyPassword('correct-horse-battery-staple', password.hash, password.salt, password.iterations),
    ).resolves.toBe(true)
    await expect(
      verifyPassword('wrong-password', password.hash, password.salt, password.iterations),
    ).resolves.toBe(false)
  })

  it('creates non-reusable session token hashes', async () => {
    const first = generateToken()
    const second = generateToken()

    expect(first).not.toBe(second)
    expect(await hashToken(first)).not.toBe(first)
  })
})

