import { Address, formatEther, parseEther } from 'viem'
import { gasRelayService as relayService } from './smart-account'

interface GasToken {
  address: Address
  symbol: string
  name: string
  decimals: number
  logoURI?: string
}

interface GasEstimate {
  gasLimit: bigint
  gasPrice: string
  maxFeePerGas: string
  maxPriorityFeePerGas: string
  estimatedCost: string
  estimatedCostUSD: string
}

interface RelayOptions {
  enabled: boolean
  gasToken?: Address
  maxCost?: string // Maximum cost user is willing to pay
  preferredTokens?: Address[] // Preferred tokens for gas payment
}

export class GasRelayManager {
  private supportedGasTokens: GasToken[] = [
    {
      address: '0x0000000000000000000000000000000000000000' as Address,
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
      logoURI: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png'
    },
    {
      address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address, // USDC on Base
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      logoURI: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png'
    },
    {
      address: '0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed' as Address, // DEGEN on Base
      symbol: 'DEGEN',
      name: 'Degen',
      decimals: 18,
      logoURI: 'https://assets.coingecko.com/coins/images/34515/small/android-chrome-512x512.png'
    }
  ]

  async estimateGasCost(
    gasLimit: bigint,
    gasTokenAddress?: Address,
    chainId: number = 8453 // Base by default
  ): Promise<GasEstimate> {
    try {
      // Get current gas prices
      const gasPrices = await this.getGasPrices(chainId)

      // Calculate costs
      const gasPrice = parseEther(gasPrices.gasPrice)
      const maxFeePerGas = parseEther(gasPrices.maxFeePerGas)
      const maxPriorityFeePerGas = parseEther(gasPrices.maxPriorityFeePerGas)

      // Use EIP-1559 pricing
      const estimatedCostWei = maxFeePerGas * gasLimit
      const estimatedCost = formatEther(estimatedCostWei)

      // Convert to USD (simplified - in production use price feeds)
      const ethPriceUSD = await this.getETHPriceUSD()
      const estimatedCostUSD = (parseFloat(estimatedCost) * ethPriceUSD).toFixed(2)

      return {
        gasLimit,
        gasPrice: gasPrices.gasPrice,
        maxFeePerGas: gasPrices.maxFeePerGas,
        maxPriorityFeePerGas: gasPrices.maxPriorityFeePerGas,
        estimatedCost,
        estimatedCostUSD
      }
    } catch (error) {
      console.error('Gas estimation failed:', error)
      // Return fallback estimates
      return {
        gasLimit,
        gasPrice: '0.00000001',
        maxFeePerGas: '0.00000001',
        maxPriorityFeePerGas: '0.000000001',
        estimatedCost: '0.0000021',
        estimatedCostUSD: '0.01'
      }
    }
  }

  private async getGasPrices(chainId: number): Promise<{
    gasPrice: string
    maxFeePerGas: string
    maxPriorityFeePerGas: string
  }> {
    try {
      // Try to get gas prices from a gas price oracle
      const response = await fetch(`https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY}`)

      if (response.ok) {
        const data = await response.json()
        return {
          gasPrice: data.result.SafeGasPrice + '000000000', // Convert gwei to wei
          maxFeePerGas: data.result.FastGasPrice + '000000000',
          maxPriorityFeePerGas: data.result.FastGasPrice + '000000000'
        }
      }
    } catch (error) {
      console.warn('Gas price API failed:', error)
    }

    // Fallback gas prices
    return {
      gasPrice: '20000000000', // 20 gwei
      maxFeePerGas: '50000000000', // 50 gwei
      maxPriorityFeePerGas: '2000000000' // 2 gwei
    }
  }

  private async getETHPriceUSD(): Promise<number> {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd')
      const data = await response.json()
      return data.ethereum.usd
    } catch (error) {
      console.warn('ETH price fetch failed:', error)
      return 2500 // Fallback price
    }
  }

  async getSponsoredGasOptions(
    gasLimit: bigint,
    userAddress: Address,
    relayOptions: RelayOptions
  ): Promise<{
    canSponsor: boolean
    sponsoredCost?: GasEstimate
    paymasterData?: string
    alternativeTokens?: GasToken[]
  }> {
    try {
      const sponsoredData = await relayService.getSponsoredGasData({
        sender: userAddress,
        callGasLimit: gasLimit,
      })

      if (sponsoredData.paymasterAndData !== '0x') {
        const sponsoredCost = await this.estimateGasCost(gasLimit)

        return {
          canSponsor: true,
          sponsoredCost: {
            ...sponsoredCost,
            estimatedCost: '0', // Sponsored transactions are free
            estimatedCostUSD: '0.00'
          },
          paymasterData: sponsoredData.paymasterAndData
        }
      }
    } catch (error) {
      console.warn('Sponsored gas check failed:', error)
    }

    // Return alternative gas token options
    const alternativeTokens = await this.getAlternativeGasTokens(userAddress)

    return {
      canSponsor: false,
      alternativeTokens
    }
  }

  private async getAlternativeGasTokens(userAddress: Address): Promise<GasToken[]> {
    // Check user's token balances and return tokens they can use for gas
    // In production, this would query the user's balances
    return this.supportedGasTokens.filter(token =>
      token.address !== '0x0000000000000000000000000000000000000000' // Exclude ETH as it's always available
    )
  }

  async calculateOptimalGasToken(
    gasLimit: bigint,
    userTokens: Address[],
    relayOptions: RelayOptions
  ): Promise<{
    recommendedToken: GasToken
    estimatedCost: GasEstimate
    savings?: number // Percentage savings compared to ETH
  }> {
    const ethEstimate = await this.estimateGasCost(gasLimit)

    let bestOption = {
      recommendedToken: this.supportedGasTokens[0], // Default to ETH
      estimatedCost: ethEstimate,
      savings: 0
    }

    for (const tokenAddress of userTokens) {
      const token = this.supportedGasTokens.find(t => t.address === tokenAddress)
      if (!token) continue

      try {
        // Get token price in ETH
        const tokenPrice = await this.getTokenPriceInETH(token.address)
        const tokenEstimate: GasEstimate = {
          ...ethEstimate,
          estimatedCost: (parseFloat(ethEstimate.estimatedCost) / tokenPrice).toString(),
          estimatedCostUSD: (parseFloat(ethEstimate.estimatedCostUSD) / tokenPrice).toString()
        }

        const savings = ((parseFloat(ethEstimate.estimatedCost) - parseFloat(tokenEstimate.estimatedCost)) / parseFloat(ethEstimate.estimatedCost)) * 100

        if (savings > bestOption.savings) {
          bestOption = {
            recommendedToken: token,
            estimatedCost: tokenEstimate,
            savings
          }
        }
      } catch (error) {
        console.warn(`Failed to calculate cost for token ${token.symbol}:`, error)
      }
    }

    return bestOption
  }

  private async getTokenPriceInETH(tokenAddress: Address): Promise<number> {
    // Get token price relative to ETH
    // In production, use price feeds like Chainlink or The Graph
    const tokenPrices: Record<string, number> = {
      '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913': 0.00025, // USDC ≈ 0.00025 ETH
      '0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed': 0.000001, // DEGEN ≈ 0.000001 ETH
    }

    return tokenPrices[tokenAddress] || 1
  }

  getSupportedGasTokens(): GasToken[] {
    return this.supportedGasTokens
  }

  isGasTokenSupported(tokenAddress: Address): boolean {
    return this.supportedGasTokens.some(token => token.address === tokenAddress)
  }

  async validateGasRelayEligibility(
    userAddress: Address,
    gasAmount: string
  ): Promise<{
    eligible: boolean
    reason?: string
    maxSponsoredAmount?: string
  }> {
    // Check if user is eligible for gas sponsorship
    // This could be based on user history, account age, etc.
    try {
      // Mock eligibility check - in production, this would call a backend service
      const isEligible = Math.random() > 0.3 // 70% eligibility rate

      if (isEligible) {
        return {
          eligible: true,
          maxSponsoredAmount: '0.01' // Max 0.01 ETH sponsored
        }
      } else {
        return {
          eligible: false,
          reason: 'User not eligible for gas sponsorship'
        }
      }
    } catch (error) {
      console.warn('Gas relay eligibility check failed:', error)
      return {
        eligible: false,
        reason: 'Eligibility check failed'
      }
    }
  }
}

// Singleton instance
export const gasRelayManager = new GasRelayManager()

