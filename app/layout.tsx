import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AggroSwap - Cross-chain swaps, optimized',
  description: 'Cross-chain liquidity aggregator for EVM-compatible chains. Get the best price, every time.',
  keywords: ['DeFi', 'swap', 'cross-chain', 'liquidity', 'aggregator', 'Base'],
  authors: [{ name: 'AggroSwap Team' }],
  openGraph: {
    title: 'AggroSwap - Cross-chain swaps, optimized',
    description: 'Cross-chain liquidity aggregator for EVM-compatible chains. Get the best price, every time.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AggroSwap - Cross-chain swaps, optimized',
    description: 'Cross-chain liquidity aggregator for EVM-compatible chains. Get the best price, every time.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
