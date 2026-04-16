'use client'

import { useState, useCallback } from 'react'
import { DepositForm } from '@/components/DepositForm'
import { RedeemForm } from '@/components/RedeemForm'
import { PendingCard, ClaimCard } from '@/components/ClaimSection'
import { usePendingValue, useClaimableValue } from '@/hooks/useLSE'
import { cn } from '@/lib/utils'

const tabs = [
  {
    id: 'supply',
    label: 'Déposer',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M7 1.5v9M7 1.5L4 5m3-3.5L10 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2 10.5h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M2 12.5h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.4"/>
      </svg>
    ),
  },
  {
    id: 'redeem',
    label: 'Retirer',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M7 12.5v-9M7 12.5L4 9m3 3.5L10 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2 3.5h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M2 1.5h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.4"/>
      </svg>
    ),
  },
] as const

type Tab = typeof tabs[number]['id']

export function ActionTabs() {
  const [active, setActive] = useState<Tab>('supply')
  const [lastRequestId, setLastRequestId] = useState<bigint | undefined>(undefined)
  const [redeemVersion, setRedeemVersion] = useState(0)
  const [fulfillVersion, setFulfillVersion] = useState(0)

  const pending   = usePendingValue()
  const claimable = useClaimableValue()

  const hasPending   = pending.sharesData > 0n
  const hasClaimable = claimable.sharesData > 0n

  // step : 1 = idle/demande, 2 = traitement en cours, 3 = prêt à réclamer
  const step = hasClaimable ? 3 : hasPending ? 2 : 1

  const handleRequestId = useCallback((id: bigint) => {
    setLastRequestId(id)
    setRedeemVersion(v => v + 1)
  }, [])

  const handleFulfilled = useCallback(() => {
    claimable.refetch()
    setFulfillVersion(v => v + 1)
  }, [claimable])

  return (
    <div className="space-y-4">

      {/* Tab bar */}
      <div className="flex gap-1 p-1 rounded-xl bg-muted/40 border border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all',
              active === t.id
                ? 'bg-card text-foreground shadow-sm border border-border'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Supply tab */}
      {active === 'supply' && <DepositForm />}

      {/* Redeem tab */}
      {active === 'redeem' && (
        <div className="space-y-3">

          {/* Barre de progression dynamique */}
          <div className="flex items-center gap-2 px-1 text-xs">

            {/* Étape 1 */}
            <div className="flex items-center gap-1.5">
              <span className={cn(
                'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-all',
                step >= 1
                  ? 'bg-[#B6509E]/30 text-[#B6509E]'
                  : 'bg-muted text-muted-foreground'
              )}>
                {step > 1 ? '✓' : '1'}
              </span>
              <span className={cn('transition-colors', step >= 1 ? 'text-foreground' : 'text-muted-foreground')}>
                Demande
              </span>
            </div>

            {/* Connecteur 1→2 */}
            <div className={cn('flex-1 h-px transition-colors', step >= 2 ? 'bg-amber-500/50' : 'bg-border')} />

            {/* Étape 2 */}
            <div className="flex items-center gap-1.5">
              <span className={cn(
                'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-all',
                step === 2 ? 'bg-amber-500/30 text-amber-400 ring-1 ring-amber-500/40' :
                step > 2  ? 'bg-amber-500/20 text-amber-400' :
                             'bg-muted text-muted-foreground'
              )}>
                {step > 2 ? '✓' : '2'}
              </span>
              <span className={cn('transition-colors', step >= 2 ? 'text-amber-400' : 'text-muted-foreground')}>
                Traitement
              </span>
            </div>

            {/* Connecteur 2→3 */}
            <div className={cn('flex-1 h-px transition-colors', step >= 3 ? 'bg-emerald-500/50' : 'bg-border')} />

            {/* Étape 3 */}
            <div className="flex items-center gap-1.5">
              <span className={cn(
                'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-all',
                step === 3
                  ? 'bg-emerald-500/30 text-emerald-400 ring-1 ring-emerald-500/40'
                  : 'bg-muted text-muted-foreground'
              )}>
                3
              </span>
              <span className={cn('transition-colors', step === 3 ? 'text-emerald-400' : 'text-muted-foreground')}>
                Récupérer
              </span>
            </div>

          </div>

          {/* Étape 1 — Formulaire de demande + traitement */}
          <div className="grid sm:grid-cols-2 gap-3">
            <RedeemForm onRequestId={handleRequestId} />
            <PendingCard refreshTrigger={redeemVersion} onFulfilled={handleFulfilled} />
          </div>

          {/* Connecteur vertical avec flèche */}
          <div className="flex flex-col items-center gap-1 py-1">
            <div className={cn(
              'w-px h-4 transition-colors',
              hasClaimable ? 'bg-emerald-500/40' : hasPending ? 'bg-amber-500/30' : 'bg-border'
            )} />
            <svg
              width="10" height="6" viewBox="0 0 10 6" fill="none"
              className={cn('transition-colors', hasClaimable ? 'text-emerald-500/60' : hasPending ? 'text-amber-500/40' : 'text-border')}
            >
              <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          {/* Étape 3 — Claim */}
          <ClaimCard defaultRequestId={lastRequestId} refreshTrigger={fulfillVersion} />

        </div>
      )}

    </div>
  )
}
