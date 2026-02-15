import crypto from 'crypto'

// Use the same key as database
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!
const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16

if (!ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY environment variable is required')
}

// Convert base64 key to buffer
const key = Buffer.from(ENCRYPTION_KEY, 'base64')

if (key.length !== 32) {
  throw new Error('ENCRYPTION_KEY must be 32 bytes (base64 encoded)')
}

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  })
  
  const encrypted = Buffer.concat([
    cipher.update(text, 'utf8'),
    cipher.final(),
  ])
  
  const authTag = cipher.getAuthTag()
  
  // Combine iv + authTag + encrypted
  const result = Buffer.concat([iv, authTag, encrypted])
  
  return result.toString('base64')
}

export function decrypt(encryptedData: string): string {
  const data = Buffer.from(encryptedData, 'base64')
  
  // Extract iv, authTag, and encrypted text
  const iv = data.subarray(0, IV_LENGTH)
  const authTag = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
  const encrypted = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH)
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  })
  
  decipher.setAuthTag(authTag)
  
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ])
  
  return decrypted.toString('utf8')
}

// For testing
export function testEncryption() {
  const testString = 'test-token-123'
  const encrypted = encrypt(testString)
  const decrypted = decrypt(encrypted)
  
  if (testString !== decrypted) {
    throw new Error('Encryption test failed')
  }
  
  console.log('✅ Encryption test passed')
  return true
}