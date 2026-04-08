// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ISwapper} from "../interfaces/ISwapper.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title MockSwapper
 * @dev Fixed-rate swap for tests (accounts for WETH/USDC decimal difference).
 *      WETH = 18 decimals, USDC = 6 decimals.
 *      Fixed rate: 1 WETH = 2000 USDC.
 */
contract MockSwapper is ISwapper {
    using SafeERC20 for IERC20;

    IERC20 public immutable weth;
    IERC20 public immutable usdc;

    uint256 public constant WETH_TO_USDC_RATE = 2000; // 1 WETH = 2000 USDC
    uint256 public constant WETH_DECIMALS = 1e18;
    uint256 public constant USDC_DECIMALS = 1e6;

    constructor(address _weth, address _usdc) {
        weth = IERC20(_weth);
        usdc = IERC20(_usdc);
    }

    /**
     * @dev Takes WETH, returns USDC at the fixed rate.
     *      MockSwapper must hold enough USDC.
     */
    function swapWETHtoUSDC(
        uint256 amountIn,
        uint256 minAmountOut
    ) external returns (uint256 amountOut) {
        amountOut = (amountIn * WETH_TO_USDC_RATE * USDC_DECIMALS) / WETH_DECIMALS;
        require(amountOut >= minAmountOut, "MockSwapper: slippage");
        weth.safeTransferFrom(msg.sender, address(this), amountIn);
        usdc.safeTransfer(msg.sender, amountOut);
    }

    /**
     * @dev Takes USDC, returns WETH at the fixed rate.
     *      MockSwapper must hold enough WETH.
     */
    function swapUSDCtoWETH(
        uint256 amountIn,
        uint256 minAmountOut
    ) external returns (uint256 amountOut) {
        amountOut = (amountIn * WETH_DECIMALS) / (WETH_TO_USDC_RATE * USDC_DECIMALS);
        require(amountOut >= minAmountOut, "MockSwapper: slippage");
        usdc.safeTransferFrom(msg.sender, address(this), amountIn);
        weth.safeTransfer(msg.sender, amountOut);
    }
}
