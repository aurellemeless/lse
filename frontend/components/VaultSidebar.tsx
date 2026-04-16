'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useChainId, useWalletClient } from 'wagmi'
import { sepolia, localhost } from '@/config/wagmi'
import { CONTRACTS } from '@/lib/contracts'

function useChainInfo() {
  const chainId = useChainId()
  if (chainId === localhost.id) return { name: 'Hardhat',  dot: 'bg-yellow-400' }
  if (chainId === sepolia.id)   return { name: 'Sepolia',  dot: 'bg-blue-400'   }
  return                               { name: `Chain ${chainId}`, dot: 'bg-muted-foreground' }
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-medium">{children}</span>
    </div>
  )
}

function CopyAddress({ address }: { address: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const short = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : '—'

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 font-mono text-xs text-foreground hover:text-primary transition-colors"
    >
      {short}
      {copied ? (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <rect x="4.5" y="1.5" width="6" height="7" rx="1" stroke="currentColor" strokeWidth="1.2"/>
          <path d="M1.5 4.5h1V9a1 1 0 001 1h4.5v1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
      )}
    </button>
  )
}

export function VaultSidebar() {
  const chain = useChainInfo()
  const { data: walletClient } = useWalletClient()

  return (
    <Card className="h-fit">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Infos techniques</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Row label="Contrat LSE">
            <CopyAddress address={CONTRACTS.LSE} />
          </Row>
          <Row label="Réseau">
            <span className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${chain.dot}`} />
              {chain.name}
            </span>
          </Row>
          <Row label="Standard">
            <span className="font-mono">ERC-4626 / 7540</span>
          </Row>
          <Row label="Délai de retrait">
            ~60 secondes
          </Row>
          <Row label="Frais de performance">
            10 % (ZyFAI)
          </Row>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs"
          disabled={!walletClient}
          onClick={() =>
            walletClient?.watchAsset({
              type: 'ERC20',
              options: {
                address: CONTRACTS.LSE,
                symbol: 'LSE',
                decimals: 18,
              },
            })
          }
        >
          Ajouter $LSE au wallet
        </Button>
      </CardContent>
    </Card>
  )
}
