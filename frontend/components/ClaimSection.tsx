'use client'

import { useState, useEffect } from 'react'
import { formatEther } from 'viem'
import { useClaim, useFulfillAll, usePendingShares, useClaimableShares, useVaultStats } from '@/hooks/useLSE'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

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
        <CardTitle className="text-base">Jetons en cours de traitement</CardTitle>
        <CardDescription>ZyFAI génère du rendement sur vos USDC</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-3xl font-bold">
          {pending.data !== undefined ? formatEther(pending.data).slice(0, 8) : '—'}
        </p>

        {hasPending ? (
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-amber-700 dark:text-amber-400 border-amber-700/40 dark:border-amber-500/30 text-[10px]">Démo</Badge>
              <span className="text-xs text-muted-foreground">Simuler ~60 s de délai mainnet</span>
            </div>
            <Button variant="outline" className="w-full border-amber-700/40 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10"
              onClick={() => fulfill.fulfill()} disabled={fulfill.isPending}>
              {fulfill.isPending ? 'Traitement…' : 'Simuler le traitement ZyFAI'}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Aucune demande en attente</p>
        )}
      </CardContent>
    </Card>
  )
}

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
        <CardTitle className="text-base">Jetons à récupérer</CardTitle>
        <CardDescription>Prêts à être récupérés en WETH</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className={`text-3xl font-bold ${hasClaimable ? 'text-emerald-700 dark:text-emerald-400' : ''}`}>
          {claimable.data !== undefined ? formatEther(claimable.data).slice(0, 8) : '—'}
        </p>

        <div className="space-y-2">
          <Input type="number" placeholder="ID de demande (ex. 1)" value={requestId}
            onChange={e => setRequestId(e.target.value)} className="h-10" />
          <Button className="w-full h-10 bg-emerald-700 hover:bg-emerald-600"
            onClick={() => requestIdBig !== undefined && claim.claim(requestIdBig)}
            disabled={!requestIdBig || !hasClaimable || claim.isPending || done}>
            {done ? '✓ WETH récupéré' : claim.isPending ? 'Récupération…' : 'Récupérer le WETH'}
          </Button>
        </div>

        {claim.error && <p className="text-xs text-destructive">{claim.error.message?.slice(0, 80)}</p>}
      </CardContent>
    </Card>
  )
}
