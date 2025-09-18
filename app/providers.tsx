'use client'

import { MiniKitProvider } from '@coinbase/minikit'
import { OnchainKitProvider } from '@coinbase/onchainkit'
import { base } from 'wagmi/chains'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MiniKitProvider
      chain={base}
      apiKey={process.env.NEXT_PUBLIC_MINIKIT_API_KEY || ''}
    >
      <OnchainKitProvider
        apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY || ''}
        chain={base}
      >
        {children}
      </OnchainKitProvider>
    </MiniKitProvider>
  )
}
