'use client'

import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/ThemeToggle'

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-6 flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-[11px] font-black text-primary-foreground">
              L
            </div>
            <span className="font-bold tracking-tight">$LSE</span>
          </div>
          <div className="hidden md:flex gap-6 text-sm">
            <span className="font-medium cursor-default">Dashboard</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="hidden sm:flex text-muted-foreground">Sepolia</Badge>
          <ThemeToggle />
          <w3m-button />
        </div>
      </div>
    </nav>
  )
}
