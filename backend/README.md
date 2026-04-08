# Backend — $LSE / Hardhat

Backend du prototype `$LSE`, un vault DeFi `ERC-4626 / ERC-7540` construit avec **Hardhat v3**.

L'utilisateur dépose du **WETH**, reçoit des parts **$LSE**, puis le contrat interagit avec **ZyFAI** pour générer du rendement via une couche de conversion **WETH ↔ USDC**.

---

## Objectif du backend

Le backend contient :

- `contracts/LSE.sol` : vault principal `$LSE`
- `contracts/interfaces/` : interfaces `IZyFAI` et `ISwapper`
- `contracts/mocks/` : mocks utilisés pour les tests et la démo locale
- `ignition/modules/LSEDemo.ts` : déploiement **local / démo**
- `ignition/modules/LSE.ts` : déploiement **réseau réel**
- `test/LSE.test.ts` : tests du flow complet dépôt → retrait → claim

---

## Architecture locale de démo

En local, le projet ne dépend pas de contrats externes réels.
Le module `LSEDemo.ts` déploie automatiquement :

- `MockWETH`
- `MockUSDC`
- `MockZyFAI`
- `MockSwapper`
- `LSE`

Le `MockSwapper` utilise un taux fixe de démonstration :

```text
1 WETH = 2000 USDC
```

---

## Installation

```bash
cd backend
npm install
```

> Pour un usage **local Hardhat**, aucun secret n'est nécessaire.
> Le fichier `.env.local` est surtout utile pour `sepolia` et `base`.

---

## Commandes utiles

### Compiler

```bash
npx hardhat build
```

### Lancer les tests

```bash
npx hardhat test
```

### Lancer uniquement les tests Mocha

```bash
npx hardhat test mocha
```

---

## Déploiement local Hardhat

### Option 1 — Déploiement rapide sur le réseau simulé Hardhat

C'est l'option la plus simple pour tester le backend localement :

```bash
npx hardhat ignition deploy ignition/modules/LSEDemo.ts --network hardhatOp
```

Ce déploiement installe toute la stack de démo avec les mocks.

### Option 2 — Démarrer un nœud JSON-RPC local

Si vous voulez brancher un frontend ou interagir via `localhost:8545` :

```bash
npx hardhat node --chain-type op
```

Puis, dans un second terminal, déployer le module :

```bash
npx hardhat ignition deploy ignition/modules/LSEDemo.ts --network localhost
```

> **Note :** cette commande nécessite qu'un réseau `localhost` soit configuré si vous souhaitez industrialiser ce flow dans la config Hardhat.
> Pour l'instant, le chemin recommandé dans ce repo reste `--network hardhatOp`.

---

## Flow fonctionnel en local

### Dépôt (synchrone)

```text
1. deposit(WETH)
2. swap WETH → USDC
3. ZyFAI.deposit(USDC)
4. mint de $LSE à l'utilisateur
```

### Retrait (asynchrone)

```text
1. requestRedeem(shares)
2. attente de traitement côté ZyFAI mock
3. fulfillAll()
4. claim(requestId)
5. récupération du WETH
```

---

## Déploiement sur réseaux externes

### Sepolia

```bash
npx hardhat ignition deploy ignition/modules/LSEDemo.ts --network sepolia
```

### Base

```bash
npx hardhat ignition deploy ignition/modules/LSE.ts \
  --network base \
  --parameters ignition/params/base.json
```

---

## Variables d'environnement

Copier `env.sample` vers `.env.local` puis renseigner les valeurs nécessaires.

Exemple :

```bash
SEPOLIA_RPC_URL=...
SEPOLIA_PRIVATE_KEY=...
BASE_RPC_URL=...
BASE_PRIVATE_KEY=...
```

---

## Limitations connues

- Les retraits synchrones `withdraw()` et `redeem()` sont désactivés.
- Le retrait suit obligatoirement un flow **ERC-7540 asynchrone** :
  `requestRedeem()` puis `claim()`.
- En local, le rendement et les swaps sont **mockés** pour la démonstration.
- En production, le `MockSwapper` doit être remplacé par un vrai swapper (ex. Uniswap v3).

---

## Fichiers à consulter

- `contracts/LSE.sol`
- `ignition/modules/LSEDemo.ts`
- `ignition/modules/LSE.ts`
- `test/LSE.test.ts`
- `../README.md` pour la vue d'ensemble produit / architecture
