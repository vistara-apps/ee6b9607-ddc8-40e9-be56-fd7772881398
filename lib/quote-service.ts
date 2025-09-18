import { SwapQuote, Token, SwapFormData } from './types'
import { defaultAggregatorService } from './dex-aggregator'

interface CachedQuote {
  quote: SwapQuote
  timestamp: number
  requestHash: string
}

interface QuoteRequest {
  fromToken: Token
  toToken: Token
  amount: string
  fromChainId: number
  toChainId: number
  slippage?: number
}

export class QuoteService {
  private cache = new Map<string, CachedQuote>()
  private readonly CACHE_DURATION = 30000 // 30 seconds
  private readonly MAX_RETRIES = 3
  private readonly RETRY_DELAY = 1000 // 1 second

  async getQuote(formData: SwapFormData): Promise<SwapQuote> {
    if (!formData.fromToken || !formData.toToken || !formData.amount || !formData.fromChain || !formData.toChain) {
      throw new Error('Invalid swap parameters')
    }

    const request: QuoteRequest = {
      fromToken: formData.fromToken,
      toToken: formData.toToken,
      amount: this.convertToWei(formData.amount, formData.fromToken.decimals),
      fromChainId: formData.fromChain.id,
      toChainId: formData.toChain.id,
      slippage: formData.slippageTolerance
    }

    const requestHash = this.generateRequestHash(request)

    // Check cache first
    const cachedQuote = this.getCachedQuote(requestHash)
    if (cachedQuote) {
      return cachedQuote
    }

    // Fetch new quote with retry logic
    let lastError: Error | null = null
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const quote = await defaultAggregatorService.getBestQuote(request)
        this.cacheQuote(requestHash, quote)
        return quote
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error')
        console.warn(`Quote attempt ${attempt} failed:`, lastError.message)

        if (attempt < this.MAX_RETRIES) {
          await this.delay(this.RETRY_DELAY * attempt) // Exponential backoff
        }
      }
    }

    throw lastError || new Error('Failed to get quote after all retries')
  }

  private convertToWei(amount: string, decimals: number): string {
    const [integerPart, decimalPart] = amount.split('.')
    const decimalString = decimalPart || ''
    const paddedDecimal = decimalString.padEnd(decimals, '0').slice(0, decimals)
    return integerPart + paddedDecimal
  }

  private generateRequestHash(request: QuoteRequest): string {
    const key = `${request.fromToken.address}-${request.toToken.address}-${request.amount}-${request.fromChainId}-${request.toChainId}-${request.slippage}`
    return this.hashString(key)
  }

  private hashString(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString()
  }

  private getCachedQuote(requestHash: string): SwapQuote | null {
    const cached = this.cache.get(requestHash)
    if (!cached) return null

    if (Date.now() - cached.timestamp > this.CACHE_DURATION) {
      this.cache.delete(requestHash)
      return null
    }

    // Check if quote is still valid
    if (cached.quote.validUntil < Date.now()) {
      this.cache.delete(requestHash)
      return null
    }

    return cached.quote
  }

  private cacheQuote(requestHash: string, quote: SwapQuote): void {
    this.cache.set(requestHash, {
      quote,
      timestamp: Date.now(),
      requestHash
    })

    // Clean up old cache entries periodically
    if (this.cache.size > 100) {
      this.cleanupCache()
    }
  }

  private cleanupCache(): void {
    const now = Date.now()
    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > this.CACHE_DURATION ||
          cached.quote.validUntil < now) {
        this.cache.delete(key)
      }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Method to clear cache (useful for testing or manual refresh)
  clearCache(): void {
    this.cache.clear()
  }

  // Method to get cache stats
  getCacheStats(): { size: number; entries: Array<{ hash: string; age: number; valid: boolean }> } {
    const now = Date.now()
    const entries = Array.from(this.cache.entries()).map(([hash, cached]) => ({
      hash,
      age: now - cached.timestamp,
      valid: cached.quote.validUntil > now
    }))

    return {
      size: this.cache.size,
      entries
    }
  }
}

// Singleton instance
export const quoteService = new QuoteService()

