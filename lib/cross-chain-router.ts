import { SwapQuote, SwapFormData } from './types'
import { quoteService } from './quote-service'
import { defaultCrossChainRouter } from './bridge-service'

export class SmartRouter {
  async getOptimalQuote(formData: SwapFormData): Promise<SwapQuote> {
    if (!formData.fromToken || !formData.toToken || !formData.fromChain || !formData.toChain) {
      throw new Error('Invalid swap parameters')
    }

    const isCrossChain = formData.fromChain.id !== formData.toChain.id

    if (isCrossChain) {
      // For cross-chain swaps, use the cross-chain router
      try {
        const bridgeQuote = await defaultCrossChainRouter.getCrossChainQuote({
          fromToken: formData.fromToken,
          toToken: formData.toToken,
          amount: formData.amount,
          fromChain: formData.fromChain,
          toChain: formData.toChain,
          slippage: formData.slippageTolerance
        })
        return bridgeQuote
      } catch (error) {
        console.warn('Cross-chain routing failed, falling back to same-chain DEX:', error)
        // Fall back to same-chain DEX routing
      }
    }

    // For same-chain swaps or fallback, use DEX aggregator
    return await quoteService.getQuote(formData)
  }

  async getMultipleQuotes(formData: SwapFormData): Promise<{
    sameChain?: SwapQuote
    crossChain?: SwapQuote
    recommended: SwapQuote
  }> {
    if (!formData.fromToken || !formData.toToken || !formData.fromChain || !formData.toChain) {
      throw new Error('Invalid swap parameters')
    }

    const results: {
      sameChain?: SwapQuote
      crossChain?: SwapQuote
      recommended: SwapQuote
    } = {
      recommended: null as any
    }

    const isCrossChain = formData.fromChain.id !== formData.toChain.id

    // Always try same-chain DEX quote
    try {
      results.sameChain = await quoteService.getQuote(formData)
      results.recommended = results.sameChain
    } catch (error) {
      console.warn('Same-chain DEX quote failed:', error)
    }

    // If cross-chain, also try bridge quotes
    if (isCrossChain) {
      try {
        results.crossChain = await defaultCrossChainRouter.getCrossChainQuote({
          fromToken: formData.fromToken,
          toToken: formData.toToken,
          amount: formData.amount,
          fromChain: formData.fromChain,
          toChain: formData.toChain,
          slippage: formData.slippageTolerance
        })

        // Compare and recommend the better option
        if (results.sameChain && results.crossChain) {
          const sameChainNetAmount = parseFloat(results.sameChain.toAmount) - parseFloat(results.sameChain.gasEstimate)
          const crossChainNetAmount = parseFloat(results.crossChain.toAmount) - parseFloat(results.crossChain.gasEstimate)

          results.recommended = crossChainNetAmount > sameChainNetAmount ? results.crossChain : results.sameChain
        } else if (results.crossChain) {
          results.recommended = results.crossChain
        }
      } catch (error) {
        console.warn('Cross-chain quote failed:', error)
      }
    }

    if (!results.recommended) {
      throw new Error('Unable to get any quotes')
    }

    return results
  }

  calculatePriceImpact(fromAmount: string, toAmount: string, expectedRate: number): number {
    const actualRate = parseFloat(toAmount) / parseFloat(fromAmount)
    return Math.abs((actualRate - expectedRate) / expectedRate) * 100
  }

  estimateTimeToCompletion(quote: SwapQuote): {
    estimatedTime: number // in minutes
    confidence: 'high' | 'medium' | 'low'
  } {
    // Simple estimation based on route complexity
    const exchangeCount = quote.route.exchanges.length
    const isCrossChain = quote.route.exchanges.some(ex => ex.toLowerCase().includes('bridge'))

    let baseTime = 2 // Base DEX swap time in minutes

    if (isCrossChain) {
      baseTime += 10 // Additional time for cross-chain bridging
    }

    if (exchangeCount > 1) {
      baseTime += (exchangeCount - 1) * 1 // Additional time per exchange
    }

    let confidence: 'high' | 'medium' | 'low' = 'high'
    if (isCrossChain) {
      confidence = 'medium'
    }
    if (exchangeCount > 2) {
      confidence = 'low'
    }

    return {
      estimatedTime: baseTime,
      confidence
    }
  }
}

// Singleton instance
export const smartRouter = new SmartRouter()

