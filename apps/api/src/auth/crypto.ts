const PASSWORD_ITERATIONS = 100_000
const SALT_BYTES = 16
const HASH_BYTES = 32

function bytesToBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
}

function base64ToBytes(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value)
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

async function derivePassword(password: string, salt: Uint8Array<ArrayBuffer>, iterations: number) {
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    material,
    HASH_BYTES * 8,
  )
  return new Uint8Array(bits)
}

export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES))
  const hash = await derivePassword(password, salt, PASSWORD_ITERATIONS)
  return {
    hash: bytesToBase64(hash),
    salt: bytesToBase64(salt),
    iterations: PASSWORD_ITERATIONS,
  }
}

export async function verifyPassword(
  password: string,
  expectedHash: string,
  salt: string,
  iterations: number,
) {
  const actual = await derivePassword(password, base64ToBytes(salt), iterations)
  const expected = base64ToBytes(expectedHash)
  if (actual.length !== expected.length) return false
  let difference = 0
  actual.forEach((value, index) => {
    difference |= value ^ (expected[index] ?? 0)
  })
  return difference === 0
}

export async function hashToken(token: string) {
  const data = new TextEncoder().encode(token)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return bytesToBase64(new Uint8Array(digest))
}

export function generateToken() {
  return bytesToBase64(crypto.getRandomValues(new Uint8Array(HASH_BYTES)))
}
