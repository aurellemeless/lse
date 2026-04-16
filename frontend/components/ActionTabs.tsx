'use client'

import { useState, useCallback } from 'react'
import { DepositForm } from '@/components/DepositForm'
import { RedeemForm } from '@/components/RedeemForm'
import { PendingCard, ClaimCard } from '@/components/ClaimSection'
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

  const handleRequestId = useCallback((id: bigint) => {
    setLastRequestId(id)
    setRedeemVersion(v => v + 1)
  }, [])

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

          {/* Indicateur de progression 3 étapes */}
          <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-[#B6509E]/20 text-[#B6509E] flex items-center justify-center text-[10px] font-bold shrink-0">1</span>
              <span>Demande</span>
            </div>
            <div className="flex-1 h-px bg-border" />
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-bold shrink-0">2</span>
              <span>Traitement</span>
            </div>
            <div className="flex-1 h-px bg-border" />
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0">3</span>
              <span>Récupérer</span>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <RedeemForm onRequestId={handleRequestId} />
            <PendingCard refreshTrigger={redeemVersion} />
          </div>

          <ClaimCard defaultRequestId={lastRequestId} />
        </div>
      )}

    </div>
  )
}
