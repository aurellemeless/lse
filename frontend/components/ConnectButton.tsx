'use client'

import { useAppKit } from '@reown/appkit/react'
import { useAccount } from 'wagmi'
import { cn } from '@/lib/utils'

interface ConnectButtonProps {
  size?: 'sm' | 'default'
  className?: string
}

export function ConnectButton({ size = 'default', className }: ConnectButtonProps) {
  const { open }                     = useAppKit()
  const { address, isConnected }     = useAccount()

  const short = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : null

  return (
    <button
      onClick={() => open()}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-colors rounded-lg border border-primary text-primary bg-transparent hover:bg-primary/10',
        size === 'sm'
          ? 'text-xs px-3 h-8 gap-1.5'
          : 'text-sm px-4 h-9 gap-2',
        className
      )}
    >
      {isConnected ? (
        <>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
          <span className="font-mono">{short}</span>
        </>
      ) : (
        <>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0">
            <path d="M2 4a2 2 0 012-2h4a2 2 0 012 2v.5H2V4zM1 6.5A1.5 1.5 0 012.5 5h7A1.5 1.5 0 0111 6.5v2A1.5 1.5 0 019.5 10h-7A1.5 1.5 0 011 8.5v-2z" fill="currentColor" fillOpacity="0.6"/>
            <circle cx="8.5" cy="7.5" r="1" fill="currentColor"/>
          </svg>
          Se connecter
        </>
      )}
    </button>
  )
}
