'use client'

import { useQuery } from '@tanstack/react-query'
import { usePublicClient, useAccount } from 'wagmi'
import { parseAbiItem } from 'viem'
import { CONTRACTS } from '@/lib/contracts'

const FROM_BLOCK = 10673731n

const DEPOSIT_EVENT = parseAbiItem(
  'event Deposit(address indexed sender, address indexed owner, uint256 assets, uint256 shares)'
)
const REDEEM_EVENT = parseAbiItem(
  'event RedeemRequest(address indexed controller, address indexed owner, uint256 indexed requestId, address sender, uint256 shares)'
)

export type HistoryEntry =
  | { type: 'deposit'; blockNumber: bigint; timestamp: number; txHash: `0x${string}`; assets: bigint; shares: bigint }
  | { type: 'redeem';  blockNumber: bigint; timestamp: number; txHash: `0x${string}`; shares: bigint; requestId: bigint }

export function useTransactionHistory() {
  const client      = usePublicClient()
  const { address } = useAccount()

  return useQuery({
    queryKey: ['lse-history', address, CONTRACTS.LSE],
    enabled: !!client && !!address && !!CONTRACTS.LSE,
    staleTime: 60_000,
    queryFn: async () => {
      if (!client || !address) return []

      const [depositLogs, redeemLogs] = await Promise.all([
        client.getLogs({
          address: CONTRACTS.LSE,
          event: DEPOSIT_EVENT,
          args: { owner: address },
          fromBlock: FROM_BLOCK,
        }),
        client.getLogs({
          address: CONTRACTS.LSE,
          event: REDEEM_EVENT,
          args: { owner: address },
          fromBlock: FROM_BLOCK,
        }),
      ])

      // Fetch timestamps for unique blocks only
      const uniqueBlocks = [...new Set([
        ...depositLogs.map(l => l.blockNumber ?? 0n),
        ...redeemLogs.map(l => l.blockNumber ?? 0n),
      ])]

      const blocks = await Promise.all(
        uniqueBlocks.map(n => client.getBlock({ blockNumber: n }))
      )
      const tsMap = new Map(blocks.map(b => [b.number, Number(b.timestamp)]))

      const entries: HistoryEntry[] = [
        ...depositLogs.map(log => ({
          type:        'deposit' as const,
          blockNumber: log.blockNumber  ?? 0n,
          timestamp:   tsMap.get(log.blockNumber ?? 0n) ?? 0,
          txHash:      (log.transactionHash ?? '0x') as `0x${string}`,
          assets:      log.args.assets  ?? 0n,
          shares:      log.args.shares  ?? 0n,
        })),
        ...redeemLogs.map(log => ({
          type:        'redeem' as const,
          blockNumber: log.blockNumber    ?? 0n,
          timestamp:   tsMap.get(log.blockNumber ?? 0n) ?? 0,
          txHash:      (log.transactionHash ?? '0x') as `0x${string}`,
          shares:      log.args.shares    ?? 0n,
          requestId:   log.args.requestId ?? 0n,
        })),
      ]

      return entries.sort((a, b) => b.timestamp - a.timestamp)
    },
  })
}
