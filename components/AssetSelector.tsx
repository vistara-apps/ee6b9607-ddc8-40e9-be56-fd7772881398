'use client'

import { useState } from 'react'
import { Token } from '@/lib/types'
import { POPULAR_TOKENS } from '@/lib/constants'

interface AssetSelectorProps {
  selectedToken: Token | null
  chainId?: number
  onTokenSelect: (token: Token) => void
}

export function AssetSelector({ selectedToken, chainId, onTokenSelect }: AssetSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  const availableTokens = chainId ? POPULAR_TOKENS[chainId] || [] : []

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="input-field w-full flex items-center justify-between hover:border-primary transition-colors duration-200"
        type="button"
      >
        <div className="flex items-center space-x-3">
          {selectedToken ? (
            <>
              {selectedToken.logoURI && (
                <img
                  src={selectedToken.logoURI}
                  alt={selectedToken.symbol}
                  className="w-6 h-6 rounded-full"
                />
              )}
              <div className="text-left">
                <div className="font-medium text-text-primary">{selectedToken.symbol}</div>
                <div className="text-xs text-text-secondary">{selectedToken.name}</div>
              </div>
            </>
          ) : (
            <span className="text-text-secondary">Select token</span>
          )}
        </div>
        
        <svg
          className={`w-5 h-5 text-text-secondary transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-gray-600 rounded-lg shadow-modal z-20 max-h-60 overflow-y-auto">
            {availableTokens.length > 0 ? (
              <div className="p-2">
                {availableTokens.map((token) => (
                  <button
                    key={`${token.chainId}-${token.address}`}
                    onClick={() => {
                      onTokenSelect(token)
                      setIsOpen(false)
                    }}
                    className="w-full flex items-center space-x-3 p-3 hover:bg-bg rounded-lg transition-colors duration-200"
                    type="button"
                  >
                    {token.logoURI && (
                      <img
                        src={token.logoURI}
                        alt={token.symbol}
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    <div className="text-left flex-1">
                      <div className="font-medium text-text-primary">{token.symbol}</div>
                      <div className="text-sm text-text-secondary">{token.name}</div>
                    </div>
                    {selectedToken?.address === token.address && (
                      <div className="w-2 h-2 bg-accent rounded-full" />
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-text-secondary">
                No tokens available for this chain
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
