import { Navbar } from '@/components/Navbar'
import { DepositForm } from '@/components/DepositForm'
import { RedeemForm } from '@/components/RedeemForm'
import { PendingCard, ClaimCard } from '@/components/ClaimSection'
import { VaultSidebar } from '@/components/VaultSidebar'

export default function Home() {
  return (
    <>
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">

        {/* Protocol header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Earn yield with WETH
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Deposit WETH, receive $LSE shares backed by ZyFAI AI-managed yield
          </p>
        </div>

        {/* Main layout: 2/3 grid + 1/3 sidebar */}
        <div className="grid lg:grid-cols-3 gap-6 items-start">

          {/* 2×2 action grid */}
          <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4">
            <DepositForm />
            <RedeemForm />
            <PendingCard />
            <ClaimCard />
          </div>

          {/* Vault info sidebar */}
          <VaultSidebar />

        </div>
      </div>
    </>
  )
}
