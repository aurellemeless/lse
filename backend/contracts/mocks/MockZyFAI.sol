// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IZyFAI} from "../interfaces/IZyFAI.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title MockZyFAI
 * @dev Simule le SmartAccountWrapper ZyFAI pour les tests.
 *
 *      Ratio shares/assets = 1:1 au départ.
 *      Yield simulé via simulateYield() — ajoute de l'USDC sans minter de shares.
 *
 *      Comportement async (requestId = 0, agrégé comme le vrai ZyFAI) :
 *        1. requestRedeem()  → ajoute dans "pending" du controller
 *        2. fulfillAll()     → [test helper] déplace tout en "claimable"
 *        3. claimableRedeemRequest(0, controller) → retourne le total claimable
 *        4. redeem()         → donne l'USDC, soustrait du claimable
 */
contract MockZyFAI is IZyFAI {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdc;

    // Shares internes par adresse
    mapping(address => uint256) private _shares;
    uint256 private _totalShares;

    // Demandes async agrégées par controller (requestId = 0 dans ZyFAI réel)
    mapping(address => uint256) public pendingShares;
    mapping(address => uint256) public claimableShares;

    constructor(address _usdc) {
        usdc = IERC20(_usdc);
    }

    // -------------------------------------------------------------------------
    // IZyFAI — dépôt
    // -------------------------------------------------------------------------

    function deposit(uint256 assets, address receiver) external returns (uint256 shares) {
        shares = convertToShares(assets);
        usdc.safeTransferFrom(msg.sender, address(this), assets);
        _shares[receiver] += shares;
        _totalShares += shares;
    }

    // -------------------------------------------------------------------------
    // IZyFAI — lecture
    // -------------------------------------------------------------------------

    function totalAssets() external view returns (uint256) {
        return usdc.balanceOf(address(this));
    }

    function convertToAssets(uint256 shares) public view returns (uint256) {
        if (_totalShares == 0) return shares;
        return (shares * usdc.balanceOf(address(this))) / _totalShares;
    }

    function convertToShares(uint256 assets) public view returns (uint256) {
        uint256 balance = usdc.balanceOf(address(this));
        if (_totalShares == 0 || balance == 0) return assets;
        return (assets * _totalShares) / balance;
    }

    function balanceOf(address account) external view returns (uint256) {
        return _shares[account];
    }

    // -------------------------------------------------------------------------
    // IZyFAI — retrait asynchrone
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
        requestId = 0; // ZyFAI agrège tout sous requestId = 0
    }

    /**
     * @notice requestId ignoré — retourne les shares pending agrégées du controller.
     */
    function pendingRedeemRequest(
        uint256 /*requestId*/,
        address controller
    ) external view returns (uint256) {
        return pendingShares[controller];
    }

    /**
     * @notice requestId ignoré — retourne les shares claimables agrégées du controller.
     *         LSE.sol appelle toujours avec requestId = 0.
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
        usdc.safeTransfer(receiver, assets);
    }

    // -------------------------------------------------------------------------
    // Helpers de test
    // -------------------------------------------------------------------------

    /**
     * @notice Simule le traitement ZyFAI : déplace tout le pending en claimable.
     * Équivaut à attendre ~60s sur le vrai réseau.
     */
    function fulfillAll(address controller) external {
        claimableShares[controller] += pendingShares[controller];
        pendingShares[controller] = 0;
    }

    /**
     * @notice Simule du yield : ajoute de l'USDC sans minter de shares.
     * Résultat : convertToAssets() augmente → $LSE vaut plus de WETH.
     */
    function simulateYield(uint256 usdcAmount) external {
        usdc.safeTransferFrom(msg.sender, address(this), usdcAmount);
    }
}
