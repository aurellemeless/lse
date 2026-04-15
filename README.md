# Projet $LSE — Liquid Stock ETH

> Un moyen simple et transparent de faire travailler votre ETH, en utilisant une des meilleures infrastructures d'agent IA du marché, sans la complexité d'une gouvernance active.

Formation Blockchain Alyra 2026

---

## Concept

$LSE est un **vault DeFi sur Base** (L2 OP Stack). L'utilisateur dépose du WETH, reçoit des tokens `$LSE` représentant sa part du vault, et un agent IA (ZyFAI) fait travailler cet ETH automatiquement pour générer du rendement. Pas de DAO, pas de vote, pas de complexité.

---

## Architecture — Vault de Vault

ZyFAI ne dispose que d'une instance USDC sur Base. `LSE.sol` agit comme une surcouche ERC-7540 qui gère la conversion WETH ↔ USDC en interne, de façon invisible pour l'utilisateur.

```
Utilisateur (WETH)
      │
      ▼
┌─────────────────────────────────┐
│  LSE.sol  (ERC-4626 / ERC-7540) │  ← ce repo
│  asset = WETH                   │
│                                 │
│  deposit()  →  swap WETH→USDC   │
│  claim()    ←  swap USDC→WETH   │
└───────────────┬─────────────────┘
                │ USDC (via ISwapper)
                ▼
┌─────────────────────────────────┐
│  ZyFAI SmartAccountWrapper      │  ← déployé par ZyFAI
│  asset = USDC                   │
│  retrait asynchrone (~60s)      │
└─────────────────────────────────┘
```

---

## Flux opérationnels

### Dépôt (synchrone)
```
1. deposit(WETH)
2. swap WETH → USDC  (Uniswap v3 / MockSwapper)
3. ZyFAI.deposit(USDC)
4. mint $LSE à l'utilisateur
```

### Retrait (asynchrone — ERC-7540)
```
Étape 1 — requestRedeem(shares)
  → $LSE brûlés immédiatement
  → ZyFAI.requestRedeem()
  → requestId retourné (~60s de traitement)

Étape 2 — claim(requestId)
  → ZyFAI.redeem() → USDC récupéré
  → swap USDC → WETH
  → WETH transféré à l'utilisateur
```

---

## Acteurs

| Acteur | Rôle |
|---|---|
| **Équipe $LSE** | Déploie et maintient `LSE.sol`. Ne gère aucun fonds, aucune clé privée. |
| **ZyFAI** | Exécute les stratégies de yield. Prend 10% de commission sur les performances. |
| **Utilisateur** | Dépose WETH, reçoit `$LSE`. Responsable de ses décisions d'investissement. |
| **Curateurs externes** | DeFiLlama, Stakehouse, Pharos Watch — analyse et notation indépendantes. |

---

## Comparatif marché

| Concurrent | Leur approche | L'approche $LSE |
|---|---|---|
| **Lido** | Une stratégie : staking ETH. Simple, limité. | Une infra (ZyFAI) accédant à multiples stratégies. |
| **Yearn / Beefy** | Dizaines de vaults, stratégies opaques, gestion manuelle. | Un vault, un agent IA. Transparent et déterministe. |
| **ETF ETH (BlackRock)** | Tiers garde l'ETH, aucun rendement. | L'utilisateur garde ses `$LSE`, tous les rendements lui reviennent. |

---

## Stack technique

| Composant | Technologie |
|---|---|
| Réseau | Base (L2 OP Stack) |
| Smart Contract | Solidity ^0.8.28, ERC-4626 + ERC-7540 |
| Framework | Hardhat v3 |
| Déploiement | Hardhat Ignition |
| Tests | Mocha + Ethers v6 — 21 tests |
| Swap | ISwapper (MockSwapper en test, UniswapV3 en prod) |
| Yield | ZyFAI SmartAccountWrapper (USDC, Base Mainnet) |
| Frontend | Next.js + Tailwind CSS |

---

## Structure du repo

```
lse/
├── backend/
│   ├── contracts/
│   │   ├── LSE.sol                        # Vault principal ERC-4626 / ERC-7540
│   │   ├── interfaces/
│   │   │   ├── IZyFAI.sol                 # Interface ZyFAI SmartAccountWrapper
│   │   │   └── ISwapper.sol               # Interface swap WETH ↔ USDC
│   │   └── mocks/
│   │       ├── MockERC20.sol              # ERC20 avec mint (tests)
│   │       ├── MockSwapper.sol            # Swap 1 WETH = 2000 USDC (tests)
│   │       └── MockZyFAI.sol             # Vault ZyFAI simulé (tests)
│   ├── test/
│   │   └── LSE.test.ts                    # 21 tests Mocha
│   ├── ignition/modules/
│   │   └── LSE.ts                         # Module de déploiement
│   └── hardhat.config.ts
├── frontend/                              # Interface utilisateur du projet
└── docs/
    └── PROJECT_STATUS.md                  # Architecture & points bloquants
```

---

## Lancer le frontend

```bash
cd frontend
npm install
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000) dans le navigateur.

---

## Lancer les tests

```bash
cd backend
npm install
npx hardhat test
```

---

## Déploiement

```bash
# Réseau local
npx hardhat ignition deploy ignition/modules/LSE.ts --network hardhatOp

# Sepolia (testnet)
npx hardhat ignition deploy ignition/modules/LSE.ts --network sepolia
```

---

## Variables d'environnement

```
SEPOLIA_RPC_URL=...
SEPOLIA_PRIVATE_KEY=...
```

---

## Vision long terme

- Instance ZyFAI WETH native sur Base → suppression du swap WETH/USDC
- Intégration d'un second agent (**Giza**) en compétition avec ZyFAI
- Détenir des LSE pour avoir le droit de faire des prédictions sur la performance des agents.
- Protocole open source : toute entité peut déployer un vault compatible

## Références

**Standards**
- [EIP-4626 — Tokenized Vault Standard](https://eips.ethereum.org/EIPS/eip-4626)
- [EIP-7540 — Asynchronous ERC-4626 Tokenized Vaults](https://eips.ethereum.org/EIPS/eip-7540)
- [erc7540-wrapper — implémentation de référence (ondefy)](https://github.com/ondefy/erc7540-wrapper)

**Infrastructure**
- [Base — L2 OP Stack](https://base.org)
- [ZyFAI — Agent IA de yield](https://zyfi.org)
- [Uniswap v3 — Protocole de swap](https://docs.uniswap.org)

**Curateurs indépendants**
- [DeFiLlama](https://defillama.com)
- [Pharos Watch](https://pharos.watch)

## Outils

- VSCode : IDE pour ecrire le code en général
- Remix : Pour tester/appeler les contracts déjà deployés 
- Claude code : 
  - Assistance dans  la construction du frontend
  - Assistance pour l'amélioration de la documentation : README, commentaires de codes
  - Diagramme ASCII du flux de dépôt et retrait
