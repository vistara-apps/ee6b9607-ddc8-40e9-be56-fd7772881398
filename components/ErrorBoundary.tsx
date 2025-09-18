'use client'

import React from 'react'
import { ErrorHandler } from '@/lib/error-handling'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error
    ErrorHandler.logError(error, 'React Error Boundary', {
      componentStack: errorInfo.componentStack,
      errorBoundary: true
    })

    this.setState({
      error,
      errorInfo
    })

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error!} retry={this.handleRetry} />
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-bg flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-surface rounded-lg p-6 border border-red-500/20">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>

              <h2 className="text-xl font-semibold text-text-primary mb-2">
                Something went wrong
              </h2>

              <p className="text-text-secondary mb-6">
                We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mb-6 text-left">
                  <summary className="cursor-pointer text-sm text-text-secondary hover:text-text-primary">
                    Error Details (Development)
                  </summary>
                  <pre className="mt-2 p-3 bg-gray-900 rounded text-xs text-red-300 overflow-auto max-h-40">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={this.handleRetry}
                  className="flex-1 bg-accent hover:bg-accent/80 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Try Again
                </button>

                <button
                  onClick={() => window.location.reload()}
                  className="flex-1 bg-surface hover:bg-gray-700 text-text-primary font-medium py-2 px-4 rounded-lg border border-gray-600 transition-colors duration-200"
                >
                  Refresh Page
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook for functional components to use error boundary
export function useErrorHandler() {
  return (error: Error, errorInfo?: { componentStack?: string }) => {
    ErrorHandler.logError(error, 'Functional Component Error', {
      componentStack: errorInfo?.componentStack,
      functionalComponent: true
    })

    // In a real app, you might want to show a toast or modal here
    console.error('Component error:', error)
  }
}

// Higher-order component for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`

  return WrappedComponent
}

// Default error fallback component
export function DefaultErrorFallback({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
      <div className="flex items-center space-x-3">
        <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <div className="flex-1">
          <p className="text-red-400 text-sm font-medium">Error occurred</p>
          <p className="text-red-300 text-xs mt-1">
            {error.message || 'Something went wrong'}
          </p>
        </div>
        <button
          onClick={retry}
          className="text-red-400 hover:text-red-300 text-sm font-medium"
        >
          Retry
        </button>
      </div>
    </div>
  )
}

