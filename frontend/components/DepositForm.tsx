'use client'

import { useState, useEffect } from 'react'
import { parseEther, formatEther, maxUint256 } from 'viem'
import { useApproveWETH, useDeposit, useWethAllowance, useVaultStats, useMintTestWETH } from '@/hooks/useLSE'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

function ApproveSteps({ approved }: { approved: boolean }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <div className={cn('flex items-center gap-1.5', approved ? 'text-muted-foreground' : 'text-foreground')}>
        <span className={cn(
          'w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold',
          approved ? 'bg-emerald-500 text-white' : 'bg-primary text-primary-foreground'
        )}>
          {approved ? '✓' : '1'}
        </span>
        Approuver
      </div>
      <div className="flex-1 h-px bg-border" />
      <div className={cn('flex items-center gap-1.5', approved ? 'text-foreground' : 'text-muted-foreground')}>
        <span className={cn(
          'w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold',
          approved ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        )}>
          2
        </span>
        Déposer
      </div>
    </div>
  )
}

export function DepositForm() {
  const [amount, setAmount] = useState('')
  const [step, setStep] = useState<'idle' | 'approving' | 'depositing' | 'done'>('idle')

  const { wethBalance, sharePrice, totalSupply, totalAssets, refetch } = useVaultStats()
  const { data: allowance, refetch: refetchAllowance } = useWethAllowance()
  const approve  = useApproveWETH()
  const deposit  = useDeposit()
  const mintWETH = useMintTestWETH()

  const amountWei     = amount ? parseEther(amount) : 0n
  const needsApproval = allowance !== undefined && allowance < amountWei
  const isLoading     = approve.isPending || deposit.isPending
  const insufficient  = amountWei > 0n && amountWei > wethBalance

  // Estimation $LSE à recevoir (formule ERC-4626 previewDeposit)
  const lseEstimate =
    amountWei > 0n
      ? totalSupply > 0n && totalAssets > 0n
        ? (amountWei * totalSupply) / totalAssets
        : amountWei
      : 0n

  useEffect(() => {
    if (approve.isSuccess) { refetchAllowance(); setStep('idle') }
  }, [approve.isSuccess])

  useEffect(() => {
    if (deposit.isSuccess) {
      refetch(); setAmount(''); setStep('done')
      setTimeout(() => setStep('idle'), 3000)
    }
  }, [deposit.isSuccess])

  const handleSubmit = () => {
    if (!amountWei) return
    if (needsApproval) { setStep('approving'); approve.approve(maxUint256) }
    else               { setStep('depositing'); deposit.deposit(amountWei) }
  }

  const btnLabel =
    step === 'done'     ? '✓ Dépôt effectué'
    : approve.isPending ? 'Approbation…'
    : deposit.isPending ? 'Dépôt en cours…'
    : needsApproval     ? 'Étape 1 — Approuver'
    : 'Déposer'

  return (
    <Card>
      <CardContent className="space-y-4 pt-5">

        {/* Label + solde cliquable */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Vous déposez</span>
          <button
            onClick={() => setAmount(formatEther(wethBalance))}
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            Solde : {parseFloat(formatEther(wethBalance)).toFixed(4)} WETH
          </button>
        </div>

        {/* Input token */}
        <div className={cn(
          'flex items-center gap-2 rounded-lg border bg-background px-3 h-14 transition-colors',
          insufficient
            ? 'border-destructive/50'
            : 'border-border focus-within:border-primary/40'
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
              onClick={() => setAmount(formatEther(wethBalance))}
              className="text-[10px] font-bold text-primary bg-primary/10 hover:bg-primary/20 px-1.5 py-0.5 rounded transition-colors"
            >
              MAX
            </button>
            <span className="text-sm font-semibold text-muted-foreground">WETH</span>
          </div>
        </div>

        {insufficient && (
          <p className="text-xs text-destructive -mt-2">Solde insuffisant</p>
        )}

        {/* Preview */}
        <div className="rounded-lg border border-border bg-muted/20 px-4 py-3 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Vous recevrez</span>
            <span className="font-semibold text-[#2EBAC6]">
              {lseEstimate > 0n
                ? `≈ ${parseFloat(formatEther(lseEstimate)).toFixed(4)} $LSE`
                : '—'}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Prix de la part</span>
            <span className="text-muted-foreground">
              {sharePrice > 0n
                ? `${parseFloat(formatEther(sharePrice)).toFixed(4)} WETH / $LSE`
                : '1.0000 WETH / $LSE'}
            </span>
          </div>
        </div>

        {/* Indicateur étapes si approval nécessaire */}
        {(needsApproval || step === 'approving') && (
          <ApproveSteps approved={!needsApproval && step !== 'approving'} />
        )}

        {/* CTA */}
        <Button
          className="w-full h-11 font-semibold"
          onClick={handleSubmit}
          disabled={!amountWei || isLoading || step === 'done' || insufficient}
        >
          {btnLabel}
        </Button>

        {(approve.error || deposit.error) && (
          <p className="text-xs text-destructive">
            {(approve.error || deposit.error)?.message?.slice(0, 80)}
          </p>
        )}

        {/* Helper testnet */}
        <div className="pt-1 border-t border-border">
          <button
            onClick={() => mintWETH.mint(parseEther('10'))}
            disabled={mintWETH.isPending}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {mintWETH.isPending ? 'Création en cours…' : '+ Obtenir 10 WETH de test (Sepolia)'}
          </button>
        </div>

      </CardContent>
    </Card>
  )
}
