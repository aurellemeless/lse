// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {MockERC20} from "./MockERC20.sol";

/**
 * @dev Minimal WETH mock for tests — adds deposit() payable on top of MockERC20.
 */
contract MockWETH is MockERC20 {
    constructor() MockERC20("Wrapped Ether", "WETH", 18) {}

    /// @notice Wrap native ETH → WETH (mints to msg.sender).
    function deposit() external payable {
        _mint(msg.sender, msg.value);
    }
}
