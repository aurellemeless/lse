'use client'

import { useState, useEffect } from 'react'
import { parseEther, formatEther, parseEventLogs } from 'viem'
import { useRequestRedeem, useVaultStats } from '@/hooks/useLSE'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LSE_ABI } from '@/lib/contracts'
import { cn } from '@/lib/utils'

interface Props {
  onRequestId?: (id: bigint) => void
}

export function RedeemForm({ onRequestId }: Props) {
  const [amount, setAmount] = useState('')
  const [lastId, setLastId] = useState<bigint | null>(null)
  const [done, setDone]     = useState(false)

  const { lseBalance, sharePrice, refetch } = useVaultStats()
  const { requestRedeem, isPending, isSuccess, error, receipt } = useRequestRedeem()

  const amountWei     = amount ? parseEther(amount) : 0n
  const insufficient  = amountWei > 0n && amountWei > lseBalance
  const wethEstimate  = amountWei > 0n && sharePrice > 0n
    ? (amountWei * sharePrice) / parseEther('1')
    : 0n

  useEffect(() => {
    if (isSuccess && receipt) {
      const logs = parseEventLogs({ abi: LSE_ABI, eventName: 'RedeemRequest', logs: receipt.logs })
      if (logs.length > 0) {
        const id = logs[0].args.requestId
        setLastId(id)
        onRequestId?.(id)
      }
      refetch(); setAmount(''); setDone(true)
      setTimeout(() => setDone(false), 3000)
    }
  }, [isSuccess, receipt])

  return (
    <Card>
      <CardContent className="space-y-4 pt-5">

        {/* Label + solde cliquable */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Vous retirez</span>
          <button
            onClick={() => setAmount(formatEther(lseBalance))}
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            Solde : {parseFloat(formatEther(lseBalance)).toFixed(4)} $LSE
          </button>
        </div>

        {/* Input token */}
        <div className={cn(
          'flex items-center gap-2 rounded-lg border bg-background px-3 h-14 transition-colors',
          insufficient
            ? 'border-destructive/50'
            : 'border-border focus-within:border-[#B6509E]/40'
        )}>
          <Input
            type="number"
            placeholder="0.0"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="border-0 bg-transparent p-0 text-xl font-semibold h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setAmount(formatEther(lseBalance))}
              className="text-[10px] font-bold text-[#B6509E] bg-[#B6509E]/10 hover:bg-[#B6509E]/20 px-1.5 py-0.5 rounded transition-colors"
            >
              MAX
            </button>
            <span className="text-sm font-semibold text-muted-foreground">$LSE</span>
          </div>
        </div>

        {insufficient && (
          <p className="text-xs text-destructive -mt-2">Solde insuffisant</p>
        )}

        {/* Preview */}
        <div className="rounded-lg border border-border bg-muted/20 px-4 py-3 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Vous récupérerez</span>
            <span className={cn('font-semibold', wethEstimate > 0n ? 'text-emerald-400' : 'text-muted-foreground')}>
              {wethEstimate > 0n
                ? `≈ ${parseFloat(formatEther(wethEstimate)).toFixed(4)} WETH`
                : '—'}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Délai de traitement</span>
            <span className="text-muted-foreground">~60 secondes</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">$LSE brûlés</span>
            <span className="text-muted-foreground">
              {amountWei > 0n ? `${parseFloat(formatEther(amountWei)).toFixed(4)} $LSE` : '—'}
            </span>
          </div>
        </div>

        {/* CTA */}
        <Button
          className="w-full h-11 font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #B6509E, #2EBAC6)' }}
          onClick={() => { if (amountWei) requestRedeem(amountWei) }}
          disabled={!amountWei || isPending || done || insufficient}
        >
          {done ? '✓ Demande envoyée' : isPending ? 'Envoi…' : 'Demander le rachat'}
        </Button>

        {/* Request ID après succès */}
        {lastId !== null && (
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2.5">
            <span className="text-xs text-muted-foreground">ID de demande</span>
            <span className="text-xs font-mono font-bold text-foreground">#{lastId.toString()}</span>
          </div>
        )}

        {error && (
          <p className="text-xs text-destructive">{error.message?.slice(0, 80)}</p>
        )}

      </CardContent>
    </Card>
  )
}
