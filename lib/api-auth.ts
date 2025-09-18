import { NextRequest } from 'next/server'

interface ApiKey {
  key: string
  userId: string
  tier: 'basic' | 'premium'
  rateLimit: number // requests per minute
  createdAt: number
  lastUsed: number
  isActive: boolean
}

interface RateLimit {
  requests: number
  resetTime: number
}

export class ApiAuthService {
  private apiKeys = new Map<string, ApiKey>()
  private rateLimits = new Map<string, RateLimit>()

  constructor() {
    // Initialize with some test API keys
    this.initializeTestKeys()
  }

  private initializeTestKeys(): void {
    // Test keys for development
    const testKeys: ApiKey[] = [
      {
        key: 'test_basic_key_123',
        userId: 'user_123',
        tier: 'basic',
        rateLimit: 60, // 60 requests per minute
        createdAt: Date.now(),
        lastUsed: Date.now(),
        isActive: true
      },
      {
        key: 'test_premium_key_456',
        userId: 'user_456',
        tier: 'premium',
        rateLimit: 300, // 300 requests per minute
        createdAt: Date.now(),
        lastUsed: Date.now(),
        isActive: true
      }
    ]

    testKeys.forEach(key => {
      this.apiKeys.set(key.key, key)
    })
  }

  async authenticate(request: NextRequest): Promise<{
    isAuthenticated: boolean
    userId?: string
    tier?: 'basic' | 'premium'
    error?: string
  }> {
    try {
      // Get API key from header
      const apiKey = request.headers.get('x-api-key') ||
                     request.headers.get('authorization')?.replace('Bearer ', '')

      if (!apiKey) {
        return {
          isAuthenticated: false,
          error: 'API key is required'
        }
      }

      // Validate API key
      const keyData = this.apiKeys.get(apiKey)
      if (!keyData) {
        return {
          isAuthenticated: false,
          error: 'Invalid API key'
        }
      }

      if (!keyData.isActive) {
        return {
          isAuthenticated: false,
          error: 'API key is inactive'
        }
      }

      // Check rate limit
      const rateLimitCheck = this.checkRateLimit(apiKey, keyData.rateLimit)
      if (!rateLimitCheck.allowed) {
        return {
          isAuthenticated: false,
          error: `Rate limit exceeded. Try again in ${rateLimitCheck.resetIn} seconds`
        }
      }

      // Update last used timestamp
      keyData.lastUsed = Date.now()
      this.apiKeys.set(apiKey, keyData)

      return {
        isAuthenticated: true,
        userId: keyData.userId,
        tier: keyData.tier
      }
    } catch (error) {
      console.error('API authentication error:', error)
      return {
        isAuthenticated: false,
        error: 'Authentication failed'
      }
    }
  }

  private checkRateLimit(apiKey: string, limit: number): {
    allowed: boolean
    resetIn?: number
  } {
    const now = Date.now()
    const windowMs = 60000 // 1 minute
    const rateLimit = this.rateLimits.get(apiKey)

    if (!rateLimit) {
      // First request
      this.rateLimits.set(apiKey, {
        requests: 1,
        resetTime: now + windowMs
      })
      return { allowed: true }
    }

    if (now > rateLimit.resetTime) {
      // Reset window
      this.rateLimits.set(apiKey, {
        requests: 1,
        resetTime: now + windowMs
      })
      return { allowed: true }
    }

    if (rateLimit.requests >= limit) {
      // Rate limit exceeded
      const resetIn = Math.ceil((rateLimit.resetTime - now) / 1000)
      return {
        allowed: false,
        resetIn
      }
    }

    // Increment request count
    rateLimit.requests++
    this.rateLimits.set(apiKey, rateLimit)

    return { allowed: true }
  }

  async createApiKey(userId: string, tier: 'basic' | 'premium' = 'basic'): Promise<{
    success: boolean
    apiKey?: string
    error?: string
  }> {
    try {
      const apiKey = this.generateApiKey()
      const rateLimit = tier === 'premium' ? 300 : 60

      const keyData: ApiKey = {
        key: apiKey,
        userId,
        tier,
        rateLimit,
        createdAt: Date.now(),
        lastUsed: Date.now(),
        isActive: true
      }

      this.apiKeys.set(apiKey, keyData)

      return {
        success: true,
        apiKey
      }
    } catch (error) {
      console.error('API key creation error:', error)
      return {
        success: false,
        error: 'Failed to create API key'
      }
    }
  }

  async revokeApiKey(apiKey: string): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const keyData = this.apiKeys.get(apiKey)
      if (!keyData) {
        return {
          success: false,
          error: 'API key not found'
        }
      }

      keyData.isActive = false
      this.apiKeys.set(apiKey, keyData)

      return { success: true }
    } catch (error) {
      console.error('API key revocation error:', error)
      return {
        success: false,
        error: 'Failed to revoke API key'
      }
    }
  }

  private generateApiKey(): string {
    // Generate a secure random API key
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  getApiKeyInfo(apiKey: string): ApiKey | null {
    return this.apiKeys.get(apiKey) || null
  }

  getUserApiKeys(userId: string): ApiKey[] {
    return Array.from(this.apiKeys.values()).filter(key =>
      key.userId === userId && key.isActive
    )
  }

  // Middleware function for API routes
  async authenticateRequest(request: NextRequest): Promise<{
    isAuthenticated: boolean
    userId?: string
    tier?: 'basic' | 'premium'
    response?: NextResponse
  }> {
    const auth = await this.authenticate(request)

    if (!auth.isAuthenticated) {
      return {
        isAuthenticated: false,
        response: NextResponse.json(
          { error: auth.error },
          { status: 401 }
        )
      }
    }

    return {
      isAuthenticated: true,
      userId: auth.userId,
      tier: auth.tier
    }
  }
}

// Singleton instance
export const apiAuthService = new ApiAuthService()

