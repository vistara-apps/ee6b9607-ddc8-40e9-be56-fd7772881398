import { Address } from 'viem'
import { SwapFormData, Token, Chain } from './types'
import { SUPPORTED_CHAINS, POPULAR_TOKENS } from './constants'
import { ValidationError } from './error-handling'

export class ValidationService {
  // Address validation
  static isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address)
  }

  static isValidChecksumAddress(address: string): boolean {
    try {
      // This would use ethers.js or viem to validate checksum
      return this.isValidAddress(address)
    } catch {
      return false
    }
  }

  // Amount validation
  static isValidAmount(amount: string): boolean {
    if (!amount || amount.trim() === '') return false

    const num = parseFloat(amount)
    return !isNaN(num) && num > 0 && num <= Number.MAX_SAFE_INTEGER
  }

  static isValidSlippage(slippage: number): boolean {
    return slippage >= 0.1 && slippage <= 50 // 0.1% to 50%
  }

  // Token validation
  static isValidToken(token: Token | null): boolean {
    if (!token) return false

    return (
      this.isValidAddress(token.address) &&
      token.symbol.length > 0 &&
      token.symbol.length <= 10 &&
      token.name.length > 0 &&
      token.name.length <= 50 &&
      token.decimals >= 0 &&
      token.decimals <= 18 &&
      token.chainId > 0
    )
  }

  static isSupportedToken(token: Token, chainId: number): boolean {
    const chainTokens = POPULAR_TOKENS[chainId]
    if (!chainTokens) return false

    return chainTokens.some(t => t.address.toLowerCase() === token.address.toLowerCase())
  }

  // Chain validation
  static isValidChain(chain: Chain | null): boolean {
    if (!chain) return false

    return (
      chain.id > 0 &&
      chain.name.length > 0 &&
      chain.symbol.length > 0 &&
      chain.rpcUrl.length > 0 &&
      chain.blockExplorer.length > 0
    )
  }

  static isSupportedChain(chainId: number): boolean {
    return SUPPORTED_CHAINS.some(chain => chain.id === chainId)
  }

  // Swap validation
  static validateSwapData(data: SwapFormData): void {
    // Validate tokens
    if (!this.isValidToken(data.fromToken)) {
      throw new ValidationError('Invalid from token', 'fromToken')
    }

    if (!this.isValidToken(data.toToken)) {
      throw new ValidationError('Invalid to token', 'toToken')
    }

    // Validate chains
    if (!this.isValidChain(data.fromChain)) {
      throw new ValidationError('Invalid from chain', 'fromChain')
    }

    if (!this.isValidChain(data.toChain)) {
      throw new ValidationError('Invalid to chain', 'toChain')
    }

    // Validate amount
    if (!this.isValidAmount(data.amount)) {
      throw new ValidationError('Invalid amount. Must be a positive number.', 'amount')
    }

    // Validate slippage
    if (!this.isValidSlippage(data.slippageTolerance)) {
      throw new ValidationError('Invalid slippage tolerance. Must be between 0.1% and 50%.', 'slippageTolerance')
    }

    // Validate same-chain tokens
    if (data.fromChain.id === data.toChain.id) {
      if (!this.isSupportedToken(data.fromToken, data.fromChain.id)) {
        throw new ValidationError('From token is not supported on this chain', 'fromToken')
      }

      if (!this.isSupportedToken(data.toToken, data.toChain.id)) {
        throw new ValidationError('To token is not supported on this chain', 'toToken')
      }
    }

    // Validate different tokens
    if (data.fromToken.address.toLowerCase() === data.toToken.address.toLowerCase()) {
      throw new ValidationError('From and to tokens cannot be the same', 'toToken')
    }

    // Validate supported chains
    if (!this.isSupportedChain(data.fromChain.id)) {
      throw new ValidationError('From chain is not supported', 'fromChain')
    }

    if (!this.isSupportedChain(data.toChain.id)) {
      throw new ValidationError('To chain is not supported', 'toChain')
    }
  }

  // API request validation
  static validateApiRequest(body: any, requiredFields: string[]): void {
    for (const field of requiredFields) {
      if (!(field in body) || body[field] === null || body[field] === undefined) {
        throw new ValidationError(`Missing required field: ${field}`, field)
      }
    }
  }

  static validateQuoteRequest(body: any): void {
    this.validateApiRequest(body, ['fromToken', 'toToken', 'fromChain', 'toChain', 'amount'])

    // Additional validations
    if (!this.isValidToken(body.fromToken)) {
      throw new ValidationError('Invalid fromToken structure', 'fromToken')
    }

    if (!this.isValidToken(body.toToken)) {
      throw new ValidationError('Invalid toToken structure', 'toToken')
    }

    if (!this.isValidChain(body.fromChain)) {
      throw new ValidationError('Invalid fromChain structure', 'fromChain')
    }

    if (!this.isValidChain(body.toChain)) {
      throw new ValidationError('Invalid toChain structure', 'toChain')
    }

    if (!this.isValidAmount(body.amount)) {
      throw new ValidationError('Invalid amount', 'amount')
    }

    if (body.slippageTolerance && !this.isValidSlippage(body.slippageTolerance)) {
      throw new ValidationError('Invalid slippage tolerance', 'slippageTolerance')
    }
  }

  static validateSwapRequest(body: any): void {
    this.validateQuoteRequest(body)
    this.validateApiRequest(body, ['userAddress'])

    if (!this.isValidAddress(body.userAddress)) {
      throw new ValidationError('Invalid user address', 'userAddress')
    }

    if (body.gasToken && !this.isValidAddress(body.gasToken)) {
      throw new ValidationError('Invalid gas token address', 'gasToken')
    }
  }

  // Transaction validation
  static validateTransactionHash(txHash: string): boolean {
    return /^0x[a-fA-F0-9]{64}$/.test(txHash)
  }

  static validateTransactionData(data: {
    to: string
    data?: string
    value?: string
    gasLimit?: string
  }): void {
    if (!this.isValidAddress(data.to)) {
      throw new ValidationError('Invalid recipient address', 'to')
    }

    if (data.data && !/^0x[a-fA-F0-9]*$/.test(data.data)) {
      throw new ValidationError('Invalid transaction data', 'data')
    }

    if (data.value && !/^\d+$/.test(data.value)) {
      throw new ValidationError('Invalid transaction value', 'value')
    }

    if (data.gasLimit && (!/^\d+$/.test(data.gasLimit) || parseInt(data.gasLimit) <= 0)) {
      throw new ValidationError('Invalid gas limit', 'gasLimit')
    }
  }

  // User input sanitization
  static sanitizeAmount(amount: string): string {
    // Remove any non-numeric characters except decimal point
    return amount.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1')
  }

  static sanitizeAddress(address: string): string {
    // Ensure address starts with 0x and is lowercase
    return address.toLowerCase().startsWith('0x') ? address.toLowerCase() : `0x${address.toLowerCase()}`
  }

  static sanitizeSlippage(slippage: number): number {
    // Clamp slippage between 0.1% and 50%
    return Math.max(0.1, Math.min(50, slippage))
  }

  // Business logic validation
  static validateSwapSize(amount: string, token: Token): void {
    const numAmount = parseFloat(amount)

    // Minimum swap sizes (in token units)
    const minSwapSizes: Record<string, number> = {
      'ETH': 0.001,
      'USDC': 1,
      'USDT': 1,
      'DEGEN': 100
    }

    const minSize = minSwapSizes[token.symbol.toUpperCase()] || 0.01

    if (numAmount < minSize) {
      throw new ValidationError(
        `Minimum swap amount for ${token.symbol} is ${minSize}`,
        'amount'
      )
    }

    // Maximum swap sizes (prevent large trades that might cause issues)
    const maxSwapSizes: Record<string, number> = {
      'ETH': 100,
      'USDC': 100000,
      'USDT': 100000,
      'DEGEN': 10000000
    }

    const maxSize = maxSwapSizes[token.symbol.toUpperCase()] || 10000

    if (numAmount > maxSize) {
      throw new ValidationError(
        `Maximum swap amount for ${token.symbol} is ${maxSize}`,
        'amount'
      )
    }
  }

  static validateGasRelayEligibility(
    userAddress: string,
    gasAmount: string
  ): void {
    // Check if user is eligible for gas relay
    // This could be based on account age, transaction history, etc.
    // For now, we'll allow gas relay for all users
  }

  // Rate limiting validation
  static validateRateLimit(
    requests: number,
    limit: number,
    windowMs: number
  ): boolean {
    return requests < limit
  }

  // Input sanitization for API responses
  static sanitizeApiResponse(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeApiResponse(item))
    }

    const sanitized: any = {}

    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        // Remove any potential XSS content
        sanitized[key] = value.replace(/<[^>]*>/g, '')
      } else if (typeof value === 'object') {
        sanitized[key] = this.sanitizeApiResponse(value)
      } else {
        sanitized[key] = value
      }
    }

    return sanitized
  }
}

