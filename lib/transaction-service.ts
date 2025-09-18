import { Address, Hash, encodeFunctionData, parseEther, formatEther } from 'viem'
import { base, mainnet, polygon, arbitrum } from 'wagmi/chains'
import { SwapQuote, SwapTransaction, TransactionStatus } from './types'
import { smartAccountService } from './smart-account'
import { gasRelayManager } from './gas-relay'

interface TransactionConfig {
  chainId: number
  rpcUrl: string
  swapRouterAddress: Address
  wethAddress?: Address
}

interface SwapExecutionParams {
  quote: SwapQuote
  userAddress: Address
  slippageTolerance: number
  deadline?: number
  gasRelayEnabled?: boolean
  gasToken?: Address
}

interface TransactionResult {
  hash: Hash
  status: TransactionStatus
  gasUsed?: string
  effectiveGasPrice?: string
  blockNumber?: number
  timestamp: number
}

export class TransactionService {
  private config: TransactionConfig

  constructor(config: TransactionConfig) {
    this.config = config
  }

  async executeSwap(params: SwapExecutionParams): Promise<{
    transaction: SwapTransaction
    result: TransactionResult
  }> {
    try {
      const { quote, userAddress, slippageTolerance, gasRelayEnabled, gasToken } = params

      // Validate quote is still valid
      if (Date.now() > quote.validUntil) {
        throw new Error('Quote has expired')
      }

      // Prepare transaction data
      const txData = await this.prepareSwapTransaction(quote, slippageTolerance)

      // Handle gas relay if enabled
      let gasEstimate
      if (gasRelayEnabled) {
        gasEstimate = await this.handleGasRelay(txData, userAddress, gasToken)
      } else {
        gasEstimate = await this.estimateGas(txData, userAddress)
      }

      // Execute transaction
      const result = await this.submitTransaction(txData, gasEstimate, userAddress)

      // Create transaction record
      const transaction: SwapTransaction = {
        transactionId: result.hash,
        userId: userAddress,
        fromToken: quote.fromToken.address,
        toToken: quote.toToken.address,
        fromChain: quote.fromToken.chainId.toString(),
        toChain: quote.toToken.chainId.toString(),
        amountIn: quote.fromAmount,
        amountOut: quote.toAmount,
        routeDetails: quote.route,
        status: result.status,
        timestamp: result.timestamp,
        feesPaid: gasEstimate.estimatedCost
      }

      return { transaction, result }
    } catch (error) {
      console.error('Swap execution failed:', error)
      throw new Error(`Swap execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async prepareSwapTransaction(quote: SwapQuote, slippageTolerance: number): Promise<{
    to: Address
    data: Hash
    value: string
  }> {
    // Prepare the swap transaction data
    // This would encode the appropriate DEX router call
    const minAmountOut = this.calculateMinAmountOut(quote.toAmount, slippageTolerance)

    // Mock transaction data - in production, this would encode actual DEX calls
    const txData = {
      to: this.config.swapRouterAddress,
      data: encodeFunctionData({
        abi: [], // DEX router ABI would go here
        functionName: 'swap',
        args: [
          quote.fromToken.address,
          quote.toToken.address,
          quote.fromAmount,
          minAmountOut,
          quote.route.path
        ]
      }),
      value: quote.fromToken.address === '0x0000000000000000000000000000000000000000' ? quote.fromAmount : '0'
    }

    return txData
  }

  private calculateMinAmountOut(amountOut: string, slippageTolerance: number): string {
    const slippageAmount = (parseFloat(amountOut) * slippageTolerance) / 100
    return (parseFloat(amountOut) - slippageAmount).toString()
  }

  private async handleGasRelay(
    txData: any,
    userAddress: Address,
    gasToken?: Address
  ): Promise<{
    estimatedCost: string
    gasLimit: bigint
    maxFeePerGas?: string
    maxPriorityFeePerGas?: string
    paymasterData?: string
  }> {
    try {
      // Estimate gas for the transaction
      const gasLimit = await this.estimateGasLimit(txData)

      // Check if gas relay is available
      const relayOptions = await gasRelayManager.getSponsoredGasOptions(
        gasLimit,
        userAddress,
        { enabled: true, gasToken }
      )

      if (relayOptions.canSponsor && relayOptions.paymasterData) {
        return {
          estimatedCost: '0', // Sponsored
          gasLimit,
          paymasterData: relayOptions.paymasterData
        }
      }

      // Fall back to user-paid gas
      const gasEstimate = await gasRelayManager.estimateGasCost(gasLimit)
      return {
        estimatedCost: gasEstimate.estimatedCost,
        gasLimit,
        maxFeePerGas: gasEstimate.maxFeePerGas,
        maxPriorityFeePerGas: gasEstimate.maxPriorityFeePerGas
      }
    } catch (error) {
      console.warn('Gas relay setup failed:', error)
      // Fall back to regular gas estimation
      const gasEstimate = await gasRelayManager.estimateGasCost(200000n)
      return {
        estimatedCost: gasEstimate.estimatedCost,
        gasLimit: 200000n,
        maxFeePerGas: gasEstimate.maxFeePerGas,
        maxPriorityFeePerGas: gasEstimate.maxPriorityFeePerGas
      }
    }
  }

  private async estimateGas(txData: any, userAddress: Address): Promise<{
    estimatedCost: string
    gasLimit: bigint
    maxFeePerGas: string
    maxPriorityFeePerGas: string
  }> {
    try {
      const gasLimit = await this.estimateGasLimit(txData)
      const gasEstimate = await gasRelayManager.estimateGasCost(gasLimit)

      return {
        estimatedCost: gasEstimate.estimatedCost,
        gasLimit,
        maxFeePerGas: gasEstimate.maxFeePerGas,
        maxPriorityFeePerGas: gasEstimate.maxPriorityFeePerGas
      }
    } catch (error) {
      console.warn('Gas estimation failed:', error)
      // Return fallback values
      return {
        estimatedCost: '0.001',
        gasLimit: 200000n,
        maxFeePerGas: '50000000000',
        maxPriorityFeePerGas: '2000000000'
      }
    }
  }

  private async estimateGasLimit(txData: any): Promise<bigint> {
    try {
      // This would call the RPC to estimate gas
      // For now, return a reasonable estimate
      return 150000n
    } catch (error) {
      console.warn('Gas limit estimation failed:', error)
      return 200000n // Fallback
    }
  }

  private async submitTransaction(
    txData: any,
    gasEstimate: any,
    userAddress: Address
  ): Promise<TransactionResult> {
    try {
      // This would submit the transaction to the blockchain
      // For now, simulate a successful transaction
      const mockHash = `0x${Math.random().toString(16).substring(2, 66)}` as Hash

      return {
        hash: mockHash,
        status: 'success',
        gasUsed: gasEstimate.gasLimit.toString(),
        effectiveGasPrice: gasEstimate.maxFeePerGas || '50000000000',
        blockNumber: Math.floor(Math.random() * 1000000),
        timestamp: Date.now()
      }
    } catch (error) {
      console.error('Transaction submission failed:', error)
      return {
        hash: '' as Hash,
        status: 'error',
        timestamp: Date.now()
      }
    }
  }

  async getTransactionStatus(txHash: Hash): Promise<{
    status: TransactionStatus
    confirmations?: number
    gasUsed?: string
    effectiveGasPrice?: string
  }> {
    try {
      // This would query the blockchain for transaction status
      // For now, return mock data
      return {
        status: 'success',
        confirmations: Math.floor(Math.random() * 10) + 1,
        gasUsed: '150000',
        effectiveGasPrice: '50000000000'
      }
    } catch (error) {
      console.error('Transaction status check failed:', error)
      return {
        status: 'error'
      }
    }
  }

  async waitForConfirmation(txHash: Hash, confirmations: number = 1): Promise<{
    status: TransactionStatus
    receipt?: any
  }> {
    try {
      // Wait for transaction confirmations
      // This would poll the blockchain until confirmations are met
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate wait

      return {
        status: 'success',
        receipt: {
          transactionHash: txHash,
          blockNumber: Math.floor(Math.random() * 1000000),
          gasUsed: '150000',
          status: 'success'
        }
      }
    } catch (error) {
      console.error('Transaction confirmation failed:', error)
      return {
        status: 'error'
      }
    }
  }

  // Utility methods
  getChainConfig(chainId: number): TransactionConfig {
    const configs: Record<number, Partial<TransactionConfig>> = {
      8453: { // Base
        swapRouterAddress: '0x2626664c2603336E57B271c5C0b26F421741e4815' as Address, // Uniswap V3 Router on Base
        wethAddress: '0x4200000000000000000000000000000000000006' as Address
      },
      1: { // Ethereum
        swapRouterAddress: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45' as Address, // Uniswap V3 Router
        wethAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' as Address
      },
      137: { // Polygon
        swapRouterAddress: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45' as Address, // Uniswap V3 Router
        wethAddress: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619' as Address
      }
    }

    return {
      ...this.config,
      ...configs[chainId]
    } as TransactionConfig
  }

  isValidTransaction(txHash: Hash): boolean {
    // Basic validation - check if it's a valid hash format
    return /^0x[a-fA-F0-9]{64}$/.test(txHash)
  }
}

// Default transaction service instance for Base
export const transactionService = new TransactionService({
  chainId: 8453,
  rpcUrl: 'https://mainnet.base.org',
  swapRouterAddress: '0x2626664c2603336E57B271c5C0b26F421741e4815' as Address, // Uniswap V3 Router on Base
  wethAddress: '0x4200000000000000000000000000000000000006' as Address
})

