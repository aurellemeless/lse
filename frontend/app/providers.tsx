'use client'

import { wagmiAdapter, projectId, sepolia, localhost } from '@/config/wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createAppKit } from '@reown/appkit/react'
import { type ReactNode } from 'react'
import { cookieToInitialState, WagmiProvider, type Config } from 'wagmi'
import { ThemeProvider } from 'next-themes'

const queryClient = new QueryClient()

createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [localhost, sepolia],
  metadata: {
    name: '$LSE',
    description: 'Générez du rendement sur votre ETH avec un agent IA',
    url: 'https://lse.finance',
    icons: [],
  },
  themeMode: 'dark',
  features: { analytics: false },
  themeVariables: {
    '--w3m-accent':               '#2EBAC6',
    '--w3m-border-radius-master': '4px',
    '--w3m-font-family':          'var(--font-geist-sans)',
  },
})

export function Providers({ children, cookies }: { children: ReactNode; cookies: string | null }) {
  const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies)

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <WagmiProvider config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  )
}
