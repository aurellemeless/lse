'use client'

import { formatEther } from 'viem'
import { useVaultStats } from '@/hooks/useLSE'
import { Card, CardContent } from '@/components/ui/card'

function fmt(wei: bigint, d = 4) {
  return parseFloat(formatEther(wei)).toFixed(d)
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  )
}

export function VaultSidebar() {
  const { totalAssets, sharePrice, isLoading } = useVaultStats()

  return (
    <Card className="h-fit">
      <CardContent className="space-y-5">
        <div className="flex flex-col items-center text-center gap-3 pb-2">
          <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
            <span className="text-2xl font-black text-primary">$</span>
          </div>
          <div>
            <p className="font-bold text-base">Coffre $LSE</p>
            <p className="text-xs text-muted-foreground mt-0.5">Propulsé par l&apos;agent IA ZyFAI</p>
          </div>
        </div>
        <div>
          <Row label="Total actifs"  value={isLoading ? '—' : `${fmt(totalAssets)} WETH`} />
          <Row label="Prix de part"  value={isLoading ? '—' : `${fmt(sharePrice)} WETH`} />
          <Row label="Dernier APY"   value="—" />
          <Row label="Standard"      value="ERC-7540" />
          <Row label="Latence"       value="~60s" />
          <Row label="Réseau"        value="Sepolia" />
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Déposez WETH → échange en USDC → ZyFAI génère du rendement → rachetez vos $LSE contre WETH + gains.
        </p>
      </CardContent>
    </Card>
  )
}
