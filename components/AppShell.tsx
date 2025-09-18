'use client'

import { useMiniKit } from '@coinbase/minikit'
import { useAuthenticate } from '@coinbase/onchainkit/minikit'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const { context } = useMiniKit()
  const { user } = useAuthenticate()

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="border-b border-gray-700 bg-surface/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-primary to-accent rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="font-semibold text-text-primary">AggroSwap</span>
          </div>
          
          <div className="flex items-center space-x-3">
            {context?.user && (
              <div className="flex items-center space-x-2">
                {context.user.pfpUrl && (
                  <img
                    src={context.user.pfpUrl}
                    alt="Profile"
                    className="w-6 h-6 rounded-full"
                  />
                )}
                <span className="text-sm text-text-secondary">
                  {context.user.displayName || 'User'}
                </span>
              </div>
            )}
            
            {user && (
              <div className="w-2 h-2 bg-accent rounded-full" title="Connected" />
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-700 bg-surface/30 px-4 py-6 mt-8">
        <div className="text-center">
          <p className="text-sm text-text-secondary">
            Powered by Base • Built with MiniKit
          </p>
          <p className="text-xs text-text-secondary mt-1">
            Cross-chain swaps, optimized for the best rates
          </p>
        </div>
      </footer>
    </div>
  )
}
