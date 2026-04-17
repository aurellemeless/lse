'use client'

import { formatEther } from 'viem'
import { useAccount } from 'wagmi'
import { useTransactionHistory, type HistoryEntry } from '@/hooks/useHistory'

const EXPLORER = 'https://sepolia.etherscan.io/tx'

function shortHash(hash: string) {
  return `${hash.slice(0, 6)}…${hash.slice(-4)}`
}

function formatDate(timestamp: number) {
  if (!timestamp) return '—'
  return new Date(timestamp * 1000).toLocaleString('fr-FR', {
    day:    '2-digit',
    month:  '2-digit',
    year:   '2-digit',
    hour:   '2-digit',
    minute: '2-digit',
  })
}

function DepositRow({ e }: { e: Extract<HistoryEntry, { type: 'deposit' }> }) {
  return (
    <tr className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
      <td className="py-3 px-4">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#B6509E]/10 text-[#B6509E]">
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M4 1v5.5M4 1L2 3.5m2-2.5L6 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Dépôt
        </span>
      </td>
      <td className="py-3 px-4 text-right font-mono text-sm font-medium">
        {parseFloat(formatEther(e.assets)).toFixed(4)}
        <span className="text-muted-foreground text-xs ml-1">WETH</span>
      </td>
      <td className="py-3 px-4 text-right font-mono text-xs text-muted-foreground hidden sm:table-cell">
        {parseFloat(formatEther(e.shares)).toFixed(4)}
        <span className="ml-1">LSE</span>
      </td>
      <td className="py-3 px-4 text-right font-mono text-xs text-muted-foreground hidden md:table-cell">
        {formatDate(e.timestamp)}
      </td>
      <td className="py-3 px-4 text-right">
        <a
          href={`${EXPLORER}/${e.txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
        >
          {shortHash(e.txHash)}
        </a>
      </td>
    </tr>
  )
}

function RedeemRow({ e }: { e: Extract<HistoryEntry, { type: 'redeem' }> }) {
  return (
    <tr className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
      <td className="py-3 px-4">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400">
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M4 7V1.5M4 7L2 4.5m2 2.5L6 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Retrait
        </span>
      </td>
      <td className="py-3 px-4 text-right font-mono text-sm font-medium">
        {parseFloat(formatEther(e.shares)).toFixed(4)}
        <span className="text-muted-foreground text-xs ml-1">LSE</span>
      </td>
      <td className="py-3 px-4 text-right font-mono text-xs text-muted-foreground hidden sm:table-cell">
        #{e.requestId.toString()}
      </td>
      <td className="py-3 px-4 text-right font-mono text-xs text-muted-foreground hidden md:table-cell">
        {formatDate(e.timestamp)}
      </td>
      <td className="py-3 px-4 text-right">
        <a
          href={`${EXPLORER}/${e.txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
        >
          {shortHash(e.txHash)}
        </a>
      </td>
    </tr>
  )
}

export function TransactionHistory() {
  const { address } = useAccount()
  const { data: entries, isLoading, error } = useTransactionHistory()

  if (!address) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Historique</h2>
        {isLoading && (
          <span className="text-[10px] text-muted-foreground">Chargement…</span>
        )}
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        {error ? (
          <p className="text-xs text-destructive px-4 py-3">{(error as Error).message?.slice(0, 80)}</p>
        ) : !entries || entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="3" y="3" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.4"/>
              <path d="M7 10h6M7 7h4M7 13h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.4"/>
            </svg>
            <p className="text-xs">{isLoading ? 'Chargement…' : 'Aucune transaction'}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="py-2.5 px-4 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Type
                </th>
                <th className="py-2.5 px-4 text-right text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Montant
                </th>
                <th className="py-2.5 px-4 text-right text-[10px] font-semibold uppercase tracking-wide text-muted-foreground hidden sm:table-cell">
                  Reçu / ID
                </th>
                <th className="py-2.5 px-4 text-right text-[10px] font-semibold uppercase tracking-wide text-muted-foreground hidden md:table-cell">
                  Date
                </th>
                <th className="py-2.5 px-4 text-right text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Tx
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) =>
                e.type === 'deposit'
                  ? <DepositRow key={i} e={e} />
                  : <RedeemRow  key={i} e={e} />
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
