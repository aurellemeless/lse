// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/**
 * @title IZyFAI
 * @dev Interface for the ZyFAI SmartAccountWrapper (ERC-7540 async vault, asset = USDC).
 *      Base Mainnet address: 0x29d6fbe61ea5b41697a285e8ef5de6f2f9e6bd94
 */
interface IZyFAI {

    // -------------------------------------------------------------------------
    // ERC-4626 — synchronous deposit
    // -------------------------------------------------------------------------

    /**
     * @notice Deposit USDC into ZyFAI, receive shares in return.
     * @param assets Amount of USDC to deposit
     * @param receiver Address that receives the shares
     * @return shares Number of shares minted
     */
    function deposit(uint256 assets, address receiver) external returns (uint256 shares);

    /**
     * @notice Total value of assets managed by ZyFAI (in USDC).
     */
    function totalAssets() external view returns (uint256);

    /**
     * @notice Convert a share amount to USDC at the current exchange rate.
     */
    function convertToAssets(uint256 shares) external view returns (uint256);

    /**
     * @notice Convert a USDC amount to shares at the current exchange rate.
     */
    function convertToShares(uint256 assets) external view returns (uint256);

    /**
     * @notice ZyFAI share balance of an address.
     */
    function balanceOf(address account) external view returns (uint256);

    // -------------------------------------------------------------------------
    // ERC-7540 — asynchronous withdrawal
    // -------------------------------------------------------------------------

    /**
     * @notice Step 1 of withdrawal: submit a redemption request.
     *         Shares are locked immediately. ZyFAI processes the request (~60s).
     * @param shares     Number of shares to redeem
     * @param controller Address that will be allowed to claim the withdrawal
     * @param owner      Share owner (must have approved if different from msg.sender)
     * @return requestId Request identifier — must be kept for the claim step
     */
    function requestRedeem(
        uint256 shares,
        address controller,
        address owner
    ) external returns (uint256 requestId);

    /**
     * @notice Amount of shares pending processing for a given requestId.
     */
    function pendingRedeemRequest(
        uint256 requestId,
        address controller
    ) external view returns (uint256 shares);

    /**
     * @notice Amount of shares ready to be claimed for a given requestId.
     */
    function claimableRedeemRequest(
        uint256 requestId,
        address controller
    ) external view returns (uint256 shares);

    /**
     * @notice Step 2 of withdrawal: claim USDC once the request has been processed.
     * @param shares     Number of shares to redeem (must match the claimable amount)
     * @param receiver   Address that receives the USDC
     * @param controller Controller associated with the requestId
     * @return assets    Amount of USDC received
     */
    function redeem(
        uint256 shares,
        address receiver,
        address controller
    ) external returns (uint256 assets);
}
