import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

const defaultRateLimit: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
  skipSuccessfulRequests: false,
  skipFailedRequests: false
}

const apiRateLimit: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: parseInt(process.env.API_RATE_LIMIT_BASIC || '60'),
  skipSuccessfulRequests: false,
  skipFailedRequests: true
}

function getClientIP(request: NextRequest): string {
  // Get client IP from various headers
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const clientIP = request.headers.get('x-client-ip')

  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  if (realIP) {
    return realIP
  }

  if (clientIP) {
    return clientIP
  }

  // Fallback to a default identifier
  return request.headers.get('user-agent') || 'unknown'
}

function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = defaultRateLimit
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const windowStart = now - config.windowMs

  let clientData = rateLimitStore.get(identifier)

  if (!clientData || clientData.resetTime < windowStart) {
    // Reset or initialize client data
    clientData = {
      count: 0,
      resetTime: now + config.windowMs
    }
  }

  const remaining = Math.max(0, config.maxRequests - clientData.count)
  const allowed = clientData.count < config.maxRequests

  if (allowed) {
    clientData.count++
    rateLimitStore.set(identifier, clientData)
  }

  return {
    allowed,
    remaining: allowed ? remaining - 1 : remaining,
    resetTime: clientData.resetTime
  }
}

function shouldSkipRateLimit(request: NextRequest, config: RateLimitConfig): boolean {
  if (config.skipSuccessfulRequests || config.skipFailedRequests) {
    // This would require checking the response status
    // For now, we'll skip this optimization
    return false
  }

  return false
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') === false ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon.ico')
  ) {
    return NextResponse.next()
  }

  // Get client identifier
  const clientIP = getClientIP(request)
  const userAgent = request.headers.get('user-agent') || ''
  const identifier = `${clientIP}-${userAgent}`

  // Apply different rate limits based on route
  let rateLimitConfig = defaultRateLimit

  if (pathname.startsWith('/api/')) {
    rateLimitConfig = apiRateLimit

    // Stricter limits for sensitive endpoints
    if (pathname.startsWith('/api/swaps') || pathname.startsWith('/api/transactions')) {
      rateLimitConfig = {
        ...apiRateLimit,
        maxRequests: Math.floor(apiRateLimit.maxRequests / 2)
      }
    }
  }

  // Check rate limit
  if (!shouldSkipRateLimit(request, rateLimitConfig)) {
    const rateLimitResult = checkRateLimit(identifier, rateLimitConfig)

    if (!rateLimitResult.allowed) {
      const response = NextResponse.json(
        {
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': rateLimitConfig.maxRequests.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': Math.ceil(rateLimitResult.resetTime / 1000).toString()
          }
        }
      )
      return response
    }

    // Add rate limit headers to successful requests
    const response = NextResponse.next()
    response.headers.set('X-RateLimit-Limit', rateLimitConfig.maxRequests.toString())
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
    response.headers.set('X-RateLimit-Reset', Math.ceil(rateLimitResult.resetTime / 1000).toString())

    return response
  }

  // Security headers
  const response = NextResponse.next()

  // CORS headers
  response.headers.set('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGINS || '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key')

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  // Content Security Policy
  response.headers.set('Content-Security-Policy', `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' https://fonts.gstatic.com;
    img-src 'self' data: https: blob:;
    connect-src 'self' https://api.1inch.io https://apiv5.paraswap.io https://api.hop.exchange https://across.to wss:// wss://*.walletconnect.org;
    frame-src 'self' https://*.walletconnect.org;
  `.replace(/\s+/g, ' ').trim())

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 200 })
  }

  return response
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files with extensions
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.).*)',
  ],
}

