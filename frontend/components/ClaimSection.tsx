'use client'

import { useState, useEffect } from 'react'
import { formatEther } from 'viem'
import { useClaim, useFulfillAll, usePendingShares, useClaimableShares, useVaultStats } from '@/hooks/useLSE'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

// ─── Pending card (step 2a) ───────────────────────────────────────────────────

export function PendingCard() {
  const pending = usePendingShares()
  const fulfill = useFulfillAll()

  useEffect(() => {
    if (fulfill.isSuccess) pending.refetch()
  }, [fulfill.isSuccess])

  const hasPending = pending.data !== undefined && pending.data > 0n

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tokens being processed</CardTitle>
        <CardDescription>ZyFAI is generating yield on your USDC</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-3xl font-bold">
            {pending.data !== undefined ? formatEther(pending.data).slice(0, 8) : '—'}
          </p>
          <p className="text-sm text-muted-foreground mt-0.5">$LSE shares pending</p>
        </div>

        {hasPending ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-amber-700 dark:text-amber-400 border-amber-700/40 dark:border-amber-500/30 text-[10px]">Demo</Badge>
              <span className="text-xs text-muted-foreground">Simulate ~60s mainnet delay</span>
            </div>
            <Button
              variant="outline"
              className="w-full border-amber-700/40 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10"
              onClick={() => fulfill.fulfill()}
              disabled={fulfill.isPending}
            >
              {fulfill.isPending ? 'Processing…' : 'Simulate ZyFAI fulfillment'}
            </Button>
          </div>
        ) : (
          <Button variant="outline" className="w-full" disabled>
            Nothing pending
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Claim card (step 2b) ─────────────────────────────────────────────────────

export function ClaimCard() {
  const [requestId, setRequestId] = useState('')
  const [done, setDone]           = useState(false)

  const { refetch } = useVaultStats()
  const claimable   = useClaimableShares()
  const pending     = usePendingShares()
  const claim       = useClaim()

  const requestIdBig = requestId ? BigInt(requestId) : undefined
  const hasClaimable = claimable.data !== undefined && claimable.data > 0n

  useEffect(() => {
    if (claim.isSuccess) {
      refetch(); claimable.refetch(); pending.refetch()
      setDone(true); setTimeout(() => setDone(false), 3000)
    }
  }, [claim.isSuccess])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tokens to claim</CardTitle>
        <CardDescription>Ready to redeem for WETH</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className={`text-3xl font-bold ${hasClaimable ? 'text-emerald-700 dark:text-emerald-400' : ''}`}>
            {claimable.data !== undefined ? formatEther(claimable.data).slice(0, 8) : '—'}
          </p>
          <p className="text-sm text-muted-foreground mt-0.5">$LSE shares claimable</p>
        </div>

        <div className="space-y-2">
          <Input
            type="number"
            placeholder="Request ID (e.g. 1)"
            value={requestId}
            onChange={e => setRequestId(e.target.value)}
            className="h-10"
          />
          <Button
            className="w-full bg-emerald-700 hover:bg-emerald-600"
            onClick={() => requestIdBig !== undefined && claim.claim(requestIdBig)}
            disabled={!requestIdBig || !hasClaimable || claim.isPending || done}
          >
            {done ? '✓ WETH claimed' : claim.isPending ? 'Claiming…' : 'Claim WETH'}
          </Button>
        </div>

        {claim.error && <p className="text-xs text-destructive">{claim.error.message?.slice(0, 80)}</p>}
      </CardContent>
    </Card>
  )
}
