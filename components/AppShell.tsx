interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
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

          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-accent rounded-full" title="Connected to Base" />
            <span className="text-sm text-text-secondary">Base Network</span>
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
            Powered by Base • Cross-chain swaps, optimized
          </p>
          <p className="text-xs text-text-secondary mt-1">
            Get the best price, every time
          </p>
        </div>
      </footer>
    </div>
  )
}
