import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * @notice Module de déploiement production — réseau avec contrats réels.
 *
 * Utilisation :
 *   npx hardhat ignition deploy ignition/modules/LSE.ts \
 *     --network base \
 *     --parameters ignition/params/base.json
 *
 * Adresses Base Mainnet :
 *   WETH  : 0x4200000000000000000000000000000000000006
 *   ZyFAI : adresse de l'instance WETH — voir ignition/params/base.json
 */
export default buildModule("LSEModule", (m) => {

  const wethAddress  = m.getParameter<string>("wethAddress");
  const zyFAIAddress = m.getParameter<string>("zyFAIAddress");

  const lse = m.contract("LSE", [wethAddress, zyFAIAddress]);

  return { lse };
});
