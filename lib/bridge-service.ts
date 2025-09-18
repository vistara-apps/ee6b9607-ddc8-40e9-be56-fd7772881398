import { Token, Chain, SwapQuote, RouteDetails } from './types'

interface BridgeConfig {
  apiKey?: string
  baseUrl: string
  timeout: number
}

interface BridgeQuoteRequest {
  fromToken: Token
  toToken: Token
  amount: string
  fromChain: Chain
  toChain: Chain
  slippage?: number
}

interface BridgeQuoteResponse {
  fromToken: Token
  toToken: Token
  fromAmount: string
  toAmount: string
  bridgeFee: string
  estimatedGas: string
  bridgeName: string
  estimatedTime: number // in minutes
  priceImpact?: number
}

export class BridgeService {
  private config: BridgeConfig

  constructor(config: BridgeConfig) {
    this.config = config
  }

  async getBridgeQuote(request: BridgeQuoteRequest): Promise<SwapQuote> {
    try {
      const url = this.buildBridgeQuoteUrl(request)
      const response = await this.makeRequest(url)

      if (!response.ok) {
        throw new Error(`Bridge API error: ${response.status} ${response.statusText}`)
      }

      const data: BridgeQuoteResponse = await response.json()
      return this.transformBridgeQuote(data, request)
    } catch (error) {
      console.error('Bridge quote fetch error:', error)
      throw new Error(`Failed to fetch bridge quote: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private buildBridgeQuoteUrl(request: BridgeQuoteRequest): string {
    const params = new URLSearchParams({
      fromToken: request.fromToken.address,
      toToken: request.toToken.address,
      amount: request.amount,
      fromChain: request.fromChain.id.toString(),
      toChain: request.toChain.id.toString(),
      slippage: (request.slippage || 0.5).toString(),
    })

    if (this.config.apiKey) {
      params.append('apiKey', this.config.apiKey)
    }

    return `${this.config.baseUrl}/bridge/quote?${params.toString()}`
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
        throw new Error('Bridge request timeout')
      }
      throw error
    }
  }

  private transformBridgeQuote(data: BridgeQuoteResponse, request: BridgeQuoteRequest): SwapQuote {
    const priceImpact = data.priceImpact || 0

    const routeDetails: RouteDetails = {
      path: [request.fromToken.address, request.toToken.address],
      exchanges: [data.bridgeName],
      estimatedGas: data.estimatedGas,
      priceImpact,
      slippage: request.slippage || 0.5
    }

    return {
      fromToken: data.fromToken,
      toToken: data.toToken,
      fromAmount: data.fromAmount,
      toAmount: data.toAmount,
      priceImpact,
      gasEstimate: data.estimatedGas,
      route: routeDetails,
      validUntil: Date.now() + 30000 // 30 seconds validity
    }
  }
}

// Bridge service factory
export class BridgeServiceFactory {
  static createAcrossBridge(apiKey?: string): BridgeService {
    return new BridgeService({
      apiKey,
      baseUrl: 'https://across.to/api',
      timeout: 15000
    })
  }

  static createHopBridge(): BridgeService {
    return new BridgeService({
      baseUrl: 'https://api.hop.exchange/v1',
      timeout: 15000
    })
  }

  static createCelerBridge(apiKey?: string): BridgeService {
    return new BridgeService({
      apiKey,
      baseUrl: 'https://cbridge-prod2.celer.network/v2',
      timeout: 15000
    })
  }
}

// Cross-chain router that combines DEX and bridge services
export class CrossChainRouter {
  private bridgeServices: BridgeService[]

  constructor(bridgeServices: BridgeService[]) {
    this.bridgeServices = bridgeServices
  }

  async getCrossChainQuote(request: BridgeQuoteRequest): Promise<SwapQuote> {
    const quotes: SwapQuote[] = []

    // Try each bridge service
    for (const bridgeService of this.bridgeServices) {
      try {
        const quote = await bridgeService.getBridgeQuote(request)
        quotes.push(quote)
      } catch (error) {
        console.warn(`Bridge service failed:`, error)
        // Continue to next bridge service
      }
    }

    if (quotes.length === 0) {
      throw new Error('All bridge services failed to provide quotes')
    }

    // Return the best quote (highest output amount, considering fees)
    return quotes.reduce((best, current) => {
      const bestNetAmount = parseFloat(best.toAmount) - parseFloat(best.gasEstimate)
      const currentNetAmount = parseFloat(current.toAmount) - parseFloat(current.gasEstimate)
      return currentNetAmount > bestNetAmount ? current : best
    })
  }

  isCrossChainSwap(fromChainId: number, toChainId: number): boolean {
    return fromChainId !== toChainId
  }
}

// Default cross-chain router instance
export const defaultCrossChainRouter = new CrossChainRouter([
  BridgeServiceFactory.createAcrossBridge(process.env.NEXT_PUBLIC_ACROSS_API_KEY),
  BridgeServiceFactory.createHopBridge(),
  BridgeServiceFactory.createCelerBridge(process.env.NEXT_PUBLIC_CELER_API_KEY)
])

