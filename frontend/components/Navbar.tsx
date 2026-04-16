'use client'

import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/ThemeToggle'
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
          <ThemeToggle />
          <w3m-button label="Se connecter" loadingLabel="Connexion…" />
        </div>
      </div>
    </nav>
  )
}
