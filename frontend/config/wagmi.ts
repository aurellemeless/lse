import { cookieStorage, createStorage, http } from '@wagmi/core'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { sepolia as sepoliaViem } from 'viem/chains'
import type { AppKitNetwork } from '@reown/appkit/networks'

export const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID!

if (!projectId) {
  throw new Error('NEXT_PUBLIC_REOWN_PROJECT_ID is not set')
}

const rpcUrl = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || sepoliaViem.rpcUrls.default.http[0]

export const sepolia: AppKitNetwork = {
  id: sepoliaViem.id,
  name: sepoliaViem.name,
  nativeCurrency: sepoliaViem.nativeCurrency,
  rpcUrls: { default: { http: [rpcUrl] } },
  blockExplorers: sepoliaViem.blockExplorers,
  testnet: true,
}

export const localhost: AppKitNetwork = {
  id: 31337,
  name: 'Hardhat',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['http://127.0.0.1:8545'] } },
  testnet: true,
}

export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
  projectId,
  networks: [localhost, sepolia],
})

export const config = wagmiAdapter.wagmiConfig
