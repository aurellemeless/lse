// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/**
 * @title ISwapper
 * @dev Interface d'abstraction du swap WETH <-> USDC.
 * Implémentations : MockSwapper (tests) / UniswapV3Swapper (production)
 */
interface ISwapper {

    /**
     * @notice Échange du WETH contre de l'USDC.
     * @param amountIn Montant de WETH à échanger (18 décimales)
     * @param minAmountOut Montant minimum d'USDC attendu — revert si non atteint (slippage)
     * @return amountOut Montant d'USDC reçu (6 décimales)
     */
    function swapWETHtoUSDC(
        uint256 amountIn,
        uint256 minAmountOut
    ) external returns (uint256 amountOut);

    /**
     * @notice Échange de l'USDC contre du WETH.
     * @param amountIn Montant d'USDC à échanger (6 décimales)
     * @param minAmountOut Montant minimum de WETH attendu — revert si non atteint (slippage)
     * @return amountOut Montant de WETH reçu (18 décimales)
     */
    function swapUSDCtoWETH(
        uint256 amountIn,
        uint256 minAmountOut
    ) external returns (uint256 amountOut);
}
