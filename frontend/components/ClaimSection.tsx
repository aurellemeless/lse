'use client'

import { useState, useEffect } from 'react'
import { formatEther } from 'viem'
import { useClaim, useFulfillAll, usePendingValue, useClaimableValue, useVaultStats } from '@/hooks/useLSE'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

// ── Carte "En cours de traitement" ────────────────────────────────────────
interface PendingCardProps {
  refreshTrigger?: number
}

export function PendingCard({ refreshTrigger }: PendingCardProps) {
  const pending = usePendingValue()
  const fulfill = useFulfillAll()

  useEffect(() => {
    if (fulfill.isSuccess) pending.refetch()
  }, [fulfill.isSuccess])

  useEffect(() => {
    if (refreshTrigger !== undefined) pending.refetch()
  }, [refreshTrigger])

  const hasPending = pending.sharesData > 0n

  return (
    <Card className={cn(hasPending && 'border-amber-500/20')}>
      <CardContent className="pt-5 space-y-4">

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Traitement agent IA</span>
          <span className={cn(
            'text-[10px] font-semibold px-2 py-0.5 rounded-full',
            hasPending
              ? 'text-amber-400 bg-amber-500/10'
              : 'text-muted-foreground bg-muted'
          )}>
            {hasPending ? 'En attente' : 'Aucune demande'}
          </span>
        </div>

        {hasPending ? (
          <>
            {/* Indicateur animé */}
            <div className="flex items-center gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
              <div className="relative shrink-0">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <div className="absolute inset-0 w-2 h-2 rounded-full bg-amber-400 animate-ping opacity-60" />
              </div>
              <div>
                <p className="text-xs font-medium text-amber-400">~60s de traitement</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {parseFloat(formatEther(pending.data)).toFixed(4)} WETH en attente
                </p>
              </div>
            </div>

            {/* Bouton démo */}
            <div className="space-y-1.5">
              <p className="text-[10px] text-muted-foreground text-center">
                Démo — simule le délai mainnet
              </p>
              <Button
                variant="outline"
                className="w-full border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300"
                onClick={() => fulfill.fulfill()}
                disabled={fulfill.isPending}
              >
                {fulfill.isPending ? 'Traitement…' : 'Simuler le traitement (~60s)'}
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-4 gap-1.5">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.4"/>
                <path d="M7 4v3l2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.4"/>
              </svg>
            </div>
            <p className="text-xs text-muted-foreground">Aucune demande en cours</p>
          </div>
        )}

      </CardContent>
    </Card>
  )
}

// ── Carte "Récupérer le WETH" ─────────────────────────────────────────────
interface ClaimCardProps {
  defaultRequestId?: bigint
}

export function ClaimCard({ defaultRequestId }: ClaimCardProps) {
  const [requestId, setRequestId] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (defaultRequestId !== undefined) setRequestId(defaultRequestId.toString())
  }, [defaultRequestId])

  const { refetch }  = useVaultStats()
  const claimable    = useClaimableValue()
  const pending      = usePendingValue()
  const claim        = useClaim()

  const requestIdBig = requestId ? BigInt(requestId) : undefined
  const hasClaimable = claimable.sharesData > 0n

  useEffect(() => {
    if (claim.isSuccess) {
      refetch(); claimable.refetch(); pending.refetch()
      setDone(true); setTimeout(() => setDone(false), 3000)
    }
  }, [claim.isSuccess])

  return (
    <Card className={cn(hasClaimable && 'border-emerald-500/20')}>
      <CardContent className="pt-5 space-y-4">

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Récupérer le WETH</span>
          {hasClaimable && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-emerald-400 bg-emerald-500/10">
              Disponible
            </span>
          )}
        </div>

        {/* Montant claimable */}
        <div className={cn(
          'rounded-lg border px-4 py-3 flex items-center justify-between',
          hasClaimable
            ? 'border-emerald-500/20 bg-emerald-500/5'
            : 'border-border bg-muted/20'
        )}>
          <span className="text-xs text-muted-foreground">WETH récupérable</span>
          <span className={cn(
            'text-lg font-bold',
            hasClaimable ? 'text-emerald-400' : 'text-muted-foreground'
          )}>
            {hasClaimable
              ? `${parseFloat(formatEther(claimable.data)).toFixed(4)} WETH`
              : '—'}
          </span>
        </div>

        {/* Input request ID */}
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">ID de demande</label>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 h-11">
            <span className="text-xs text-muted-foreground font-mono">#</span>
            <Input
              type="number"
              placeholder="ex. 1"
              value={requestId}
              onChange={e => setRequestId(e.target.value)}
              className="border-0 bg-transparent p-0 h-auto font-mono focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
        </div>

        {/* CTA */}
        <Button
          className="w-full h-11 font-semibold bg-emerald-600 hover:bg-emerald-500"
          onClick={() => requestIdBig !== undefined && claim.claim(requestIdBig)}
          disabled={!requestIdBig || !hasClaimable || claim.isPending || done}
        >
          {done ? '✓ WETH récupéré' : claim.isPending ? 'Récupération…' : 'Récupérer le WETH'}
        </Button>

        {claim.error && (
          <p className="text-xs text-destructive">{claim.error.message?.slice(0, 80)}</p>
        )}

      </CardContent>
    </Card>
  )
}
