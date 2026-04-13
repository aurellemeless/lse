'use client'

import { useReadContract, useWriteContract, useAccount, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther, maxUint256 } from 'viem'
import { CONTRACTS, LSE_ABI, MOCK_ERC20_ABI, MOCK_ZYFAI_ABI } from '@/lib/contracts'

// ─── Vault stats ──────────────────────────────────────────────────────────────

export function useVaultStats() {
  const { address } = useAccount()

  const totalAssets = useReadContract({
    address: CONTRACTS.LSE,
    abi: LSE_ABI,
    functionName: 'totalAssets',
    query: { enabled: !!CONTRACTS.LSE },
  })

  const totalSupply = useReadContract({
    address: CONTRACTS.LSE,
    abi: LSE_ABI,
    functionName: 'totalSupply',
    query: { enabled: !!CONTRACTS.LSE },
  })

  const lseBalance = useReadContract({
    address: CONTRACTS.LSE,
    abi: LSE_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  const wethBalance = useReadContract({
    address: CONTRACTS.WETH,
    abi: MOCK_ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  const sharePrice =
    totalAssets.data && totalSupply.data && totalSupply.data > 0n
      ? (totalAssets.data * parseEther('1')) / totalSupply.data
      : parseEther('1')

  const positionValue =
    lseBalance.data && totalAssets.data && totalSupply.data && totalSupply.data > 0n
      ? (lseBalance.data * totalAssets.data) / totalSupply.data
      : 0n

  return {
    totalAssets:  totalAssets.data  ?? 0n,
    totalSupply:  totalSupply.data  ?? 0n,
    lseBalance:   lseBalance.data   ?? 0n,
    wethBalance:  wethBalance.data  ?? 0n,
    sharePrice,
    positionValue,
    isLoading: totalAssets.isLoading || lseBalance.isLoading || wethBalance.isLoading,
    refetch: () => {
      totalAssets.refetch()
      totalSupply.refetch()
      lseBalance.refetch()
      wethBalance.refetch()
    },
  }
}

// ─── WETH allowance ───────────────────────────────────────────────────────────

export function useWethAllowance() {
  const { address } = useAccount()

  return useReadContract({
    address: CONTRACTS.WETH,
    abi: MOCK_ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, CONTRACTS.LSE] : undefined,
    query: { enabled: !!address },
  })
}

// ─── Approve WETH ─────────────────────────────────────────────────────────────

export function useApproveWETH() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const approve = (amount: bigint) =>
    writeContract({
      address: CONTRACTS.WETH,
      abi: MOCK_ERC20_ABI,
      functionName: 'approve',
      args: [CONTRACTS.LSE, amount],
    })

  return { approve, isPending: isPending || isConfirming, isSuccess, error }
}

// ─── Deposit ──────────────────────────────────────────────────────────────────

export function useDeposit() {
  const { address } = useAccount()
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const deposit = (wethAmount: bigint) => {
    if (!address) return
    writeContract({
      address: CONTRACTS.LSE,
      abi: LSE_ABI,
      functionName: 'deposit',
      args: [wethAmount, address],
    })
  }

  return { deposit, isPending: isPending || isConfirming, isSuccess, error }
}

// ─── Request Redeem ───────────────────────────────────────────────────────────

export function useRequestRedeem() {
  const { address } = useAccount()
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess, data: receipt } = useWaitForTransactionReceipt({ hash })

  const requestRedeem = (shares: bigint) => {
    if (!address) return
    writeContract({
      address: CONTRACTS.LSE,
      abi: LSE_ABI,
      functionName: 'requestRedeem',
      args: [shares, address, address],
    })
  }

  return { requestRedeem, isPending: isPending || isConfirming, isSuccess, error, receipt }
}

// ─── Claim ────────────────────────────────────────────────────────────────────

export function useClaim() {
  const { address } = useAccount()
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const claim = (requestId: bigint) => {
    if (!address) return
    writeContract({
      address: CONTRACTS.LSE,
      abi: LSE_ABI,
      functionName: 'claim',
      args: [requestId, address],
    })
  }

  return { claim, isPending: isPending || isConfirming, isSuccess, error }
}

// ─── Demo helpers (Sepolia only) ──────────────────────────────────────────────

export function useMintTestWETH() {
  const { address } = useAccount()
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const mint = (amount: bigint) => {
    if (!address) return
    writeContract({
      address: CONTRACTS.WETH,
      abi: MOCK_ERC20_ABI,
      functionName: 'mint',
      args: [address, amount],
    })
  }

  return { mint, isPending: isPending || isConfirming, isSuccess, error }
}

export function useFulfillAll() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const fulfill = () =>
    writeContract({
      address: CONTRACTS.ZYFAI,
      abi: MOCK_ZYFAI_ABI,
      functionName: 'fulfillAll',
      args: [CONTRACTS.LSE],
    })

  return { fulfill, isPending: isPending || isConfirming, isSuccess, error }
}

export function usePendingShares() {
  return useReadContract({
    address: CONTRACTS.ZYFAI,
    abi: MOCK_ZYFAI_ABI,
    functionName: 'pendingShares',
    args: [CONTRACTS.LSE],
  })
}

export function useClaimableShares() {
  return useReadContract({
    address: CONTRACTS.ZYFAI,
    abi: MOCK_ZYFAI_ABI,
    functionName: 'claimableShares',
    args: [CONTRACTS.LSE],
  })
}
