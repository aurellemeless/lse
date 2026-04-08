// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IZyFAI} from "./interfaces/IZyFAI.sol";
import {ISwapper} from "./interfaces/ISwapper.sol";

/**
 * @title LSE — Liquid Stock ETH
 * @notice Vault ERC-4626 / ERC-7540 sur Base.
 *         L'utilisateur dépose du WETH et reçoit des $LSE.
 *         Le WETH est swappé en USDC (Uniswap v3) puis déposé chez ZyFAI qui génère du yield.
 *         Le retrait est asynchrone (ERC-7540) : requestRedeem() puis claim() après ~60s.
 *
 * @dev Architecture "vault de vault" :
 *      User (WETH) → LSE.sol → swap WETH/USDC → ZyFAI SmartAccountWrapper (USDC)
 *
 *      Limitation MVP : totalAssets() utilise un taux WETH/USDC stocké (pas un oracle on-chain).
 *      À remplacer par Chainlink WETH/USDC en production.
 */
contract LSE is ERC4626, Ownable {
    using SafeERC20 for IERC20;

    // -------------------------------------------------------------------------
    // State
    // -------------------------------------------------------------------------

    IZyFAI public immutable zyFAI;
    ISwapper public swapper;         // remplaçable par owner (Mock → Uniswap)
    IERC20  public immutable usdc;

    // ERC-7540 : délégation de droits entre adresses
    mapping(address controller => mapping(address operator => bool)) public isOperator;

    // Suivi interne des demandes de retrait
    uint256 private _nextRequestId = 1;

    struct PendingRedeem {
        address controller;   // qui peut appeler claim()
        uint256 zyFaiShares;  // shares ZyFAI à réclamer
        bool    claimed;
    }
    mapping(uint256 requestId => PendingRedeem) public pendingRedeems;

    /**
     * @notice Taux WETH/USDC utilisé pour convertir la valeur ZyFAI (USDC) en WETH.
     *         Exprimé en USDC avec 6 décimales. Ex : 2000e6 = 1 WETH vaut 2000 USDC.
     *         Mettre à jour via setWethPrice() en production.
     */
    uint256 public wethPriceInUsdc;

    uint256 private constant WETH_UNIT = 1e18;

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------

    event RedeemRequest(
        address indexed controller,
        address indexed owner,
        uint256 indexed requestId,
        address sender,
        uint256 shares
    );
    event OperatorSet(address indexed controller, address indexed operator, bool approved);

    // -------------------------------------------------------------------------
    // Errors
    // -------------------------------------------------------------------------

    error UseRequestRedeem();
    error UseDeposit();
    error NotAuthorized();
    error ZeroAmount();
    error AlreadyClaimed();
    error NotClaimableYet();

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    /**
     * @param _weth            Adresse WETH (asset du vault)
     * @param _usdc            Adresse USDC (asset ZyFAI)
     * @param _zyFAI           Adresse du SmartAccountWrapper ZyFAI
     * @param _swapper         Adresse du swapper (MockSwapper ou UniswapV3Swapper)
     * @param _wethPriceInUsdc Taux initial WETH/USDC — ex : 2000e6
     */
    constructor(
        IERC20  _weth,
        IERC20  _usdc,
        IZyFAI  _zyFAI,
        ISwapper _swapper,
        uint256 _wethPriceInUsdc
    )
        ERC20("Liquid Stock ETH", "LSE")
        ERC4626(_weth)
        Ownable(msg.sender)
    {
        usdc            = _usdc;
        zyFAI           = _zyFAI;
        swapper         = _swapper;
        wethPriceInUsdc = _wethPriceInUsdc;
    }

    // -------------------------------------------------------------------------
    // ERC-4626 — dépôt (synchrone)
    // -------------------------------------------------------------------------

    /**
     * @notice Dépose du WETH, reçoit des $LSE.
     * @dev Flux : WETH → swap USDC → ZyFAI deposit → mint $LSE
     *      Les shares sont calculées AVANT le dépôt pour refléter le taux actuel.
     */
    function deposit(uint256 assets, address receiver) public override returns (uint256 shares) {
        if (assets == 0) revert ZeroAmount();

        // Calculer les shares sur l'état courant (avant modification du vault)
        shares = previewDeposit(assets);

        // 1. Récupérer le WETH de l'appelant
        IERC20(asset()).safeTransferFrom(msg.sender, address(this), assets);

        // 2. Swap WETH → USDC
        IERC20(asset()).forceApprove(address(swapper), assets);
        uint256 usdcAmount = swapper.swapWETHtoUSDC(assets, 0);

        // 3. Déposer l'USDC chez ZyFAI
        usdc.forceApprove(address(zyFAI), usdcAmount);
        zyFAI.deposit(usdcAmount, address(this));

        // 4. Minter les $LSE
        _mint(receiver, shares);

        emit Deposit(msg.sender, receiver, assets, shares);
    }

    /**
     * @dev mint() désactivé — utiliser deposit() uniquement.
     */
    function mint(uint256, address) public pure override returns (uint256) {
        revert UseDeposit();
    }

    // -------------------------------------------------------------------------
    // ERC-4626 — valeur du vault
    // -------------------------------------------------------------------------

    /**
     * @notice Valeur totale du vault exprimée en WETH.
     * @dev Lit la valeur USDC chez ZyFAI et la convertit via wethPriceInUsdc.
     *      Formule : usdcValue (6 dec) * 1e18 / wethPriceInUsdc (6 dec) = WETH (18 dec)
     */
    function totalAssets() public view override returns (uint256) {
        uint256 zyFaiShares = zyFAI.balanceOf(address(this));
        if (zyFaiShares == 0) return 0;
        uint256 usdcValue = zyFAI.convertToAssets(zyFaiShares);
        return (usdcValue * WETH_UNIT) / wethPriceInUsdc;
    }

    // -------------------------------------------------------------------------
    // ERC-4626 — retrait synchrone désactivé (ERC-7540 async obligatoire)
    // -------------------------------------------------------------------------

    function withdraw(uint256, address, address) public pure override returns (uint256) {
        revert UseRequestRedeem();
    }

    function redeem(uint256, address, address) public pure override returns (uint256) {
        revert UseRequestRedeem();
    }

    function previewRedeem(uint256) public pure override returns (uint256) {
        revert UseRequestRedeem();
    }

    function previewWithdraw(uint256) public pure override returns (uint256) {
        revert UseRequestRedeem();
    }

    // -------------------------------------------------------------------------
    // ERC-7540 — retrait asynchrone
    // -------------------------------------------------------------------------

    /**
     * @notice Étape 1 — Soumet une demande de retrait.
     *         Les $LSE sont brûlés immédiatement. ZyFAI traite la demande (~60s).
     *
     * @param shares     Nombre de $LSE à racheter
     * @param controller Adresse autorisée à appeler claim() pour cette demande
     * @param owner      Propriétaire des $LSE (msg.sender ou opérateur autorisé)
     * @return requestId À conserver pour appeler claim()
     */
    function requestRedeem(
        uint256 shares,
        address controller,
        address owner
    ) external returns (uint256 requestId) {
        if (shares == 0) revert ZeroAmount();
        if (owner != msg.sender && !isOperator[owner][msg.sender]) revert NotAuthorized();

        // Calculer les ZyFAI shares proportionnelles AVANT le burn
        uint256 supply = totalSupply();
        uint256 zyFaiSharesToRedeem = (shares * zyFAI.balanceOf(address(this))) / supply;

        // Brûler les $LSE de l'owner
        _burn(owner, shares);

        // Soumettre la demande à ZyFAI (LSE.sol est le controller côté ZyFAI)
        zyFAI.requestRedeem(zyFaiSharesToRedeem, address(this), address(this));

        // Enregistrer la demande avec notre propre requestId
        requestId = _nextRequestId++;
        pendingRedeems[requestId] = PendingRedeem({
            controller: controller,
            zyFaiShares: zyFaiSharesToRedeem,
            claimed: false
        });

        emit RedeemRequest(controller, owner, requestId, msg.sender, shares);
    }

    /**
     * @notice Étape 2 — Réclame le WETH une fois la demande traitée par ZyFAI.
     *
     * @param requestId    Identifiant retourné par requestRedeem()
     * @param receiver     Adresse qui reçoit le WETH
     * @return wethReceived Montant de WETH reçu
     *
     * @dev ⚠️ MVP : claimableRedeemRequest(0, ...) retourne le total claimable agrégé.
     *      En cas de multiples demandes simultanées, l'ordre FIFO de ZyFAI s'applique.
     */
    function claim(
        uint256 requestId,
        address receiver
    ) external returns (uint256 wethReceived) {
        PendingRedeem storage pending = pendingRedeems[requestId];

        if (pending.controller != msg.sender) revert NotAuthorized();
        if (pending.claimed) revert AlreadyClaimed();

        // Vérifier que ZyFAI a traité suffisamment de shares
        uint256 claimable = zyFAI.claimableRedeemRequest(0, address(this));
        if (claimable < pending.zyFaiShares) revert NotClaimableYet();

        // Marquer avant les appels externes (protection contre la reentrancy)
        pending.claimed = true;

        // Récupérer les USDC de ZyFAI
        uint256 usdcReceived = zyFAI.redeem(pending.zyFaiShares, address(this), address(this));

        // Swap USDC → WETH
        usdc.forceApprove(address(swapper), usdcReceived);
        wethReceived = swapper.swapUSDCtoWETH(usdcReceived, 0);

        // Envoyer le WETH au receiver
        IERC20(asset()).safeTransfer(receiver, wethReceived);
    }

    // -------------------------------------------------------------------------
    // ERC-7540 — opérateurs
    // -------------------------------------------------------------------------

    /**
     * @notice Autorise ou révoque un opérateur à agir au nom de msg.sender.
     */
    function setOperator(address operator, bool approved) external returns (bool) {
        isOperator[msg.sender][operator] = approved;
        emit OperatorSet(msg.sender, operator, approved);
        return true;
    }

    // -------------------------------------------------------------------------
    // ERC-165
    // -------------------------------------------------------------------------

    function supportsInterface(bytes4 interfaceId) public pure returns (bool) {
        return
            interfaceId == 0x620ee8e4 || // IERC7540Redeem
            interfaceId == 0xe3bc4e65;   // IERC7540Operator
    }

    // -------------------------------------------------------------------------
    // Admin
    // -------------------------------------------------------------------------

    /** @notice Remplace le swapper. Permet de passer de MockSwapper à UniswapV3Swapper. */
    function setSwapper(address _swapper) external onlyOwner {
        swapper = ISwapper(_swapper);
    }

    /** @notice Met à jour le taux WETH/USDC pour totalAssets(). Ex : 2000e6 = $2000/ETH. */
    function setWethPrice(uint256 _wethPriceInUsdc) external onlyOwner {
        wethPriceInUsdc = _wethPriceInUsdc;
    }
}
