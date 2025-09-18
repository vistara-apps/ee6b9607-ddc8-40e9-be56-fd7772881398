import crypto from 'crypto'

export class SecurityUtils {
  // Input sanitization
  static sanitizeInput(input: string): string {
    if (typeof input !== 'string') return ''

    // Remove null bytes
    input = input.replace(/\0/g, '')

    // Remove potential script tags
    input = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    input = input.replace(/<[^>]*>/g, '')

    // Remove potential SQL injection patterns
    input = input.replace(/(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/gi, '')

    // Trim whitespace
    return input.trim()
  }

  static sanitizeObject(obj: any): any {
    if (obj === null || obj === undefined) return obj

    if (typeof obj === 'string') {
      return this.sanitizeInput(obj)
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item))
    }

    if (typeof obj === 'object') {
      const sanitized: any = {}
      for (const [key, value] of Object.entries(obj)) {
        // Skip sensitive keys
        if (this.isSensitiveKey(key)) {
          sanitized[key] = '[REDACTED]'
          continue
        }

        sanitized[key] = this.sanitizeObject(value)
      }
      return sanitized
    }

    return obj
  }

  private static isSensitiveKey(key: string): boolean {
    const sensitiveKeys = [
      'password',
      'token',
      'secret',
      'key',
      'private',
      'api_key',
      'apikey',
      'authorization',
      'bearer',
      'cookie',
      'session'
    ]

    return sensitiveKeys.some(sensitive =>
      key.toLowerCase().includes(sensitive)
    )
  }

  // Hash utilities
  static hashString(input: string, algorithm: string = 'sha256'): string {
    return crypto.createHash(algorithm).update(input).digest('hex')
  }

  static hashWithSalt(input: string, salt?: string): { hash: string; salt: string } {
    const saltValue = salt || crypto.randomBytes(16).toString('hex')
    const hash = crypto.pbkdf2Sync(input, saltValue, 1000, 64, 'sha256').toString('hex')
    return { hash, salt: saltValue }
  }

  static verifyHash(input: string, hash: string, salt: string): boolean {
    const inputHash = crypto.pbkdf2Sync(input, salt, 1000, 64, 'sha256').toString('hex')
    return crypto.timingSafeEqual(Buffer.from(inputHash), Buffer.from(hash))
  }

  // Encryption utilities
  static encrypt(text: string, key: string): string {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipher('aes-256-cbc', key)
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    return iv.toString('hex') + ':' + encrypted
  }

  static decrypt(encryptedText: string, key: string): string {
    const parts = encryptedText.split(':')
    const iv = Buffer.from(parts[0], 'hex')
    const encrypted = parts[1]
    const decipher = crypto.createDecipher('aes-256-cbc', key)
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  }

  // JWT utilities (simplified)
  static generateJWT(payload: any, secret: string, expiresIn: number = 3600): string {
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    }

    const now = Math.floor(Date.now() / 1000)
    const exp = now + expiresIn

    const jwtPayload = {
      ...payload,
      iat: now,
      exp
    }

    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url')
    const encodedPayload = Buffer.from(JSON.stringify(jwtPayload)).toString('base64url')

    const data = `${encodedHeader}.${encodedPayload}`
    const signature = crypto.createHmac('sha256', secret).update(data).digest('base64url')

    return `${data}.${signature}`
  }

  static verifyJWT(token: string, secret: string): any | null {
    try {
      const parts = token.split('.')
      if (parts.length !== 3) return null

      const [encodedHeader, encodedPayload, signature] = parts

      const data = `${encodedHeader}.${encodedPayload}`
      const expectedSignature = crypto.createHmac('sha256', secret).update(data).digest('base64url')

      if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
        return null
      }

      const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString())

      // Check expiration
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        return null
      }

      return payload
    } catch (error) {
      return null
    }
  }

  // API key generation
  static generateApiKey(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  static generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex')
  }

  // Request validation
  static validateRequestOrigin(origin: string, allowedOrigins: string[]): boolean {
    if (!origin) return false

    try {
      const originUrl = new URL(origin)
      return allowedOrigins.some(allowed => {
        if (allowed === '*') return true
        if (allowed.startsWith('*.')) {
          const domain = allowed.slice(2)
          return originUrl.hostname.endsWith(domain)
        }
        return originUrl.origin === allowed
      })
    } catch {
      return false
    }
  }

  static validateContentType(contentType: string | null, allowedTypes: string[]): boolean {
    if (!contentType) return false
    return allowedTypes.some(type => contentType.includes(type))
  }

  // Rate limiting helpers
  static generateRequestFingerprint(request: Request): string {
    const url = new URL(request.url)
    const components = [
      request.method,
      url.pathname,
      request.headers.get('user-agent') || '',
      request.headers.get('x-forwarded-for') || '',
      request.headers.get('x-real-ip') || ''
    ]

    return this.hashString(components.join('|'))
  }

  // CORS validation
  static isValidCorsOrigin(origin: string): boolean {
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim())

    if (allowedOrigins.includes('*')) return true
    if (allowedOrigins.includes(origin)) return true

    // Check wildcard domains
    return allowedOrigins.some(allowed => {
      if (allowed.startsWith('*.')) {
        const domain = allowed.slice(2)
        return origin.endsWith(domain)
      }
      return false
    })
  }

  // SQL injection prevention
  static escapeSqlString(str: string): string {
    return str.replace(/'/g, "''").replace(/\\/g, '\\\\')
  }

  // XSS prevention
  static escapeHtml(str: string): string {
    const htmlEscapes: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    }

    return str.replace(/[&<>"'/]/g, (match) => htmlEscapes[match])
  }

  // File upload validation
  static validateFileUpload(file: File, options: {
    maxSize?: number
    allowedTypes?: string[]
    allowedExtensions?: string[]
  } = {}): { valid: boolean; error?: string } {
    const { maxSize = 10 * 1024 * 1024, allowedTypes = [], allowedExtensions = [] } = options

    if (file.size > maxSize) {
      return { valid: false, error: `File size exceeds maximum allowed size of ${maxSize} bytes` }
    }

    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      return { valid: false, error: `File type ${file.type} is not allowed` }
    }

    if (allowedExtensions.length > 0) {
      const extension = file.name.split('.').pop()?.toLowerCase()
      if (!extension || !allowedExtensions.includes(extension)) {
        return { valid: false, error: `File extension is not allowed` }
      }
    }

    return { valid: true }
  }

  // Log sanitization for security
  static sanitizeLogData(data: any): any {
    return this.sanitizeObject(data)
  }

  // Generate secure random values
  static generateSecureId(length: number = 16): string {
    return crypto.randomBytes(length).toString('hex')
  }

  static generateSecureCode(length: number = 6): string {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)]
    }
    return result
  }
}

