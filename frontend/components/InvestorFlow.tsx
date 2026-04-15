// Static "how it works" step timeline — inspired by the draft's Investor Journey
export function InvestorFlow() {
  const steps = [
    {
      n: '1',
      title: 'Mint LSE',
      desc: 'Votre WETH est déposé, vous recevez votre équivalent en LSE. Vous recevez des parts $LSE représentant votre position.',
      color: 'bg-primary',
      textColor: 'text-primary',
      borderColor: 'border-primary/30',
      bgColor: 'bg-primary/5',
    },
    {
      n: '2',
      title: 'LSE génère du rendement',
      desc: 'Les agents utilisent les ETH déposés pour générer du rendement. Si 10% de rendement, LSE = 1.1 ETH.',
      color: 'bg-amber-600',
      textColor: 'text-amber-700 dark:text-amber-400',
      borderColor: 'border-amber-600/30',
      bgColor: 'bg-amber-500/5',
    },
    {
      n: '3',
      title: 'Repartez avec plus d\'ETH',
      desc: 'Brulez vos LSE pour récupérer des WETH. On espère que les agents ont bien travaillé.',
      color: 'bg-emerald-700',
      textColor: 'text-emerald-700 dark:text-emerald-400',
      borderColor: 'border-emerald-700/30',
      bgColor: 'bg-emerald-500/5',
    },
  ]

  return (
    <div className="grid sm:grid-cols-3 gap-4">
      {steps.map((s) => (
        <div key={s.n} className={`rounded-xl border ${s.borderColor} ${s.bgColor} p-5 space-y-3`}>
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full ${s.color} flex items-center justify-center text-sm font-bold text-white shrink-0`}>
              {s.n}
            </div>
            <p className={`font-semibold text-sm ${s.textColor}`}>{s.title}</p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
        </div>
      ))}
    </div>
  )
}
