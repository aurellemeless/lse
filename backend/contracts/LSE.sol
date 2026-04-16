// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IZyFAI} from "./interfaces/IZyFAI.sol";

interface IWETH is IERC20 {
    function deposit() external payable;
}

/**
 * @title LSE — Liquid Stock ETH
 * @notice ERC-4626 / ERC-7540 vault on Base.
 *         Users deposit WETH (or native ETH via depositETH) and receive $LSE shares.
 *         WETH is deposited directly into ZyFAI for yield generation.
 *         Withdrawals are asynchronous (ERC-7540): requestRedeem() then claim() after ~60s.
 *
 * @dev Requires a ZyFAI instance with asset = WETH.
 *      Base Mainnet ZyFAI WETH address: TBD
 */
contract LSE is ERC4626, Ownable {
    using SafeERC20 for IERC20;

    // -------------------------------------------------------------------------
    // State
    // -------------------------------------------------------------------------

    IZyFAI public immutable zyFAI;
    IWETH  public immutable weth;

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
     * @param _weth  WETH token address — must match ZyFAI's asset
     * @param _zyFAI ZyFAI SmartAccountWrapper address (asset = WETH)
     */
    constructor(IWETH _weth, IZyFAI _zyFAI)
        ERC20("Liquid Stock ETH", "LSE")
        ERC4626(_weth)
        Ownable(msg.sender)
    {
        weth  = _weth;
        zyFAI = _zyFAI;
        IERC20(address(_weth)).forceApprove(address(_zyFAI), type(uint256).max);
    }

    // -------------------------------------------------------------------------
    // ERC-4626 — deposit (synchronous)
    // -------------------------------------------------------------------------

    /**
     * @notice Deposit WETH, receive $LSE shares.
     * @dev Flow: pull WETH from caller → ZyFAI.deposit → mint $LSE
     */
    function deposit(uint256 assets, address receiver) public override returns (uint256 shares) {
        if (assets == 0) revert ZeroAmount();
        shares = previewDeposit(assets);
        IERC20(asset()).safeTransferFrom(msg.sender, address(this), assets);
        zyFAI.deposit(assets, address(this));
        _mint(receiver, shares);
        emit Deposit(msg.sender, receiver, assets, shares);
    }

    /**
     * @notice Deposit native ETH, receive $LSE shares.
     * @dev Wraps ETH to WETH internally — the caller never needs to hold WETH.
     *      Flow: wrap ETH → WETH → ZyFAI.deposit → mint $LSE
     */
    function depositETH(address receiver) external payable returns (uint256 shares) {
        if (msg.value == 0) revert ZeroAmount();
        shares = previewDeposit(msg.value);
        weth.deposit{ value: msg.value }();
        zyFAI.deposit(msg.value, address(this));
        _mint(receiver, shares);
        emit Deposit(msg.sender, receiver, msg.value, shares);
    }

    /**
     * @dev mint() disabled — use deposit() or depositETH() only.
     */
    function mint(uint256, address) public pure override returns (uint256) {
        revert UseDeposit();
    }

    // -------------------------------------------------------------------------
    // ERC-4626 — vault value
    // -------------------------------------------------------------------------

    /**
     * @notice Total vault value expressed in WETH.
     * @dev Reads directly from ZyFAI — no conversion needed since asset = WETH.
     */
    function totalAssets() public view override returns (uint256) {
        uint256 zyFaiShares = zyFAI.balanceOf(address(this));
        if (zyFaiShares == 0) return 0;
        return zyFAI.convertToAssets(zyFaiShares);
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

        uint256 supply = totalSupply();
        uint256 zyFaiSharesToRedeem = (shares * zyFAI.balanceOf(address(this))) / supply;

        _burn(owner, shares);
        zyFAI.requestRedeem(zyFaiSharesToRedeem, address(this), address(this));

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
     *         ZyFAI transfers WETH directly to receiver.
     *
     * @param requestId    Identifier returned by requestRedeem()
     * @param receiver     Address that receives the WETH
     * @return wethReceived Amount of WETH received
     */
    function claim(
        uint256 requestId,
        address receiver
    ) external returns (uint256 wethReceived) {
        PendingRedeem storage pending = pendingRedeems[requestId];

        if (pending.controller != msg.sender) revert NotAuthorized();
        if (pending.claimed) revert AlreadyClaimed();

        uint256 claimable = zyFAI.claimableRedeemRequest(0, address(this));
        if (claimable < pending.zyFaiShares) revert NotClaimableYet();

        pending.claimed = true;

        // ZyFAI transfers WETH directly to receiver
        wethReceived = zyFAI.redeem(pending.zyFaiShares, receiver, address(this));
    }

    // -------------------------------------------------------------------------
    // ERC-7540 — operators
    // -------------------------------------------------------------------------

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
}
