import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * @notice Module de déploiement démo — déploie tous les mocks + le vault.
 *         Utiliser pour Sepolia ou le réseau local.
 *
 * Utilisation :
 *   # Réseau local
 *   npx hardhat ignition deploy ignition/modules/LSEDemo.ts --network hardhatOp
 *
 *   # Sepolia
 *   npx hardhat ignition deploy ignition/modules/LSEDemo.ts --network sepolia
 *
 * Le MockSwapper utilise un taux fixe : 1 WETH = 2000 USDC.
 * Le MockZyFAI simule le vault ZyFAI avec retrait asynchrone.
 */
export default buildModule("LSEDemoModule", (m) => {

  // -------------------------------------------------------------------------
  // Tokens fictifs (WETH et USDC de test)
  // -------------------------------------------------------------------------

  const mockWETH = m.contract("MockERC20", ["Wrapped Ether", "WETH", 18], {
    id: "MockWETH",
  });

  const mockUSDC = m.contract("MockERC20", ["USD Coin", "USDC", 6], {
    id: "MockUSDC",
  });

  // -------------------------------------------------------------------------
  // Mocks ZyFAI et Swapper
  // -------------------------------------------------------------------------

  const mockZyFAI = m.contract("MockZyFAI", [mockUSDC]);

  const mockSwapper = m.contract("MockSwapper", [mockWETH, mockUSDC]);

  // -------------------------------------------------------------------------
  // Vault LSE
  // -------------------------------------------------------------------------

  const wethPriceInUsdc = m.getParameter<bigint>("wethPriceInUsdc", 2000n * 10n ** 6n);

  const lse = m.contract("LSE", [
    mockWETH,
    mockUSDC,
    mockZyFAI,
    mockSwapper,
    wethPriceInUsdc,
  ]);

  // -------------------------------------------------------------------------
  // Approvisionner le MockSwapper pour les swaps de démo
  // -------------------------------------------------------------------------

  // 1000 WETH de test dans le swapper
  m.call(mockWETH, "mint", [mockSwapper, 1000n * 10n ** 18n], { id: "MintWETHToSwapper" });

  // 2 000 000 USDC de test dans le swapper
  m.call(mockUSDC, "mint", [mockSwapper, 2_000_000n * 10n ** 6n], { id: "MintUSDCToSwapper" });

  return { lse, mockWETH, mockUSDC, mockZyFAI, mockSwapper };
});
