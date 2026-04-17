'use client'

import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/ThemeToggle'
import { ConnectButton } from '@/components/ConnectButton'
import { useChainId } from 'wagmi'
import { sepolia, localhost } from '@/config/wagmi'

function useChainName() {
  const chainId = useChainId()
  if (chainId === localhost.id) return 'Hardhat'
  if (chainId === sepolia.id)   return 'Sepolia'
  return `Chain ${chainId}`
}

export function Navbar() {
  const chainName = useChainName()

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-6 flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full gradient-aave flex items-center justify-center text-[11px] font-black text-white">
              L
            </div>
            <span className="font-bold tracking-tight">$LSE</span>
          </div>
          <span className="hidden md:block text-sm font-medium cursor-default">Tableau de bord</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="hidden sm:flex text-muted-foreground">{chainName}</Badge>
          <a
            href="https://github.com/aurellemeless/lse"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="GitHub"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836a9.59 9.59 0 012.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
            </svg>
          </a>
          <ThemeToggle />
          <ConnectButton />
        </div>
      </div>
    </nav>
  )
}
