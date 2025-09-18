export interface SwapTransaction {
  transactionId: string
  userId: string
  fromToken: string
  toToken: string
  fromChain: string
  toChain: string
  amountIn: string
  amountOut: string
  routeDetails: RouteDetails
  status: TransactionStatus
  timestamp: number
  feesPaid: string
}

export interface User {
  userId: string
  walletAddress: string
  apiKey?: string
  apiTier: 'basic' | 'premium'
  creationDate: number
}

export interface GasRelayConfig {
  userId: string
  enabled: boolean
  relayAddress: string
  gasToken: string
}

export interface RouteDetails {
  path: string[]
  exchanges: string[]
  estimatedGas: string
  priceImpact: number
  slippage: number
}

export type TransactionStatus = 'pending' | 'success' | 'error' | 'cancelled'

export interface Token {
  address: string
  symbol: string
  name: string
  decimals: number
  logoURI?: string
  chainId: number
}

export interface Chain {
  id: number
  name: string
  symbol: string
  logoURI?: string
  rpcUrl: string
  blockExplorer: string
}

export interface SwapQuote {
  fromToken: Token
  toToken: Token
  fromAmount: string
  toAmount: string
  priceImpact: number
  gasEstimate: string
  route: RouteDetails
  validUntil: number
}

export interface SwapFormData {
  fromToken: Token | null
  toToken: Token | null
  fromChain: Chain | null
  toChain: Chain | null
  amount: string
  slippageTolerance: number
  gasRelayEnabled: boolean
}
