'use client'

import { useState } from 'react'
import { DepositForm } from '@/components/DepositForm'
import { RedeemForm } from '@/components/RedeemForm'
import { PendingCard, ClaimCard } from '@/components/ClaimSection'
import { cn } from '@/lib/utils'

const tabs = [
  { id: 'supply',  label: 'Déposer du WETH' },
  { id: 'redeem',  label: 'Retirer & Récupérer' },
] as const

type Tab = typeof tabs[number]['id']

export function ActionTabs() {
  const [active, setActive] = useState<Tab>('supply')

  return (
    <div className="space-y-5">
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={cn(
              'px-4 pb-3 text-sm font-medium transition-colors border-b-2 -mb-px',
              active === t.id
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Supply tab */}
      {active === 'supply' && (
        <DepositForm />
      )}

      {/* Redeem + Claim tab — shows the 2-step flow vertically */}
      {active === 'redeem' && (
        <div className="space-y-4">
          {/* Step labels */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-orange-700 text-white flex items-center justify-center text-[10px] font-bold">1</span>
              Demande de retrait
            </span>
            <span className="flex-1 h-px bg-border" />
            <span className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-[10px] font-bold">2</span>
              Traitement ZyFAI
            </span>
            <span className="flex-1 h-px bg-border" />
            <span className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px] font-bold">3</span>
              Récupérer WETH
            </span>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <RedeemForm />
            <PendingCard />
          </div>
          <ClaimCard />
        </div>
      )}
    </div>
  )
}
