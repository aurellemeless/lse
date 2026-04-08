// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/**
 * @title IZyFAI
 * @dev Interface du SmartAccountWrapper ZyFAI (ERC-7540 async vault, asset = USDC)
 * Adresse Base Mainnet : 0x29d6fbe61ea5b41697a285e8ef5de6f2f9e6bd94
 */
interface IZyFAI {

    // -------------------------------------------------------------------------
    // ERC-4626 — dépôt synchrone
    // -------------------------------------------------------------------------

    /**
     * @notice Dépose des USDC dans ZyFAI, reçoit des shares en retour.
     * @param assets Montant d'USDC à déposer
     * @param receiver Adresse qui reçoit les shares
     * @return shares Nombre de shares mintées
     */
    function deposit(uint256 assets, address receiver) external returns (uint256 shares);

    /**
     * @notice Valeur totale des actifs gérés par ZyFAI (en USDC).
     */
    function totalAssets() external view returns (uint256);

    /**
     * @notice Convertit un montant de shares en USDC au taux actuel.
     */
    function convertToAssets(uint256 shares) external view returns (uint256);

    /**
     * @notice Convertit un montant d'USDC en shares au taux actuel.
     */
    function convertToShares(uint256 assets) external view returns (uint256);

    /**
     * @notice Balance de shares ZyFAI d'une adresse.
     */
    function balanceOf(address account) external view returns (uint256);

    // -------------------------------------------------------------------------
    // ERC-7540 — retrait asynchrone
    // -------------------------------------------------------------------------

    /**
     * @notice Étape 1 du retrait : soumet une demande de rachat.
     * Les shares sont bloquées immédiatement. ZyFAI traite la demande (~60s).
     * @param shares Nombre de shares à racheter
     * @param controller Adresse qui pourra réclamer le retrait
     * @param owner Adresse propriétaire des shares (doit avoir approuvé si différent de msg.sender)
     * @return requestId Identifiant de la demande, à conserver pour le claim
     */
    function requestRedeem(
        uint256 shares,
        address controller,
        address owner
    ) external returns (uint256 requestId);

    /**
     * @notice Montant de shares en attente de traitement pour un requestId donné.
     */
    function pendingRedeemRequest(
        uint256 requestId,
        address controller
    ) external view returns (uint256 shares);

    /**
     * @notice Montant de shares prêtes à être réclamées pour un requestId donné.
     */
    function claimableRedeemRequest(
        uint256 requestId,
        address controller
    ) external view returns (uint256 shares);

    /**
     * @notice Étape 2 du retrait : réclame les USDC une fois la demande traitée.
     * @param shares Nombre de shares à racheter (doit correspondre au claimable)
     * @param receiver Adresse qui reçoit les USDC
     * @param controller Controller associé au requestId
     * @return assets Montant d'USDC reçu
     */
    function redeem(
        uint256 shares,
        address receiver,
        address controller
    ) external returns (uint256 assets);
}
