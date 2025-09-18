import { Chain, Token } from './types'

export const SUPPORTED_CHAINS: Chain[] = [
  {
    id: 8453,
    name: 'Base',
    symbol: 'ETH',
    logoURI: 'https://raw.githubusercontent.com/base-org/brand-kit/main/logo/in-product/Base_Network_Logo.svg',
    rpcUrl: 'https://mainnet.base.org',
    blockExplorer: 'https://basescan.org'
  },
  {
    id: 1,
    name: 'Ethereum',
    symbol: 'ETH',
    logoURI: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
    rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/demo',
    blockExplorer: 'https://etherscan.io'
  },
  {
    id: 137,
    name: 'Polygon',
    symbol: 'MATIC',
    logoURI: 'https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png',
    rpcUrl: 'https://polygon-rpc.com',
    blockExplorer: 'https://polygonscan.com'
  },
  {
    id: 42161,
    name: 'Arbitrum',
    symbol: 'ETH',
    logoURI: 'https://assets.coingecko.com/coins/images/16547/small/photo_2023-03-29_21.47.00.jpeg',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    blockExplorer: 'https://arbiscan.io'
  }
]

export const POPULAR_TOKENS: Record<number, Token[]> = {
  8453: [ // Base
    {
      address: '0x0000000000000000000000000000000000000000',
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
      logoURI: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
      chainId: 8453
    },
    {
      address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      logoURI: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png',
      chainId: 8453
    },
    {
      address: '0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed',
      symbol: 'DEGEN',
      name: 'Degen',
      decimals: 18,
      logoURI: 'https://assets.coingecko.com/coins/images/34515/small/android-chrome-512x512.png',
      chainId: 8453
    }
  ],
  1: [ // Ethereum
    {
      address: '0x0000000000000000000000000000000000000000',
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
      logoURI: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
      chainId: 1
    },
    {
      address: '0xA0b86a33E6441b8435b662303c0f098C8c5c0f8e',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      logoURI: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png',
      chainId: 1
    },
    {
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
      logoURI: 'https://assets.coingecko.com/coins/images/325/small/Tether-logo.png',
      chainId: 1
    }
  ],
  137: [ // Polygon
    {
      address: '0x0000000000000000000000000000000000000000',
      symbol: 'MATIC',
      name: 'Polygon',
      decimals: 18,
      logoURI: 'https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png',
      chainId: 137
    },
    {
      address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      logoURI: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png',
      chainId: 137
    }
  ],
  42161: [ // Arbitrum
    {
      address: '0x0000000000000000000000000000000000000000',
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
      logoURI: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
      chainId: 42161
    },
    {
      address: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      logoURI: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png',
      chainId: 42161
    }
  ]
}

export const DEFAULT_SLIPPAGE = 0.5 // 0.5%
export const MAX_SLIPPAGE = 5.0 // 5%
export const SWAP_FEE_PERCENTAGE = 0.1 // 0.1%
export const MINIMUM_SWAP_FEE = 0.5 // $0.50

export const FEATURE_CARDS = [
  {
    icon: '🔄',
    title: 'Optimal Liquidity',
    description: 'Aggregates liquidity from multiple DEXs to find the best rates'
  },
  {
    icon: '⛓️',
    title: 'Cross-Chain',
    description: 'Seamless swaps across EVM-compatible chains'
  },
  {
    icon: '🎯',
    title: 'Smart Routing',
    description: 'AI-powered routing for maximum efficiency'
  },
  {
    icon: '⚡',
    title: 'Gas Abstraction',
    description: 'Pay gas fees in any token with smart accounts'
  }
]
