// Contract addresses — set after deployment via environment variables
export const CONTRACTS = {
  LSE:      (process.env.NEXT_PUBLIC_LSE_ADDRESS     ?? '') as `0x${string}`,
  WETH:     (process.env.NEXT_PUBLIC_WETH_ADDRESS    ?? '') as `0x${string}`,
  ZYFAI:    (process.env.NEXT_PUBLIC_ZYFAI_ADDRESS   ?? '') as `0x${string}`,
  SWAPPER:  (process.env.NEXT_PUBLIC_SWAPPER_ADDRESS ?? '') as `0x${string}`,
}

// ─── LSE ABI ──────────────────────────────────────────────────────────────────
export const LSE_ABI = [
  // ERC-20
  { name: 'name',        type: 'function', stateMutability: 'view',
    inputs: [], outputs: [{ name: '', type: 'string' }] },
  { name: 'symbol',      type: 'function', stateMutability: 'view',
    inputs: [], outputs: [{ name: '', type: 'string' }] },
  { name: 'decimals',    type: 'function', stateMutability: 'view',
    inputs: [], outputs: [{ name: '', type: 'uint8' }] },
  { name: 'totalSupply', type: 'function', stateMutability: 'view',
    inputs: [], outputs: [{ name: '', type: 'uint256' }] },
  { name: 'balanceOf',   type: 'function', stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }] },
  { name: 'allowance',   type: 'function', stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }] },
  { name: 'approve',     type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }],
    outputs: [{ name: '', type: 'bool' }] },

  // ERC-4626
  { name: 'asset',            type: 'function', stateMutability: 'view',
    inputs: [], outputs: [{ name: '', type: 'address' }] },
  { name: 'totalAssets',      type: 'function', stateMutability: 'view',
    inputs: [], outputs: [{ name: '', type: 'uint256' }] },
  { name: 'convertToAssets',  type: 'function', stateMutability: 'view',
    inputs: [{ name: 'shares', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }] },
  { name: 'convertToShares',  type: 'function', stateMutability: 'view',
    inputs: [{ name: 'assets', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }] },
  { name: 'previewDeposit',   type: 'function', stateMutability: 'view',
    inputs: [{ name: 'assets', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }] },
  { name: 'deposit',          type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'assets', type: 'uint256' }, { name: 'receiver', type: 'address' }],
    outputs: [{ name: 'shares', type: 'uint256' }] },

  // ERC-7540 — async redeem
  { name: 'requestRedeem', type: 'function', stateMutability: 'nonpayable',
    inputs: [
      { name: 'shares',     type: 'uint256' },
      { name: 'controller', type: 'address' },
      { name: 'owner',      type: 'address' },
    ],
    outputs: [{ name: 'requestId', type: 'uint256' }] },
  { name: 'claim', type: 'function', stateMutability: 'nonpayable',
    inputs: [
      { name: 'requestId', type: 'uint256' },
      { name: 'receiver',  type: 'address' },
    ],
    outputs: [{ name: 'wethReceived', type: 'uint256' }] },

  // ERC-7540 — operator
  { name: 'setOperator', type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'operator', type: 'address' }, { name: 'approved', type: 'bool' }],
    outputs: [{ name: '', type: 'bool' }] },
  { name: 'isOperator', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'controller', type: 'address' }, { name: 'operator', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }] },

  // Storage
  { name: 'wethPriceInUsdc', type: 'function', stateMutability: 'view',
    inputs: [], outputs: [{ name: '', type: 'uint256' }] },
  { name: 'usdc',   type: 'function', stateMutability: 'view',
    inputs: [], outputs: [{ name: '', type: 'address' }] },
  { name: 'zyFAI',  type: 'function', stateMutability: 'view',
    inputs: [], outputs: [{ name: '', type: 'address' }] },
  { name: 'swapper', type: 'function', stateMutability: 'view',
    inputs: [], outputs: [{ name: '', type: 'address' }] },
  { name: 'pendingRedeems', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'requestId', type: 'uint256' }],
    outputs: [
      { name: 'controller',  type: 'address' },
      { name: 'zyFaiShares', type: 'uint256' },
      { name: 'claimed',     type: 'bool' },
    ] },

  // Admin (owner only)
  { name: 'setSwapper',   type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: '_swapper', type: 'address' }], outputs: [] },
  { name: 'setWethPrice', type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: '_wethPriceInUsdc', type: 'uint256' }], outputs: [] },
  { name: 'owner', type: 'function', stateMutability: 'view',
    inputs: [], outputs: [{ name: '', type: 'address' }] },

  // Events
  { name: 'Deposit', type: 'event',
    inputs: [
      { name: 'sender',   type: 'address', indexed: true },
      { name: 'owner',    type: 'address', indexed: true },
      { name: 'assets',   type: 'uint256', indexed: false },
      { name: 'shares',   type: 'uint256', indexed: false },
    ] },
  { name: 'RedeemRequest', type: 'event',
    inputs: [
      { name: 'controller', type: 'address', indexed: true },
      { name: 'owner',      type: 'address', indexed: true },
      { name: 'requestId',  type: 'uint256', indexed: true },
      { name: 'sender',     type: 'address', indexed: false },
      { name: 'shares',     type: 'uint256', indexed: false },
    ] },
  { name: 'OperatorSet', type: 'event',
    inputs: [
      { name: 'controller', type: 'address', indexed: true },
      { name: 'operator',   type: 'address', indexed: true },
      { name: 'approved',   type: 'bool',    indexed: false },
    ] },
] as const

// ─── ERC-20 ABI (subset commun) ───────────────────────────────────────────────
export const ERC20_ABI = [
  { name: 'name',        type: 'function', stateMutability: 'view',
    inputs: [], outputs: [{ name: '', type: 'string' }] },
  { name: 'symbol',      type: 'function', stateMutability: 'view',
    inputs: [], outputs: [{ name: '', type: 'string' }] },
  { name: 'decimals',    type: 'function', stateMutability: 'view',
    inputs: [], outputs: [{ name: '', type: 'uint8' }] },
  { name: 'totalSupply', type: 'function', stateMutability: 'view',
    inputs: [], outputs: [{ name: '', type: 'uint256' }] },
  { name: 'balanceOf',   type: 'function', stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }] },
  { name: 'allowance',   type: 'function', stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }] },
  { name: 'approve',     type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }],
    outputs: [{ name: '', type: 'bool' }] },
  { name: 'transfer',    type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }],
    outputs: [{ name: '', type: 'bool' }] },
] as const

// ─── MockERC20 ABI (ajoute mint — testnet uniquement) ────────────────────────
export const MOCK_ERC20_ABI = [
  ...ERC20_ABI,
  { name: 'mint', type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }],
    outputs: [] },
] as const

// ─── MockZyFAI ABI ────────────────────────────────────────────────────────────
export const MOCK_ZYFAI_ABI = [
  { name: 'deposit',         type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'assets', type: 'uint256' }, { name: 'receiver', type: 'address' }],
    outputs: [{ name: 'shares', type: 'uint256' }] },
  { name: 'totalAssets',     type: 'function', stateMutability: 'view',
    inputs: [], outputs: [{ name: '', type: 'uint256' }] },
  { name: 'convertToAssets', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'shares', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }] },
  { name: 'convertToShares', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'assets', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }] },
  { name: 'balanceOf',       type: 'function', stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }] },
  { name: 'requestRedeem',   type: 'function', stateMutability: 'nonpayable',
    inputs: [
      { name: 'shares',     type: 'uint256' },
      { name: 'controller', type: 'address' },
      { name: 'owner',      type: 'address' },
    ],
    outputs: [{ name: 'requestId', type: 'uint256' }] },
  { name: 'pendingRedeemRequest',   type: 'function', stateMutability: 'view',
    inputs: [{ name: 'requestId', type: 'uint256' }, { name: 'controller', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }] },
  { name: 'claimableRedeemRequest', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'requestId', type: 'uint256' }, { name: 'controller', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }] },
  { name: 'redeem',          type: 'function', stateMutability: 'nonpayable',
    inputs: [
      { name: 'shares',     type: 'uint256' },
      { name: 'receiver',   type: 'address' },
      { name: 'controller', type: 'address' },
    ],
    outputs: [{ name: 'assets', type: 'uint256' }] },
  // Public mappings
  { name: 'pendingShares',   type: 'function', stateMutability: 'view',
    inputs: [{ name: 'controller', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }] },
  { name: 'claimableShares', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'controller', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }] },
  // Test helpers
  { name: 'fulfillAll',    type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'controller', type: 'address' }], outputs: [] },
  { name: 'simulateYield', type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'usdcAmount', type: 'uint256' }], outputs: [] },
] as const

// ─── MockSwapper ABI ──────────────────────────────────────────────────────────
export const MOCK_SWAPPER_ABI = [
  { name: 'swapWETHtoUSDC', type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'amountIn', type: 'uint256' }, { name: 'minAmountOut', type: 'uint256' }],
    outputs: [{ name: 'amountOut', type: 'uint256' }] },
  { name: 'swapUSDCtoWETH', type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'amountIn', type: 'uint256' }, { name: 'minAmountOut', type: 'uint256' }],
    outputs: [{ name: 'amountOut', type: 'uint256' }] },
  { name: 'weth',              type: 'function', stateMutability: 'view',
    inputs: [], outputs: [{ name: '', type: 'address' }] },
  { name: 'usdc',              type: 'function', stateMutability: 'view',
    inputs: [], outputs: [{ name: '', type: 'address' }] },
  { name: 'WETH_TO_USDC_RATE', type: 'function', stateMutability: 'view',
    inputs: [], outputs: [{ name: '', type: 'uint256' }] },
] as const
