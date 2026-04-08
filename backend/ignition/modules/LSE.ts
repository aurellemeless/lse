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
 *   USDC  : 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
 *   ZyFAI : 0x29d6fbe61ea5b41697a285e8ef5de6f2f9e6bd94
 *   Swapper (UniswapV3) : à déployer séparément
 */
export default buildModule("LSEModule", (m) => {

  const wethAddress    = m.getParameter<string>("wethAddress");
  const usdcAddress    = m.getParameter<string>("usdcAddress");
  const zyFAIAddress   = m.getParameter<string>("zyFAIAddress");
  const swapperAddress = m.getParameter<string>("swapperAddress");
  const wethPriceInUsdc = m.getParameter<bigint>("wethPriceInUsdc", 2000n * 10n ** 6n);

  const lse = m.contract("LSE", [
    wethAddress,
    usdcAddress,
    zyFAIAddress,
    swapperAddress,
    wethPriceInUsdc,
  ]);

  return { lse };
});
