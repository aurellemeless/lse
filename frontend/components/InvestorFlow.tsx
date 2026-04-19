// Static "how it works" step timeline
export function InvestorFlow() {
  const steps = [
    {
      n: '01',
      title: 'Déposez de l\'ETH',
      desc: 'Déposez vos ETH ou WETH dans le vault. Vous recevrez un montant de LSE équivalent à votre dépôt.',
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M9 1.5v15M9 1.5L5 6m4-4.5L13 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3 11.5h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M3 14.5h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.4"/>
        </svg>
      ),
      gradient: 'from-[#2EBAC6] to-[#2EBAC6]/60',
      glow: 'shadow-[0_0_20px_rgba(46,186,198,0.15)]',
      border: 'border-[#2EBAC6]/20',
      tag: 'Synchrone',
      tagColor: 'text-[#2EBAC6] bg-[#2EBAC6]/10',
    },
    {
      n: '02',
      title: 'L\'agent IA travaille',
      desc: 'L\'agent IA alloue vos ETH à des stratégies DeFi. Le prix du $LSE augmente au fil du rendement généré.',
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M9 1.5V3M9 15v1.5M1.5 9H3M15 9h1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M3.7 3.7l1.06 1.06M13.24 13.24l1.06 1.06M3.7 14.3l1.06-1.06M13.24 4.76l1.06-1.06" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.5"/>
        </svg>
      ),
      gradient: 'from-[#B6509E] to-[#2EBAC6]',
      glow: 'shadow-[0_0_20px_rgba(182,80,158,0.15)]',
      border: 'border-[#B6509E]/20',
      tag: 'Automatique',
      tagColor: 'text-[#B6509E] bg-[#B6509E]/10',
    },
    {
      n: '03',
      title: 'Récupérez vos gains',
      desc: 'Brûlez vos $LSE pour récupérer vos ETH + rendement. Le retrait est traité en ~60s par l\'agent.',
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M9 16.5v-15M9 16.5l4-4.5M9 16.5L5 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3 6.5h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M3 3.5h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.4"/>
        </svg>
      ),
      gradient: 'from-emerald-500 to-emerald-500/60',
      glow: 'shadow-[0_0_20px_rgba(52,211,153,0.15)]',
      border: 'border-emerald-500/20',
      tag: '~60 secondes',
      tagColor: 'text-emerald-400 bg-emerald-500/10',
    },
  ]

  return (
    <div className="grid sm:grid-cols-3 gap-3">
      {steps.map((s, i) => (
        <div key={s.n} className={`relative rounded-xl border ${s.border} bg-card p-5 space-y-4 ${s.glow}`}>

          {/* Connecteur entre steps */}
          {i < steps.length - 1 && (
            <div className="hidden sm:block absolute top-8 -right-1.5 z-10 text-border">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          )}

          {/* Header : numéro + icône */}
          <div className="flex items-start justify-between">
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${s.gradient} flex items-center justify-center text-white`}>
              {s.icon}
            </div>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${s.tagColor}`}>
              {s.tag}
            </span>
          </div>

          {/* Numéro + titre */}
          <div>
            <p className="text-[10px] font-mono text-muted-foreground/50 mb-0.5">{s.n}</p>
            <p className="font-semibold text-sm">{s.title}</p>
          </div>

          {/* Description */}
          <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
        </div>
      ))}
    </div>
  )
}
