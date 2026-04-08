import { Navbar } from '@/components/Navbar'
import { VaultStats } from '@/components/VaultStats'
import { VaultSidebar } from '@/components/VaultSidebar'
import { InvestorFlow } from '@/components/InvestorFlow'
import { ActionTabs } from '@/components/ActionTabs'
import { Badge } from '@/components/ui/badge'

export default function Home() {
  return (
    <>
      <Navbar />

      <div className="max-w-[1100px] mx-auto px-6 py-10 space-y-8">

        {/* Protocol header */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-2xl tracking-tight">
              Générez du rendement avec WETH
            </h1>
            <Badge variant="outline" className="text-[10px] font-mono">Alyra 2026</Badge>
            <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground">Groupe 4</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Déposez du WETH · recevez des parts $LSE adossées au rendement IA de ZyFAI · coffre asynchrone ERC-7540
          </p>
        </div>

        {/* Stats band */}
        <VaultStats />

        {/* How it works */}
        <InvestorFlow />

        {/* Main: actions + sidebar */}
        <div className="grid lg:grid-cols-3 gap-5 items-start">
          <div className="lg:col-span-2">
            <ActionTabs />
          </div>
          <VaultSidebar />
        </div>

        {/* Footer disclaimer */}
        <p className="text-[10px] font-mono text-muted-foreground border-t border-border pt-6">
          Contrat non audité — démo uniquement sur le réseau de test Sepolia — pas de conseil financier
        </p>

      </div>
    </>
  )
}
