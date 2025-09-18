import { AppShell } from '@/components/AppShell'
import { SwapForm } from '@/components/SwapForm'
import { FeatureGrid } from '@/components/FeatureGrid'

export default function HomePage() {
  return (
    <AppShell>
      <div className="min-h-screen bg-bg">
        {/* Hero Section */}
        <section className="px-4 py-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">AggroSwap</span>
          </h1>
          <p className="text-xl text-text-secondary mb-2">
            Cross-chain swaps, optimized
          </p>
          <p className="text-text-secondary max-w-2xl mx-auto">
            Get the best price, every time with our cross-chain liquidity aggregator
          </p>
        </section>

        {/* Main Swap Interface */}
        <section className="px-4 pb-8">
          <div className="max-w-md mx-auto">
            <SwapForm />
          </div>
        </section>

        {/* Features Grid */}
        <section className="px-4 py-8">
          <FeatureGrid />
        </section>
      </div>
    </AppShell>
  )
}
