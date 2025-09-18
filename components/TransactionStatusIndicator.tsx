'use client'

import { TransactionStatus } from '@/lib/types'

interface TransactionStatusIndicatorProps {
  status: TransactionStatus
}

export function TransactionStatusIndicator({ status }: TransactionStatusIndicatorProps) {
  const getStatusConfig = (status: TransactionStatus) => {
    switch (status) {
      case 'pending':
        return {
          icon: (
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          ),
          title: 'Transaction Pending',
          description: 'Your swap is being processed...',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/20',
          textColor: 'text-blue-400'
        }
      case 'success':
        return {
          icon: (
            <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ),
          title: 'Swap Successful!',
          description: 'Your tokens have been swapped successfully.',
          bgColor: 'bg-accent/10',
          borderColor: 'border-accent/20',
          textColor: 'text-accent'
        }
      case 'error':
        return {
          icon: (
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ),
          title: 'Swap Failed',
          description: 'There was an error processing your swap.',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/20',
          textColor: 'text-red-400'
        }
      case 'cancelled':
        return {
          icon: (
            <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          ),
          title: 'Swap Cancelled',
          description: 'The swap was cancelled by the user.',
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/20',
          textColor: 'text-yellow-400'
        }
      default:
        return {
          icon: null,
          title: '',
          description: '',
          bgColor: '',
          borderColor: '',
          textColor: ''
        }
    }
  }

  const config = getStatusConfig(status)

  if (!config.icon) return null

  return (
    <div className={`${config.bgColor} ${config.borderColor} border rounded-lg p-4`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">
          {config.icon}
        </div>
        <div className="flex-1">
          <h4 className={`font-medium ${config.textColor}`}>
            {config.title}
          </h4>
          <p className="text-sm text-text-secondary mt-1">
            {config.description}
          </p>
        </div>
      </div>
    </div>
  )
}
