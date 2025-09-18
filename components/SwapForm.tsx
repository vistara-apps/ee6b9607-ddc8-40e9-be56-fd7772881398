'use client'

import { useState, useCallback, useEffect } from 'react'
import { SwapFormData, Token, Chain, SwapQuote } from '@/lib/types'
import { SUPPORTED_CHAINS, POPULAR_TOKENS, DEFAULT_SLIPPAGE } from '@/lib/constants'
import { formatNumber, debounce } from '@/lib/utils'
import { AssetSelector } from './AssetSelector'
import { ChainSelector } from './ChainSelector'
import { TransactionStatusIndicator } from './TransactionStatusIndicator'
import { Button } from './Button'

export function SwapForm() {
  const [formData, setFormData] = useState<SwapFormData>({
    fromToken: POPULAR_TOKENS[8453]?.[0] || null, // Default to ETH on Base
    toToken: POPULAR_TOKENS[8453]?.[1] || null,   // Default to USDC on Base
    fromChain: SUPPORTED_CHAINS[0] || null,       // Default to Base
    toChain: SUPPORTED_CHAINS[0] || null,         // Default to Base
    amount: '',
    slippageTolerance: DEFAULT_SLIPPAGE,
    gasRelayEnabled: false
  })

  const [quote, setQuote] = useState<SwapQuote | null>(null)
  const [isLoadingQuote, setIsLoadingQuote] = useState(false)
  const [isSwapping, setIsSwapping] = useState(false)
  const [swapStatus, setSwapStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  // Debounced quote fetching
  const fetchQuote = useCallback(
    debounce(async (data: SwapFormData) => {
      if (!data.fromToken || !data.toToken || !data.amount || parseFloat(data.amount) <= 0) {
        setQuote(null)
        return
      }

      setIsLoadingQuote(true)
      setError(null)

      try {
        // Simulate API call for quote
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const mockQuote: SwapQuote = {
          fromToken: data.fromToken,
          toToken: data.toToken,
          fromAmount: data.amount,
          toAmount: (parseFloat(data.amount) * 0.998).toString(), // Mock 0.2% slippage
          priceImpact: 0.15,
          gasEstimate: '0.002',
          route: {
            path: [data.fromToken.address, data.toToken.address],
            exchanges: ['Uniswap V3', 'SushiSwap'],
            estimatedGas: '150000',
            priceImpact: 0.15,
            slippage: 0.2
          },
          validUntil: Date.now() + 30000 // 30 seconds
        }
        
        setQuote(mockQuote)
      } catch (err) {
        setError('Failed to fetch quote. Please try again.')
        console.error('Quote fetch error:', err)
      } finally {
        setIsLoadingQuote(false)
      }
    }, 500),
    []
  )

  // Fetch quote when relevant form data changes
  useEffect(() => {
    fetchQuote(formData)
  }, [formData.fromToken, formData.toToken, formData.amount, formData.fromChain, formData.toChain, fetchQuote])

  const handleSwap = async () => {
    if (!quote) return

    setIsSwapping(true)
    setSwapStatus('pending')
    setError(null)

    try {
      // Simulate swap transaction
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Random success/failure for demo
      if (Math.random() > 0.2) {
        setSwapStatus('success')
      } else {
        throw new Error('Transaction failed')
      }
    } catch (err) {
      setSwapStatus('error')
      setError(err instanceof Error ? err.message : 'Swap failed')
    } finally {
      setIsSwapping(false)
      
      // Reset status after 5 seconds
      setTimeout(() => {
        setSwapStatus('idle')
        setError(null)
      }, 5000)
    }
  }

  const handleTokenSwap = () => {
    setFormData(prev => ({
      ...prev,
      fromToken: prev.toToken,
      toToken: prev.fromToken,
      fromChain: prev.toChain,
      toChain: prev.fromChain
    }))
  }

  const isFormValid = formData.fromToken && 
                     formData.toToken && 
                     formData.amount && 
                     parseFloat(formData.amount) > 0 &&
                     quote

  return (
    <div className="card max-w-md mx-auto">
      <div className="space-y-6">
        {/* From Section */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-text-secondary">
            From
          </label>
          
          <div className="space-y-3">
            <ChainSelector
              selectedChain={formData.fromChain}
              onChainSelect={(chain) => {
                setFormData(prev => ({
                  ...prev,
                  fromChain: chain,
                  fromToken: POPULAR_TOKENS[chain.id]?.[0] || null
                }))
              }}
            />
            
            <div className="flex space-x-3">
              <div className="flex-1">
                <AssetSelector
                  selectedToken={formData.fromToken}
                  chainId={formData.fromChain?.id}
                  onTokenSelect={(token) => {
                    setFormData(prev => ({ ...prev, fromToken: token }))
                  }}
                />
              </div>
              
              <div className="flex-1">
                <input
                  type="number"
                  placeholder="0.0"
                  value={formData.amount}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, amount: e.target.value }))
                  }}
                  className="input-field w-full text-right"
                  step="any"
                  min="0"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <button
            onClick={handleTokenSwap}
            className="w-10 h-10 bg-surface hover:bg-gray-700 rounded-full flex items-center justify-center transition-colors duration-200 border border-gray-600"
            type="button"
          >
            <svg className="w-5 h-5 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </button>
        </div>

        {/* To Section */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-text-secondary">
            To
          </label>
          
          <div className="space-y-3">
            <ChainSelector
              selectedChain={formData.toChain}
              onChainSelect={(chain) => {
                setFormData(prev => ({
                  ...prev,
                  toChain: chain,
                  toToken: POPULAR_TOKENS[chain.id]?.[0] || null
                }))
              }}
            />
            
            <div className="flex space-x-3">
              <div className="flex-1">
                <AssetSelector
                  selectedToken={formData.toToken}
                  chainId={formData.toChain?.id}
                  onTokenSelect={(token) => {
                    setFormData(prev => ({ ...prev, toToken: token }))
                  }}
                />
              </div>
              
              <div className="flex-1">
                <div className="input-field bg-gray-800 text-right">
                  {isLoadingQuote ? (
                    <div className="animate-pulse">Loading...</div>
                  ) : quote ? (
                    formatNumber(quote.toAmount, 6)
                  ) : (
                    '0.0'
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quote Details */}
        {quote && (
          <div className="bg-bg rounded-lg p-4 space-y-2 border border-gray-700">
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Price Impact</span>
              <span className={`${quote.priceImpact > 1 ? 'text-red-400' : 'text-accent'}`}>
                {formatNumber(quote.priceImpact, 2)}%
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Estimated Gas</span>
              <span className="text-text-primary">{quote.gasEstimate} ETH</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Route</span>
              <span className="text-text-primary text-right">
                {quote.route.exchanges.join(' → ')}
              </span>
            </div>
          </div>
        )}

        {/* Gas Relay Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-text-primary">Gas Relay</label>
            <p className="text-xs text-text-secondary">Pay gas fees in any token</p>
          </div>
          <button
            onClick={() => {
              setFormData(prev => ({ ...prev, gasRelayEnabled: !prev.gasRelayEnabled }))
            }}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
              formData.gasRelayEnabled ? 'bg-accent' : 'bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                formData.gasRelayEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Transaction Status */}
        {swapStatus !== 'idle' && (
          <TransactionStatusIndicator status={swapStatus} />
        )}

        {/* Swap Button */}
        <Button
          onClick={handleSwap}
          disabled={!isFormValid || isSwapping}
          variant="primary"
          className="w-full"
        >
          {isSwapping ? 'Swapping...' : 'Swap Now'}
        </Button>
      </div>
    </div>
  )
}
