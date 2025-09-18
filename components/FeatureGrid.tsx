'use client'

import { FEATURE_CARDS } from '@/lib/constants'

export function FeatureGrid() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-text-primary mb-4">
          Why Choose AggroSwap?
        </h2>
        <p className="text-text-secondary max-w-2xl mx-auto">
          Experience the future of cross-chain swaps with our advanced aggregation technology
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {FEATURE_CARDS.map((feature, index) => (
          <div
            key={index}
            className="card hover:shadow-lg transition-shadow duration-300 text-center"
          >
            <div className="text-4xl mb-4">{feature.icon}</div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              {feature.title}
            </h3>
            <p className="text-sm text-text-secondary">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
      
      <div className="mt-12 text-center">
        <div className="card max-w-2xl mx-auto">
          <h3 className="text-xl font-semibold text-text-primary mb-4">
            Ready to start swapping?
          </h3>
          <p className="text-text-secondary mb-6">
            Join thousands of users who trust AggroSwap for their cross-chain trading needs.
            Get the best rates with minimal slippage across all major EVM chains.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">$2.5M+</div>
              <div className="text-sm text-text-secondary">Volume Traded</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">15,000+</div>
              <div className="text-sm text-text-secondary">Swaps Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">4</div>
              <div className="text-sm text-text-secondary">Chains Supported</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
