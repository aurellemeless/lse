// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IZyFAI} from "../interfaces/IZyFAI.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title MockZyFAI
 * @dev Simulates the ZyFAI SmartAccountWrapper for tests.
 *      Asset = WETH (18 decimals).
 *
 *      Initial share/asset ratio is 1:1.
 *      Yield can be simulated via simulateYield() — adds WETH without minting shares.
 *
 *      Async behaviour (requestId = 0, aggregated like the real ZyFAI):
 *        1. requestRedeem()  → adds shares to the controller's pending bucket
 *        2. fulfillAll()     → [test helper] moves all pending to claimable
 *        3. claimableRedeemRequest(0, controller) → returns total claimable shares
 *        4. redeem()         → transfers WETH, deducts from claimable
 */
contract MockZyFAI is IZyFAI {
    using SafeERC20 for IERC20;

    IERC20 public immutable weth;

    // Internal share accounting per address
    mapping(address => uint256) private _shares;
    uint256 private _totalShares;

    // Aggregated async request buckets per controller (requestId = 0 in real ZyFAI)
    mapping(address => uint256) public pendingShares;
    mapping(address => uint256) public claimableShares;

    constructor(address _weth) {
        weth = IERC20(_weth);
    }

    // -------------------------------------------------------------------------
    // IZyFAI — deposit
    // -------------------------------------------------------------------------

    function deposit(uint256 assets, address receiver) external returns (uint256 shares) {
        shares = convertToShares(assets);
        weth.safeTransferFrom(msg.sender, address(this), assets);
        _shares[receiver] += shares;
        _totalShares += shares;
    }

    // -------------------------------------------------------------------------
    // IZyFAI — read
    // -------------------------------------------------------------------------

    function totalAssets() external view returns (uint256) {
        return weth.balanceOf(address(this));
    }

    function convertToAssets(uint256 shares) public view returns (uint256) {
        if (_totalShares == 0) return shares;
        return (shares * weth.balanceOf(address(this))) / _totalShares;
    }

    function convertToShares(uint256 assets) public view returns (uint256) {
        uint256 balance = weth.balanceOf(address(this));
        if (_totalShares == 0 || balance == 0) return assets;
        return (assets * _totalShares) / balance;
    }

    function balanceOf(address account) external view returns (uint256) {
        return _shares[account];
    }

    // -------------------------------------------------------------------------
    // IZyFAI — asynchronous withdrawal
    // -------------------------------------------------------------------------

    function requestRedeem(
        uint256 shares,
        address controller,
        address owner
    ) external returns (uint256 requestId) {
        require(_shares[owner] >= shares, "MockZyFAI: insufficient shares");
        _shares[owner] -= shares;
        _totalShares   -= shares;
        pendingShares[controller] += shares;
        requestId = 0; // ZyFAI aggregates all requests under requestId = 0
    }

    /**
     * @notice requestId ignored — returns aggregated pending shares for the controller.
     */
    function pendingRedeemRequest(
        uint256 /*requestId*/,
        address controller
    ) external view returns (uint256) {
        return pendingShares[controller];
    }

    /**
     * @notice requestId ignored — returns aggregated claimable shares for the controller.
     */
    function claimableRedeemRequest(
        uint256 /*requestId*/,
        address controller
    ) external view returns (uint256) {
        return claimableShares[controller];
    }

    function redeem(
        uint256 shares,
        address receiver,
        address controller
    ) external returns (uint256 assets) {
        require(claimableShares[controller] >= shares, "MockZyFAI: not claimable");
        assets = convertToAssets(shares);
        claimableShares[controller] -= shares;
        weth.safeTransfer(receiver, assets);
    }

    // -------------------------------------------------------------------------
    // Test helpers
    // -------------------------------------------------------------------------

    /**
     * @notice Simulate ZyFAI processing: move all pending shares to claimable.
     *         Equivalent to waiting ~60s on the real network.
     */
    function fulfillAll(address controller) external {
        claimableShares[controller] += pendingShares[controller];
        pendingShares[controller] = 0;
    }

    /**
     * @notice Simulate yield: add WETH without minting shares.
     *         Effect: convertToAssets() increases → $LSE is worth more WETH.
     */
    function simulateYield(uint256 wethAmount) external {
        weth.safeTransferFrom(msg.sender, address(this), wethAmount);
    }
}
