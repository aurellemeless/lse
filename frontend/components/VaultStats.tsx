'use client'

import { formatEther } from 'viem'
import { useVaultStats } from '@/hooks/useLSE'
import { Card, CardContent } from '@/components/ui/card'

function fmt(wei: bigint, d = 4) {
  return parseFloat(formatEther(wei)).toFixed(d)
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-xl font-semibold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground/60">{sub}</p>}
    </div>
  )
}

export function VaultStats() {
  const { totalAssets, totalSupply, lseBalance, wethBalance, sharePrice, positionValue, isLoading } = useVaultStats()

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex flex-wrap gap-10 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-24 bg-muted rounded" />
              <div className="h-6 w-20 bg-muted rounded" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="flex flex-wrap gap-10">
        <Stat label="Total vault assets" value={`${fmt(totalAssets)} WETH`} sub="Locked in ZyFAI" />
        <Stat label="Share price"        value={`${fmt(sharePrice)} WETH`}  sub="Per 1 $LSE" />
        <Stat label="Your $LSE"          value={fmt(lseBalance)}            sub={`≈ ${fmt(positionValue)} WETH`} />
        <Stat label="Your WETH"          value={`${fmt(wethBalance)} WETH`} />
      </CardContent>
    </Card>
  )
}
