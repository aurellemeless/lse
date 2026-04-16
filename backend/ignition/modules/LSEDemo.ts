import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * @notice Module de déploiement démo — déploie MockWETH + MockZyFAI + vault LSE.
 *         Utiliser pour Sepolia ou le réseau local.
 *
 * Utilisation :
 *   # Réseau local
 *   npx hardhat ignition deploy ignition/modules/LSEDemo.ts --network hardhatOp
 *
 *   # Sepolia
 *   npx hardhat ignition deploy ignition/modules/LSEDemo.ts --network sepolia
 *
 * MockZyFAI accepte directement le WETH — aucun swap nécessaire.
 */
export default buildModule("LSEDemoModule", (m) => {

  // -------------------------------------------------------------------------
  // Token fictif (WETH de test)
  // -------------------------------------------------------------------------

  const mockWETH = m.contract("MockERC20", ["Wrapped Ether", "WETH", 18], {
    id: "MockWETH",
  });

  // -------------------------------------------------------------------------
  // Mock ZyFAI (asset = WETH)
  // -------------------------------------------------------------------------

  const mockZyFAI = m.contract("MockZyFAI", [mockWETH]);

  // -------------------------------------------------------------------------
  // Vault LSE
  // -------------------------------------------------------------------------

  const lse = m.contract("LSE", [mockWETH, mockZyFAI]);

  return { lse, mockWETH, mockZyFAI };
});
