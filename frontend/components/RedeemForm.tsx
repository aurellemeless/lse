'use client'

import { useState, useEffect } from 'react'
import { parseEther, formatEther, parseEventLogs } from 'viem'
import { useRequestRedeem, useVaultStats } from '@/hooks/useLSE'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LSE_ABI } from '@/lib/contracts'

interface Props {
  onRequestId?: (id: bigint) => void
}

export function RedeemForm({ onRequestId }: Props) {
  const [amount, setAmount] = useState('')
  const [step, setStep]     = useState<'idle' | 'pending' | 'done'>('idle')
  const [lastId, setLastId] = useState<bigint | null>(null)

  const { lseBalance, sharePrice, refetch } = useVaultStats()
  const { requestRedeem, isPending, isSuccess, error, receipt } = useRequestRedeem()

  const amountWei    = amount ? parseEther(amount) : 0n
  const wethEstimate = amountWei > 0n ? (amountWei * sharePrice) / parseEther('1') : 0n

  useEffect(() => {
    if (isSuccess && receipt) {
      const logs = parseEventLogs({ abi: LSE_ABI, eventName: 'RedeemRequest', logs: receipt.logs })
      if (logs.length > 0) {
        const id = logs[0].args.requestId
        setLastId(id)
        onRequestId?.(id)
      }
      refetch(); setAmount(''); setStep('done'); setTimeout(() => setStep('idle'), 3000)
    }
  }, [isSuccess, receipt])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Votre solde $LSE</CardTitle>
        <CardDescription>Demande de rachat — les parts sont brûlées, puis le WETH est récupérable après ~60 s</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-3xl font-bold">{parseFloat(formatEther(lseBalance)).toFixed(4)}</p>

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>$LSE à racheter</span>
            <span>{parseFloat(formatEther(lseBalance)).toFixed(4)} $LSE</span>
          </div>
          <div className="flex gap-2">
            <Input type="number" placeholder="0.0" value={amount} onChange={e => setAmount(e.target.value)} className="flex-1 h-10" />
            <Button variant="outline" size="sm" className="h-10 px-3 text-xs" onClick={() => setAmount(formatEther(lseBalance))}>MAX</Button>
          </div>
          {wethEstimate > 0n && (
            <p className="text-xs text-muted-foreground">≈ {parseFloat(formatEther(wethEstimate)).toFixed(4)} WETH après ~60 s</p>
          )}
        </div>

        <Button className="w-full h-10 bg-orange-700 hover:bg-orange-600"
          onClick={() => { if (amountWei) { setStep('pending'); requestRedeem(amountWei) } }}
          disabled={!amountWei || isPending || step === 'done'}>
          {step === 'done' ? '✓ Demande envoyée' : isPending ? 'Envoi…' : 'Demander le rachat'}
        </Button>

        {lastId !== null && (
          <p className="text-xs text-muted-foreground">
            ID de demande : <span className="font-mono font-semibold text-foreground">{lastId.toString()}</span>
          </p>
        )}

        {error && <p className="text-xs text-destructive">{error.message?.slice(0, 80)}</p>}
      </CardContent>
    </Card>
  )
}
