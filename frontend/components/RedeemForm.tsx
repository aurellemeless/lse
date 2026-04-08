'use client'

import { useState, useEffect } from 'react'
import { parseEther, formatEther } from 'viem'
import { useRequestRedeem, useVaultStats } from '@/hooks/useLSE'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function RedeemForm() {
  const [amount, setAmount] = useState('')
  const [step, setStep]     = useState<'idle' | 'pending' | 'done'>('idle')

  const { lseBalance, sharePrice, refetch } = useVaultStats()
  const { requestRedeem, isPending, isSuccess, error } = useRequestRedeem()

  const amountWei    = amount ? parseEther(amount) : 0n
  const wethEstimate = amountWei > 0n ? (amountWei * sharePrice) / parseEther('1') : 0n

  useEffect(() => {
    if (isSuccess) { refetch(); setAmount(''); setStep('done'); setTimeout(() => setStep('idle'), 3000) }
  }, [isSuccess])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Your $LSE Balance</CardTitle>
        <CardDescription>Redeem shares for WETH (2-step)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-3xl font-bold">
            {parseFloat(formatEther(lseBalance)).toFixed(4)}
          </p>
          <p className="text-sm text-muted-foreground mt-0.5">$LSE shares held</p>
        </div>

        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="0.0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="flex-1 h-10"
            />
            <Button variant="outline" size="sm" className="h-10 px-3 text-xs" onClick={() => setAmount(formatEther(lseBalance))}>
              MAX
            </Button>
          </div>
          {wethEstimate > 0n && (
            <p className="text-xs text-muted-foreground">
              ≈ {parseFloat(formatEther(wethEstimate)).toFixed(4)} WETH after ~60s
            </p>
          )}
          <Button
            className="w-full bg-orange-700 hover:bg-orange-600"
            onClick={() => { if (amountWei) { setStep('pending'); requestRedeem(amountWei) } }}
            disabled={!amountWei || isPending || step === 'done'}
          >
            {step === 'done' ? '✓ Request submitted' : isPending ? 'Submitting…' : 'Request Redeem'}
          </Button>
        </div>

        {error && <p className="text-xs text-destructive">{error.message?.slice(0, 80)}</p>}
      </CardContent>
    </Card>
  )
}
