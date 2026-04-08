'use client'

import { formatEther } from 'viem'
import { useVaultStats } from '@/hooks/useLSE'
import { Card, CardContent } from '@/components/ui/card'

function fmt(wei: bigint, d = 4) {
  return parseFloat(formatEther(wei)).toFixed(d)
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
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
        {/* Logo + title */}
        <div className="flex flex-col items-center text-center gap-3 pb-2">
          <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
            <span className="text-2xl font-black text-primary">$</span>
          </div>
          <div>
            <p className="font-bold text-base">$LSE Vault</p>
            <p className="text-xs text-muted-foreground mt-0.5">Powered by ZyFAI AI agent</p>
          </div>
        </div>

        {/* Vault metrics */}
        <div className="space-y-0">
          <Row
            label="Total assets"
            value={isLoading ? '—' : `${fmt(totalAssets)} WETH`}
          />
          <Row
            label="Share price"
            value={isLoading ? '—' : `${fmt(sharePrice)} WETH`}
          />
          <Row label="Last APY" value="—" />
          <Row label="Standard"  value="ERC-7540" />
          <Row label="Network"   value="Sepolia" />
          <Row label="Latency"   value="~60s" />
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground leading-relaxed">
          Deposit WETH → LSE swaps to USDC → ZyFAI generates yield → redeem $LSE for WETH + rewards.
        </p>
      </CardContent>
    </Card>
  )
}
