// Contract addresses — set after deployment via environment variables
export const CONTRACTS = {
  LSE:      (process.env.NEXT_PUBLIC_LSE_ADDRESS     ?? '') as `0x${string}`,
  WETH:     (process.env.NEXT_PUBLIC_WETH_ADDRESS    ?? '') as `0x${string}`,
  ZYFAI:    (process.env.NEXT_PUBLIC_ZYFAI_ADDRESS   ?? '') as `0x${string}`,
  SWAPPER:  (process.env.NEXT_PUBLIC_SWAPPER_ADDRESS ?? '') as `0x${string}`,
}

// ─── LSE ABI (subset — only functions used by the frontend) ──────────────────
export const LSE_ABI = [
  // ERC-20
  {
    name: 'name', type: 'function', stateMutability: 'view',
    inputs: [], outputs: [{ name: '', type: 'string' }],
  },
  {
    name: 'symbol', type: 'function', stateMutability: 'view',
    inputs: [], outputs: [{ name: '', type: 'string' }],
  },
  {
    name: 'balanceOf', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'totalSupply', type: 'function', stateMutability: 'view',
    inputs: [], outputs: [{ name: '', type: 'uint256' }],
  },
  // ERC-4626
  {
    name: 'asset', type: 'function', stateMutability: 'view',
    inputs: [], outputs: [{ name: '', type: 'address' }],
  },
  {
    name: 'totalAssets', type: 'function', stateMutability: 'view',
    inputs: [], outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'convertToAssets', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'shares', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'deposit', type: 'function', stateMutability: 'nonpayable',
    inputs: [
      { name: 'assets', type: 'uint256' },
      { name: 'receiver', type: 'address' },
    ],
    outputs: [{ name: 'shares', type: 'uint256' }],
  },
  // ERC-7540
  {
    name: 'requestRedeem', type: 'function', stateMutability: 'nonpayable',
    inputs: [
      { name: 'shares', type: 'uint256' },
      { name: 'controller', type: 'address' },
      { name: 'owner', type: 'address' },
    ],
    outputs: [{ name: 'requestId', type: 'uint256' }],
  },
  {
    name: 'claim', type: 'function', stateMutability: 'nonpayable',
    inputs: [
      { name: 'requestId', type: 'uint256' },
      { name: 'receiver', type: 'address' },
    ],
    outputs: [{ name: 'wethReceived', type: 'uint256' }],
  },
  // Storage
  {
    name: 'wethPriceInUsdc', type: 'function', stateMutability: 'view',
    inputs: [], outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'pendingRedeems', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'requestId', type: 'uint256' }],
    outputs: [
      { name: 'controller', type: 'address' },
      { name: 'zyFaiShares', type: 'uint256' },
      { name: 'claimed', type: 'bool' },
    ],
  },
  // Events
  {
    name: 'RedeemRequest', type: 'event',
    inputs: [
      { name: 'controller', type: 'address', indexed: true },
      { name: 'owner',      type: 'address', indexed: true },
      { name: 'requestId',  type: 'uint256', indexed: true },
      { name: 'sender',     type: 'address', indexed: false },
      { name: 'shares',     type: 'uint256', indexed: false },
    ],
  },
] as const

// ─── ERC-20 ABI (WETH / MockWETH) ────────────────────────────────────────────
export const ERC20_ABI = [
  {
    name: 'balanceOf', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'allowance', type: 'function', stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'approve', type: 'function', stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'decimals', type: 'function', stateMutability: 'view',
    inputs: [], outputs: [{ name: '', type: 'uint8' }],
  },
] as const

// ─── MockERC20 ABI (adds mint — for testnet demo only) ───────────────────────
export const MOCK_ERC20_ABI = [
  ...ERC20_ABI,
  {
    name: 'mint', type: 'function', stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
  },
] as const

// ─── MockZyFAI ABI (adds fulfillAll — for testnet demo only) ─────────────────
export const MOCK_ZYFAI_ABI = [
  {
    name: 'fulfillAll', type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'controller', type: 'address' }],
    outputs: [],
  },
  {
    name: 'pendingShares', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'controller', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'claimableShares', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'controller', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const
