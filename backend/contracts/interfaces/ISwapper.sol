// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/**
 * @title ISwapper
 * @dev Abstraction interface for WETH <-> USDC swaps.
 *      Implementations: MockSwapper (tests) / UniswapV3Swapper (production)
 */
interface ISwapper {

    /**
     * @notice Swap WETH for USDC.
     * @param amountIn    Amount of WETH to swap (18 decimals)
     * @param minAmountOut Minimum USDC expected — reverts if not met (slippage protection)
     * @return amountOut  Amount of USDC received (6 decimals)
     */
    function swapWETHtoUSDC(
        uint256 amountIn,
        uint256 minAmountOut
    ) external returns (uint256 amountOut);

    /**
     * @notice Swap USDC for WETH.
     * @param amountIn    Amount of USDC to swap (6 decimals)
     * @param minAmountOut Minimum WETH expected — reverts if not met (slippage protection)
     * @return amountOut  Amount of WETH received (18 decimals)
     */
    function swapUSDCtoWETH(
        uint256 amountIn,
        uint256 minAmountOut
    ) external returns (uint256 amountOut);
}
