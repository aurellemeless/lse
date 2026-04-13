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
 * @notice ERC-4626 / ERC-7540 vault on Base.
 *         Users deposit WETH and receive $LSE shares.
 *         WETH is swapped to USDC (Uniswap v3) and deposited into ZyFAI for yield.
 *         Withdrawals are asynchronous (ERC-7540): requestRedeem() then claim() after ~60s.
 *
 * @dev "Vault of vault" architecture:
 *      User (WETH) → LSE.sol → swap WETH/USDC → ZyFAI SmartAccountWrapper (USDC)
 *
 *      MVP limitation: totalAssets() uses a stored WETH/USDC rate instead of an on-chain oracle.
 *      Replace with a Chainlink WETH/USDC feed in production.
 */
contract LSE is ERC4626, Ownable {
    using SafeERC20 for IERC20;

    // -------------------------------------------------------------------------
    // State
    // -------------------------------------------------------------------------

    IZyFAI public immutable zyFAI;
    ISwapper public swapper;         // replaceable by owner (Mock → Uniswap)
    IERC20  public immutable usdc;
    IERC20  public immutable weth;

    // ERC-7540: operator delegation
    mapping(address controller => mapping(address operator => bool)) public isOperator;

    // Internal redeem request tracking
    uint256 private _nextRequestId = 1;

    struct PendingRedeem {
        address controller;   // address allowed to call claim()
        uint256 zyFaiShares;  // ZyFAI shares to claim
        bool    claimed;
    }
    mapping(uint256 requestId => PendingRedeem) public pendingRedeems;

    /**
     * @notice WETH/USDC rate used to convert ZyFAI value (USDC) back to WETH.
     *         Expressed in USDC with 6 decimals. e.g. 2000e6 = 1 WETH worth 2000 USDC.
     *         Update via setWethPrice() as the market rate changes.
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
     * @param _weth            WETH token address (vault asset)
     * @param _usdc            USDC token address (ZyFAI asset)
     * @param _zyFAI           ZyFAI SmartAccountWrapper address
     * @param _swapper         Swapper address (MockSwapper or UniswapV3Swapper)
     * @param _wethPriceInUsdc Initial WETH/USDC rate — e.g. 2000e6
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
        weth = _weth;
        usdc            = _usdc;
        zyFAI           = _zyFAI;
        swapper         = _swapper;
        wethPriceInUsdc = _wethPriceInUsdc;



        usdc.forceApprove(address(zyFAI), type(uint256).max);
        weth.forceApprove(address(swapper), type(uint256).max);
    }

    // -------------------------------------------------------------------------
    // ERC-4626 — deposit (synchronous)
    // -------------------------------------------------------------------------

    /**
     * @notice Deposit WETH, receive $LSE shares.
     * @dev Flow: WETH → swap to USDC → ZyFAI deposit → mint $LSE
     *      Shares are computed BEFORE the deposit to reflect the current exchange rate.
     */
    function deposit(uint256 assets, address receiver) public override returns (uint256 shares) {
        if (assets == 0) revert ZeroAmount();

        // Compute shares against current vault state (before deposit)
        shares = previewDeposit(assets);

        // 1. Pull WETH from caller
        IERC20(asset()).safeTransferFrom(msg.sender, address(this), assets);

        // 2. Swap WETH → USDC
        uint256 usdcAmount = swapper.swapWETHtoUSDC(assets, 0);

        // 3. Deposit USDC into ZyFAI
        zyFAI.deposit(usdcAmount, address(this));

        // 4. Mint $LSE to receiver
        _mint(receiver, shares);

        emit Deposit(msg.sender, receiver, assets, shares);
    }

    /**
     * @dev mint() disabled — use deposit() only.
     */
    function mint(uint256, address) public pure override returns (uint256) {
        revert UseDeposit();
    }

    // -------------------------------------------------------------------------
    // ERC-4626 — vault value
    // -------------------------------------------------------------------------

    /**
     * @notice Total vault value expressed in WETH.
     * @dev Reads USDC value from ZyFAI and converts via wethPriceInUsdc.
     *      Formula: usdcValue (6 dec) * 1e18 / wethPriceInUsdc (6 dec) = WETH (18 dec)
     */
    function totalAssets() public view override returns (uint256) {
        uint256 zyFaiShares = zyFAI.balanceOf(address(this));
        if (zyFaiShares == 0) return 0;
        uint256 usdcValue = zyFAI.convertToAssets(zyFaiShares);
        return (usdcValue * WETH_UNIT) / wethPriceInUsdc;
    }

    // -------------------------------------------------------------------------
    // ERC-4626 — synchronous withdrawal disabled (ERC-7540 async required)
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
    // ERC-7540 — asynchronous withdrawal
    // -------------------------------------------------------------------------

    /**
     * @notice Step 1 — Submit a redemption request.
     *         $LSE shares are burned immediately. ZyFAI processes the request (~60s).
     *
     * @param shares     Number of $LSE shares to redeem
     * @param controller Address allowed to call claim() for this request
     * @param owner      $LSE holder (msg.sender or an authorized operator)
     * @return requestId Must be kept to call claim()
     */
    function requestRedeem(
        uint256 shares,
        address controller,
        address owner
    ) external returns (uint256 requestId) {
        if (shares == 0) revert ZeroAmount();
        if (owner != msg.sender && !isOperator[owner][msg.sender]) revert NotAuthorized();

        // Compute proportional ZyFAI shares BEFORE burning
        uint256 supply = totalSupply();
        uint256 zyFaiSharesToRedeem = (shares * zyFAI.balanceOf(address(this))) / supply;

        // Burn $LSE from owner
        _burn(owner, shares);

        // Submit request to ZyFAI (LSE.sol acts as the ZyFAI-side controller)
        zyFAI.requestRedeem(zyFaiSharesToRedeem, address(this), address(this));

        // Register the request under our own requestId
        requestId = _nextRequestId++;
        pendingRedeems[requestId] = PendingRedeem({
            controller: controller,
            zyFaiShares: zyFaiSharesToRedeem,
            claimed: false
        });

        emit RedeemRequest(controller, owner, requestId, msg.sender, shares);
    }

    /**
     * @notice Step 2 — Claim WETH once ZyFAI has processed the request.
     *
     * @param requestId    Identifier returned by requestRedeem()
     * @param receiver     Address that receives the WETH
     * @return wethReceived Amount of WETH received
     *
     * @dev MVP note: claimableRedeemRequest(0, ...) returns the aggregated claimable total.
     *      With multiple concurrent requests, ZyFAI's FIFO ordering applies.
     */
    function claim(
        uint256 requestId,
        address receiver
    ) external returns (uint256 wethReceived) {
        PendingRedeem storage pending = pendingRedeems[requestId];

        if (pending.controller != msg.sender) revert NotAuthorized();
        if (pending.claimed) revert AlreadyClaimed();

        // Check that ZyFAI has processed enough shares
        uint256 claimable = zyFAI.claimableRedeemRequest(0, address(this));
        if (claimable < pending.zyFaiShares) revert NotClaimableYet();

        // Mark as claimed before external calls (reentrancy guard)
        pending.claimed = true;

        // Retrieve USDC from ZyFAI
        uint256 usdcReceived = zyFAI.redeem(pending.zyFaiShares, address(this), address(this));

        // Swap USDC → WETH
        usdc.forceApprove(address(swapper), usdcReceived);
        wethReceived = swapper.swapUSDCtoWETH(usdcReceived, 0);

        // Transfer WETH to receiver
        IERC20(asset()).safeTransfer(receiver, wethReceived);
    }

    // -------------------------------------------------------------------------
    // ERC-7540 — operators
    // -------------------------------------------------------------------------

    /**
     * @notice Grant or revoke an operator's right to act on behalf of msg.sender.
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

    /** @notice Replace the swapper. Used to upgrade from MockSwapper to UniswapV3Swapper. */
    function setSwapper(address _swapper) external onlyOwner {
        // Revoke allowance on the old swapper to avoid leaving stale approvals.
        weth.forceApprove(address(swapper), 0);
        swapper = ISwapper(_swapper);
        // Grant allowance to the new swapper.
        weth.forceApprove(_swapper, type(uint256).max);
    }

    /** @notice Update the WETH/USDC rate for totalAssets(). e.g. 2000e6 = $2000/ETH. */
    function setWethPrice(uint256 _wethPriceInUsdc) external onlyOwner {
        wethPriceInUsdc = _wethPriceInUsdc;
    }
}
