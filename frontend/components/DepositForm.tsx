'use client'

import { useState, useEffect } from 'react'
import { parseEther, formatEther, maxUint256 } from 'viem'
import { useApproveWETH, useDeposit, useWethAllowance, useVaultStats, useMintTestWETH } from '@/hooks/useLSE'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function DepositForm() {
  const [amount, setAmount] = useState('')
  const [step, setStep]     = useState<'idle' | 'approving' | 'depositing' | 'done'>('idle')

  const { wethBalance, refetch } = useVaultStats()
  const { data: allowance, refetch: refetchAllowance } = useWethAllowance()
  const approve  = useApproveWETH()
  const deposit  = useDeposit()
  const mintWETH = useMintTestWETH()

  const amountWei     = amount ? parseEther(amount) : 0n
  const needsApproval = allowance !== undefined && allowance < amountWei

  useEffect(() => {
    if (approve.isSuccess) { refetchAllowance(); setStep('idle') }
  }, [approve.isSuccess])

  useEffect(() => {
    if (deposit.isSuccess) { refetch(); setAmount(''); setStep('done'); setTimeout(() => setStep('idle'), 3000) }
  }, [deposit.isSuccess])

  const handleSubmit = () => {
    if (!amountWei) return
    if (needsApproval) { setStep('approving'); approve.approve(maxUint256) }
    else               { setStep('depositing'); deposit.deposit(amountWei) }
  }

  const isLoading = approve.isPending || deposit.isPending
  const label = step === 'done'   ? '✓ Dépôt effectué'
    : approve.isPending ? 'Approbation…'
    : deposit.isPending ? 'Dépôt en cours…'
    : needsApproval     ? 'Autoriser le WETH'
    : 'Déposer du WETH'

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Votre solde WETH</CardTitle>
        <CardDescription>Déposez du WETH pour recevoir des parts $LSE</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-3xl font-bold">{parseFloat(formatEther(wethBalance)).toFixed(4)}</p>

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Montant à déposer</span>
            <span>{parseFloat(formatEther(wethBalance)).toFixed(4)} WETH</span>
          </div>
          <div className="flex gap-2">
            <Input type="number" placeholder="0.0" value={amount} onChange={e => setAmount(e.target.value)} className="flex-1 h-10" />
            <Button variant="outline" size="sm" className="h-10 px-3 text-xs" onClick={() => setAmount(formatEther(wethBalance))}>MAX</Button>
          </div>
        </div>

        <Button className="w-full h-10" onClick={handleSubmit} disabled={!amountWei || isLoading || step === 'done'}>
          {label}
        </Button>

        {(approve.error || deposit.error) && (
          <p className="text-xs text-destructive">{(approve.error || deposit.error)?.message?.slice(0, 80)}</p>
        )}

        <div className="pt-1 border-t border-border">
          <button onClick={() => mintWETH.mint(parseEther('10'))} disabled={mintWETH.isPending}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            {mintWETH.isPending ? 'Création en cours…' : '+ Obtenir 10 WETH de test (Sepolia uniquement)'}
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
