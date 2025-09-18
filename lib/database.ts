import { SwapTransaction, User, GasRelayConfig } from './types'

interface DatabaseConfig {
  type: 'memory' | 'postgres' | 'mongodb'
  connectionString?: string
}

export class DatabaseService {
  private config: DatabaseConfig
  private memoryStore = {
    users: new Map<string, User>(),
    transactions: new Map<string, SwapTransaction>(),
    gasRelayConfigs: new Map<string, GasRelayConfig>(),
    apiKeys: new Map<string, any>()
  }

  constructor(config: DatabaseConfig = { type: 'memory' }) {
    this.config = config
  }

  // User operations
  async createUser(user: Omit<User, 'creationDate'>): Promise<User> {
    const newUser: User = {
      ...user,
      creationDate: Date.now()
    }

    this.memoryStore.users.set(user.userId, newUser)
    return newUser
  }

  async getUser(userId: string): Promise<User | null> {
    return this.memoryStore.users.get(userId) || null
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    const user = this.memoryStore.users.get(userId)
    if (!user) return null

    const updatedUser = { ...user, ...updates }
    this.memoryStore.users.set(userId, updatedUser)
    return updatedUser
  }

  async getUsersByWallet(walletAddress: string): Promise<User[]> {
    return Array.from(this.memoryStore.users.values()).filter(
      user => user.walletAddress === walletAddress
    )
  }

  // Transaction operations
  async createTransaction(transaction: SwapTransaction): Promise<SwapTransaction> {
    this.memoryStore.transactions.set(transaction.transactionId, transaction)
    return transaction
  }

  async getTransaction(transactionId: string): Promise<SwapTransaction | null> {
    return this.memoryStore.transactions.get(transactionId) || null
  }

  async updateTransaction(
    transactionId: string,
    updates: Partial<SwapTransaction>
  ): Promise<SwapTransaction | null> {
    const transaction = this.memoryStore.transactions.get(transactionId)
    if (!transaction) return null

    const updatedTransaction = { ...transaction, ...updates }
    this.memoryStore.transactions.set(transactionId, updatedTransaction)
    return updatedTransaction
  }

  async getUserTransactions(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<SwapTransaction[]> {
    const userTransactions = Array.from(this.memoryStore.transactions.values())
      .filter(tx => tx.userId === userId)
      .sort((a, b) => b.timestamp - a.timestamp)

    return userTransactions.slice(offset, offset + limit)
  }

  async getTransactionsByStatus(status: string, limit: number = 100): Promise<SwapTransaction[]> {
    return Array.from(this.memoryStore.transactions.values())
      .filter(tx => tx.status === status)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
  }

  // Gas relay config operations
  async createGasRelayConfig(config: GasRelayConfig): Promise<GasRelayConfig> {
    this.memoryStore.gasRelayConfigs.set(config.userId, config)
    return config
  }

  async getGasRelayConfig(userId: string): Promise<GasRelayConfig | null> {
    return this.memoryStore.gasRelayConfigs.get(userId) || null
  }

  async updateGasRelayConfig(
    userId: string,
    updates: Partial<GasRelayConfig>
  ): Promise<GasRelayConfig | null> {
    const config = this.memoryStore.gasRelayConfigs.get(userId)
    if (!config) return null

    const updatedConfig = { ...config, ...updates }
    this.memoryStore.gasRelayConfigs.set(userId, updatedConfig)
    return updatedConfig
  }

  // Analytics and reporting
  async getTransactionStats(timeRange?: { start: number; end: number }): Promise<{
    totalTransactions: number
    totalVolume: string
    totalFees: string
    successRate: number
    averageGasCost: string
  }> {
    const transactions = Array.from(this.memoryStore.transactions.values())

    let filteredTransactions = transactions
    if (timeRange) {
      filteredTransactions = transactions.filter(
        tx => tx.timestamp >= timeRange.start && tx.timestamp <= timeRange.end
      )
    }

    const totalTransactions = filteredTransactions.length
    const successfulTransactions = filteredTransactions.filter(tx => tx.status === 'success')

    const totalVolume = filteredTransactions.reduce((sum, tx) => {
      return sum + parseFloat(tx.amountIn)
    }, 0).toString()

    const totalFees = filteredTransactions.reduce((sum, tx) => {
      return sum + parseFloat(tx.feesPaid)
    }, 0).toString()

    const successRate = totalTransactions > 0 ? (successfulTransactions.length / totalTransactions) * 100 : 0

    const gasCosts = successfulTransactions
      .map(tx => parseFloat(tx.feesPaid))
      .filter(cost => !isNaN(cost))

    const averageGasCost = gasCosts.length > 0
      ? (gasCosts.reduce((sum, cost) => sum + cost, 0) / gasCosts.length).toString()
      : '0'

    return {
      totalTransactions,
      totalVolume,
      totalFees,
      successRate,
      averageGasCost
    }
  }

  async getPopularTokenPairs(limit: number = 10): Promise<Array<{
    fromToken: string
    toToken: string
    count: number
    volume: string
  }>> {
    const pairStats = new Map<string, { count: number; volume: number }>()

    for (const tx of this.memoryStore.transactions.values()) {
      if (tx.status !== 'success') continue

      const pairKey = `${tx.fromToken}-${tx.toToken}`
      const current = pairStats.get(pairKey) || { count: 0, volume: 0 }

      pairStats.set(pairKey, {
        count: current.count + 1,
        volume: current.volume + parseFloat(tx.amountIn)
      })
    }

    return Array.from(pairStats.entries())
      .map(([pairKey, stats]) => {
        const [fromToken, toToken] = pairKey.split('-')
        return {
          fromToken,
          toToken,
          count: stats.count,
          volume: stats.volume.toString()
        }
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
  }

  // Health check
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy'
    details: Record<string, any>
  }> {
    try {
      // Basic connectivity check
      const userCount = this.memoryStore.users.size
      const transactionCount = this.memoryStore.transactions.size

      return {
        status: 'healthy',
        details: {
          type: this.config.type,
          users: userCount,
          transactions: transactionCount,
          timestamp: Date.now()
        }
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: Date.now()
        }
      }
    }
  }

  // Cleanup old data (for memory store)
  async cleanupOldData(olderThanDays: number = 90): Promise<number> {
    const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000)
    let deletedCount = 0

    // Clean up old transactions
    for (const [id, tx] of this.memoryStore.transactions.entries()) {
      if (tx.timestamp < cutoffTime) {
        this.memoryStore.transactions.delete(id)
        deletedCount++
      }
    }

    return deletedCount
  }
}

// Singleton instance
export const databaseService = new DatabaseService({
  type: process.env.DATABASE_TYPE === 'postgres' ? 'postgres' : 'memory',
  connectionString: process.env.DATABASE_URL
})

