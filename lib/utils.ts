import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(value: number | string, decimals: number = 2): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '0'
  
  if (num < 0.01 && num > 0) {
    return '< 0.01'
  }
  
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(num)
}

export function formatCurrency(value: number | string, currency: string = 'USD'): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '$0.00'
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}

export function shortenAddress(address: string, chars: number = 4): string {
  if (!address) return ''
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`
}

export function calculatePriceImpact(inputAmount: number, outputAmount: number, marketPrice: number): number {
  if (!inputAmount || !outputAmount || !marketPrice) return 0
  
  const expectedOutput = inputAmount * marketPrice
  const priceImpact = ((expectedOutput - outputAmount) / expectedOutput) * 100
  
  return Math.max(0, priceImpact)
}

export function calculateSlippage(expectedAmount: number, actualAmount: number): number {
  if (!expectedAmount || !actualAmount) return 0
  
  return ((expectedAmount - actualAmount) / expectedAmount) * 100
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

export function parseUnits(value: string, decimals: number): bigint {
  try {
    const [integer, fraction = ''] = value.split('.')
    const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals)
    return BigInt(integer + paddedFraction)
  } catch {
    return BigInt(0)
  }
}

export function formatUnits(value: bigint, decimals: number): string {
  const divisor = BigInt(10 ** decimals)
  const quotient = value / divisor
  const remainder = value % divisor
  
  const remainderStr = remainder.toString().padStart(decimals, '0')
  const trimmedRemainder = remainderStr.replace(/0+$/, '')
  
  if (trimmedRemainder === '') {
    return quotient.toString()
  }
  
  return `${quotient}.${trimmedRemainder}`
}
