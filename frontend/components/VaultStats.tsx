'use client'

import { formatEther } from 'viem'
import { useAccount } from 'wagmi'
import { useVaultStats } from '@/hooks/useLSE'

function fmt(wei: bigint, d = 4) {
  return parseFloat(formatEther(wei)).toFixed(d)
}

// ── Tuile stat générique ───────────────────────────────────────────────────
function StatTile({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: string
  sub?: string
  accent?: 'teal' | 'purple' | 'green' | 'neutral'
}) {
  const bar: Record<string, string> = {
    teal:    'bg-[#2EBAC6]',
    purple:  'bg-[#B6509E]',
    green:   'bg-emerald-500',
    neutral: 'bg-muted-foreground/40',
  }
  const dot = bar[accent ?? 'neutral']

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
        <span className="text-[11px] text-muted-foreground uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-2xl font-bold leading-none pl-3">{value}</p>
      {sub && <p className="text-xs text-muted-foreground/70 pl-3">{sub}</p>}
    </div>
  )
}

// ── Barre de progression ───────────────────────────────────────────────────
function ShareBar({ pct }: { pct: number }) {
  const display = Math.min(pct, 100)
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[11px] text-muted-foreground">
        <span>Votre part du vault</span>
        <span className="font-semibold text-foreground">{pct.toFixed(2)} %</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${display}%`,
            background: 'linear-gradient(90deg, #B6509E, #2EBAC6)',
          }}
        />
      </div>
    </div>
  )
}

// ── Badge rendement ────────────────────────────────────────────────────────
function YieldBadge({ sharePrice }: { sharePrice: bigint }) {
  const price = parseFloat(formatEther(sharePrice))
  if (price <= 1.0001) return null
  const pct = ((price - 1) * 100).toFixed(2)
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
        <path d="M4 7V1M1 4l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      +{pct} % yield
    </span>
  )
}

// ── Squelette de chargement ────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="grid sm:grid-cols-2 gap-px bg-border rounded-xl overflow-hidden animate-pulse">
      {[0, 1].map(i => (
        <div key={i} className="bg-card p-5 space-y-4">
          <div className="h-3 w-20 bg-muted rounded" />
          {[0, 1].map(j => (
            <div key={j} className="space-y-1.5">
              <div className="h-2.5 w-24 bg-muted rounded" />
              <div className="h-6 w-32 bg-muted rounded" />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

// ── Composant principal ────────────────────────────────────────────────────
export function VaultStats() {
  const { address } = useAccount()
  const {
    totalAssets,
    totalSupply,
    lseBalance,
    wethBalance,
    sharePrice,
    positionValue,
    isLoading,
  } = useVaultStats()

  if (isLoading) return <Skeleton />

  const sharePct =
    totalSupply > 0n
      ? (parseFloat(formatEther(lseBalance)) / parseFloat(formatEther(totalSupply))) * 100
      : 0

  return (
    <div className="grid sm:grid-cols-2 gap-px bg-border rounded-xl overflow-hidden">

      {/* ── Panneau gauche : vault global ── */}
      <div className="bg-card p-5 space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            Vault global
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <StatTile
            label="TVL"
            value={`${fmt(totalAssets)}`}
            sub="WETH gérés"
            accent="teal"
          />
          <StatTile
            label="Parts en circulation"
            value={fmt(totalSupply)}
            sub="$LSE mintés"
            accent="neutral"
          />
        </div>

        {/* Prix de part + badge yield */}
        <div className="rounded-lg border border-border bg-background/60 px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-widest mb-1">
              Prix de la part
            </p>
            <p className="text-xl font-bold">{fmt(sharePrice)} <span className="text-sm font-normal text-muted-foreground">WETH / $LSE</span></p>
          </div>
          <YieldBadge sharePrice={sharePrice} />
        </div>
      </div>

      {/* ── Panneau droit : position utilisateur ── */}
      <div className="bg-card p-5 space-y-5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          Ma position
        </p>

        {!address ? (
          <div className="flex flex-col items-center justify-center h-28 gap-2 text-center">
            <p className="text-sm text-muted-foreground">Connectez votre wallet</p>
            <p className="text-xs text-muted-foreground/60">pour voir votre position</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <StatTile
                label="Mes $LSE"
                value={fmt(lseBalance)}
                sub={`≈ ${fmt(positionValue)} WETH`}
                accent="purple"
              />
              <StatTile
                label="Mon WETH"
                value={fmt(wethBalance)}
                sub="disponible"
                accent="green"
              />
            </div>

            <ShareBar pct={sharePct} />
          </>
        )}
      </div>

    </div>
  )
}
