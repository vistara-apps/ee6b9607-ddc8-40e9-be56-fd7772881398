import { NextResponse } from 'next/server'

export interface AppError {
  code: string
  message: string
  statusCode: number
  details?: Record<string, any>
  timestamp: number
}

export class ErrorHandler {
  static createError(
    code: string,
    message: string,
    statusCode: number = 500,
    details?: Record<string, any>
  ): AppError {
    return {
      code,
      message,
      statusCode,
      details,
      timestamp: Date.now()
    }
  }

  static handleApiError(error: unknown, context?: string): NextResponse {
    console.error(`API Error${context ? ` in ${context}` : ''}:`, error)

    if (error instanceof AppError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
            timestamp: error.timestamp
          }
        },
        { status: error.statusCode }
      )
    }

    if (error instanceof Error) {
      // Handle known error types
      if (error.message.includes('timeout')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'TIMEOUT_ERROR',
              message: 'Request timed out. Please try again.',
              timestamp: Date.now()
            }
          },
          { status: 408 }
        )
      }

      if (error.message.includes('network') || error.message.includes('fetch')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'NETWORK_ERROR',
              message: 'Network error. Please check your connection and try again.',
              timestamp: Date.now()
            }
          },
          { status: 503 }
        )
      }

      if (error.message.includes('insufficient funds')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INSUFFICIENT_FUNDS',
              message: 'Insufficient funds for this transaction.',
              timestamp: Date.now()
            }
          },
          { status: 400 }
        )
      }

      if (error.message.includes('slippage')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'SLIPPAGE_ERROR',
              message: 'Transaction failed due to slippage. Please try again with a higher slippage tolerance.',
              timestamp: Date.now()
            }
          },
          { status: 400 }
        )
      }

      // Generic error
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message,
            timestamp: Date.now()
          }
        },
        { status: 500 }
      )
    }

    // Unknown error
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'An unexpected error occurred. Please try again.',
          timestamp: Date.now()
        }
      },
      { status: 500 }
    )
  }

  static logError(error: unknown, context: string, additionalData?: Record<string, any>): void {
    const errorData = {
      context,
      timestamp: Date.now(),
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error,
      additionalData
    }

    console.error('Logged Error:', JSON.stringify(errorData, null, 2))

    // In production, you might want to send this to a logging service
    // like Sentry, LogRocket, or DataDog
  }

  static isRetryableError(error: unknown): boolean {
    if (!(error instanceof Error)) return false

    const retryablePatterns = [
      'timeout',
      'network',
      'connection',
      'rate limit',
      'temporary',
      'unavailable'
    ]

    const errorMessage = error.message.toLowerCase()
    return retryablePatterns.some(pattern => errorMessage.includes(pattern))
  }

  static getRetryDelay(attempt: number, baseDelay: number = 1000): number {
    // Exponential backoff with jitter
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1)
    const jitter = Math.random() * 0.1 * exponentialDelay
    return Math.min(exponentialDelay + jitter, 30000) // Max 30 seconds
  }
}

// Specific error types
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication required') {
    super(message)
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = 'Insufficient permissions') {
    super(message)
    this.name = 'AuthorizationError'
  }
}

export class RateLimitError extends Error {
  constructor(message: string, public resetIn?: number) {
    super(message)
    this.name = 'RateLimitError'
  }
}

export class BlockchainError extends Error {
  constructor(message: string, public txHash?: string, public chainId?: number) {
    super(message)
    this.name = 'BlockchainError'
  }
}

export class DexError extends Error {
  constructor(message: string, public dexName?: string, public pair?: string) {
    super(message)
    this.name = 'DexError'
  }
}

// Error boundary for React components
export class ErrorBoundary extends Error {
  constructor(message: string, public componentStack?: string) {
    super(message)
    this.name = 'ErrorBoundary'
  }
}

// Utility functions
export const withErrorHandling = (
  handler: (request: Request, ...args: any[]) => Promise<Response>
) => {
  return async (request: Request, ...args: any[]): Promise<Response> => {
    try {
      return await handler(request, ...args)
    } catch (error) {
      ErrorHandler.logError(error, 'API Handler', { url: request.url, method: request.method })
      return ErrorHandler.handleApiError(error, 'API Handler')
    }
  }
}

export const createApiResponse = (
  success: boolean,
  data?: any,
  error?: string,
  statusCode: number = 200
): NextResponse => {
  const response = {
    success,
    ...(data && { data }),
    ...(error && { error }),
    timestamp: Date.now()
  }

  return NextResponse.json(response, { status: statusCode })
}

