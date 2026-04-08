import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import { headers } from 'next/headers'
import './globals.css'
import { Providers } from './providers'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })

export const metadata: Metadata = {
  title: '$LSE — Liquid Stock ETH',
  description: 'Yield on your WETH, powered by ZyFAI',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers()
  const cookieHeader = headersList.get('cookie')

  return (
    <html lang="en" className={geist.variable} suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <Providers cookies={cookieHeader}>{children}</Providers>
      </body>
    </html>
  )
}
