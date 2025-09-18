import { Token, SwapQuote, RouteDetails } from './types'

interface DexAggregatorConfig {
  apiKey?: string
  baseUrl: string
  timeout: number
}

interface QuoteRequest {
  fromTokenAddress: string
  toTokenAddress: string
  amount: string
  fromChainId: number
  toChainId: number
  slippage?: number
}

interface DexQuoteResponse {
  fromToken: Token
  toToken: Token
  fromTokenAmount: string
  toTokenAmount: string
  estimatedGas: string
  protocols: Array<{
    name: string
    part: number
    fromTokenAddress: string
    toTokenAddress: string
  }>
  priceImpact?: number
}

export class DexAggregator {
  private config: DexAggregatorConfig

  constructor(config: DexAggregatorConfig) {
    this.config = config
  }

  async getQuote(request: QuoteRequest): Promise<SwapQuote> {
    try {
      const url = this.buildQuoteUrl(request)
      const response = await this.makeRequest(url)

      if (!response.ok) {
        throw new Error(`DEX API error: ${response.status} ${response.statusText}`)
      }

      const data: DexQuoteResponse = await response.json()
      return this.transformQuoteResponse(data, request)
    } catch (error) {
      console.error('DEX quote fetch error:', error)
      throw new Error(`Failed to fetch quote: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private buildQuoteUrl(request: QuoteRequest): string {
    const params = new URLSearchParams({
      fromTokenAddress: request.fromTokenAddress,
      toTokenAddress: request.toTokenAddress,
      amount: request.amount,
      fromChainId: request.fromChainId.toString(),
      toChainId: request.toChainId.toString(),
      slippage: (request.slippage || 0.5).toString(),
    })

    if (this.config.apiKey) {
      params.append('apiKey', this.config.apiKey)
    }

    return `${this.config.baseUrl}/quote?${params.toString()}`
  }

  private async makeRequest(url: string): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      })
      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout')
      }
      throw error
    }
  }

  private transformQuoteResponse(data: DexQuoteResponse, request: QuoteRequest): SwapQuote {
    // Calculate price impact (simplified)
    const priceImpact = data.priceImpact || 0

    // Extract exchange names from protocols
    const exchanges = data.protocols.map(p => p.name).filter((name, index, arr) =>
      arr.indexOf(name) === index // Remove duplicates
    )

    const routeDetails: RouteDetails = {
      path: data.protocols.map(p => p.fromTokenAddress).concat(data.toTokenAddress),
      exchanges,
      estimatedGas: data.estimatedGas,
      priceImpact,
      slippage: request.slippage || 0.5
    }

    return {
      fromToken: data.fromToken,
      toToken: data.toToken,
      fromAmount: data.fromTokenAmount,
      toAmount: data.toTokenAmount,
      priceImpact,
      gasEstimate: data.estimatedGas,
      route: routeDetails,
      validUntil: Date.now() + 30000 // 30 seconds validity
    }
  }
}

// Factory function to create DEX aggregator instances
export class DexAggregatorFactory {
  static create1inchAggregator(apiKey?: string): DexAggregator {
    return new DexAggregator({
      apiKey,
      baseUrl: 'https://api.1inch.io/v5.0',
      timeout: 10000
    })
  }

  static createUniswapAggregator(): DexAggregator {
    return new DexAggregator({
      baseUrl: 'https://api.uniswap.org/v1',
      timeout: 10000
    })
  }

  static createParaswapAggregator(apiKey?: string): DexAggregator {
    return new DexAggregator({
      apiKey,
      baseUrl: 'https://apiv5.paraswap.io',
      timeout: 10000
    })
  }
}

// Main aggregator service that tries multiple providers
export class AggregatorService {
  private aggregators: DexAggregator[]

  constructor(aggregators: DexAggregator[]) {
    this.aggregators = aggregators
  }

  async getBestQuote(request: QuoteRequest): Promise<SwapQuote> {
    const quotes: SwapQuote[] = []

    // Try each aggregator and collect successful quotes
    for (const aggregator of this.aggregators) {
      try {
        const quote = await aggregator.getQuote(request)
        quotes.push(quote)
      } catch (error) {
        console.warn(`Aggregator failed:`, error)
        // Continue to next aggregator
      }
    }

    if (quotes.length === 0) {
      throw new Error('All DEX aggregators failed to provide quotes')
    }

    // Return the best quote (highest output amount)
    return quotes.reduce((best, current) =>
      parseFloat(current.toAmount) > parseFloat(best.toAmount) ? current : best
    )
  }
}

// Default aggregator service instance
export const defaultAggregatorService = new AggregatorService([
  DexAggregatorFactory.create1inchAggregator(process.env.NEXT_PUBLIC_1INCH_API_KEY),
  DexAggregatorFactory.createParaswapAggregator(process.env.NEXT_PUBLIC_PARASWAP_API_KEY),
  DexAggregatorFactory.createUniswapAggregator()
])

