import hre from "hardhat";
import { expect } from "chai";

// ─────────────────────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────────────────────
const WETH_PRICE_IN_USDC = 2000n * 10n ** 6n; // 1 WETH = 2000 USDC

const toWETH = (n: number) => BigInt(n) * 10n ** 18n;
const toUSDC = (n: number) => BigInt(n) * 10n ** 6n;

// ─────────────────────────────────────────────────────────────────────────────
// Déploiement partagé (réexécuté avant chaque test)
// ─────────────────────────────────────────────────────────────────────────────
async function deploy() {
  const { ethers } = await hre.network.connect();
  const [owner, alice, bob] = await ethers.getSigners();

  const weth    = await ethers.deployContract("MockERC20", ["Wrapped Ether", "WETH", 18]);
  const usdc    = await ethers.deployContract("MockERC20", ["USD Coin",      "USDC", 6]);
  const zyFAI   = await ethers.deployContract("MockZyFAI",  [await usdc.getAddress()]);
  const swapper = await ethers.deployContract("MockSwapper", [
    await weth.getAddress(),
    await usdc.getAddress(),
  ]);
  const lse = await ethers.deployContract("LSE", [
    await weth.getAddress(),
    await usdc.getAddress(),
    await zyFAI.getAddress(),
    await swapper.getAddress(),
    WETH_PRICE_IN_USDC,
  ]);

  // Approvisionner le MockSwapper pour qu'il puisse exécuter les swaps
  await weth.mint(await swapper.getAddress(), toWETH(1000));
  await usdc.mint(await swapper.getAddress(), toUSDC(2_000_000));

  return { ethers, lse, weth, usdc, zyFAI, swapper, owner, alice, bob };
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────
describe("LSE", () => {

  // ───────────────────────────────────────────────────────────────────────────
  describe("Déploiement", () => {

    it("nom et symbole corrects", async () => {
      const { lse } = await deploy();
      expect(await lse.name()).to.equal("Liquid Stock ETH");
      expect(await lse.symbol()).to.equal("LSE");
    });

    it("asset = WETH", async () => {
      const { lse, weth } = await deploy();
      expect(await lse.asset()).to.equal(await weth.getAddress());
    });

    it("totalAssets = 0 au départ", async () => {
      const { lse } = await deploy();
      expect(await lse.totalAssets()).to.equal(0n);
    });

  });

  // ───────────────────────────────────────────────────────────────────────────
  describe("deposit()", () => {

    it("transfert WETH → mint $LSE", async () => {
      const { lse, weth, alice } = await deploy();

      await weth.mint(alice.address, toWETH(1));
      await weth.connect(alice).approve(await lse.getAddress(), toWETH(1));
      await lse.connect(alice).deposit(toWETH(1), alice.address);

      expect(await lse.balanceOf(alice.address)).to.be.gt(0n);
    });

    it("totalAssets reflète la valeur déposée", async () => {
      const { lse, weth, alice } = await deploy();

      await weth.mint(alice.address, toWETH(1));
      await weth.connect(alice).approve(await lse.getAddress(), toWETH(1));
      await lse.connect(alice).deposit(toWETH(1), alice.address);

      // 1 WETH → swap → 2000 USDC chez ZyFAI → totalAssets = 1 WETH
      expect(await lse.totalAssets()).to.equal(toWETH(1));
    });

    it("deux dépôts égaux → même nombre de shares", async () => {
      const { lse, weth, alice, bob } = await deploy();

      await weth.mint(alice.address, toWETH(1));
      await weth.mint(bob.address,   toWETH(1));
      await weth.connect(alice).approve(await lse.getAddress(), toWETH(1));
      await weth.connect(bob).approve(await lse.getAddress(),   toWETH(1));

      await lse.connect(alice).deposit(toWETH(1), alice.address);
      await lse.connect(bob).deposit(toWETH(1),   bob.address);

      expect(await lse.balanceOf(alice.address)).to.equal(await lse.balanceOf(bob.address));
    });

    it("revert si amount = 0", async () => {
      const { lse, alice } = await deploy();
      await expect(
        lse.connect(alice).deposit(0n, alice.address)
      ).to.be.revertedWithCustomError(lse, "ZeroAmount");
    });

    it("revert si pas d'allowance WETH", async () => {
      const { ethers, lse, weth, alice } = await deploy();
      await weth.mint(alice.address, toWETH(1));
      await expect(
        lse.connect(alice).deposit(toWETH(1), alice.address)
      ).to.revert(ethers);
    });

  });

  // ───────────────────────────────────────────────────────────────────────────
  describe("Retrait synchrone désactivé", () => {

    it("withdraw() revert", async () => {
      const { lse, alice } = await deploy();
      await expect(
        lse.connect(alice).withdraw(1n, alice.address, alice.address)
      ).to.be.revertedWithCustomError(lse, "UseRequestRedeem");
    });

    it("redeem() revert", async () => {
      const { lse, alice } = await deploy();
      await expect(
        lse.connect(alice).redeem(1n, alice.address, alice.address)
      ).to.be.revertedWithCustomError(lse, "UseRequestRedeem");
    });

  });

  // ───────────────────────────────────────────────────────────────────────────
  describe("requestRedeem()", () => {

    async function depositSetup() {
      const ctx = await deploy();
      const { lse, weth, alice } = ctx;
      await weth.mint(alice.address, toWETH(1));
      await weth.connect(alice).approve(await lse.getAddress(), toWETH(1));
      await lse.connect(alice).deposit(toWETH(1), alice.address);
      return ctx;
    }

    it("brûle les $LSE et émet RedeemRequest", async () => {
      const { lse, alice } = await depositSetup();
      const sharesBefore = await lse.balanceOf(alice.address);

      const tx = await lse.connect(alice).requestRedeem(sharesBefore, alice.address, alice.address);

      expect(await lse.balanceOf(alice.address)).to.equal(0n);
      await expect(tx).to.emit(lse, "RedeemRequest").withArgs(
        alice.address, alice.address, 1n, alice.address, sharesBefore
      );
    });

    it("revert si shares = 0", async () => {
      const { lse, alice } = await depositSetup();
      await expect(
        lse.connect(alice).requestRedeem(0n, alice.address, alice.address)
      ).to.be.revertedWithCustomError(lse, "ZeroAmount");
    });

    it("revert si balance insuffisante", async () => {
      const { ethers, lse, alice } = await depositSetup();
      const balance = await lse.balanceOf(alice.address);
      await expect(
        lse.connect(alice).requestRedeem(balance + 1n, alice.address, alice.address)
      ).to.revert(ethers);
    });

    it("revert si appelé par un non-autorisé", async () => {
      const { lse, alice, bob } = await depositSetup();
      const balance = await lse.balanceOf(alice.address);
      await expect(
        lse.connect(bob).requestRedeem(balance, alice.address, alice.address)
      ).to.be.revertedWithCustomError(lse, "NotAuthorized");
    });

  });

  // ───────────────────────────────────────────────────────────────────────────
  describe("claim()", () => {

    async function requestSetup() {
      const ctx = await deploy();
      const { lse, weth, alice } = ctx;
      await weth.mint(alice.address, toWETH(1));
      await weth.connect(alice).approve(await lse.getAddress(), toWETH(1));
      await lse.connect(alice).deposit(toWETH(1), alice.address);
      const shares = await lse.balanceOf(alice.address);
      await lse.connect(alice).requestRedeem(shares, alice.address, alice.address);
      return ctx;
    }

    it("revert si ZyFAI n'a pas encore traité la demande", async () => {
      const { lse, alice } = await requestSetup();
      await expect(
        lse.connect(alice).claim(1n, alice.address)
      ).to.be.revertedWithCustomError(lse, "NotClaimableYet");
    });

    it("transfère du WETH après fulfillAll()", async () => {
      const { lse, weth, alice, zyFAI } = await requestSetup();
      const wethBefore = await weth.balanceOf(alice.address);

      await zyFAI.fulfillAll(await lse.getAddress());
      await lse.connect(alice).claim(1n, alice.address);

      expect(await weth.balanceOf(alice.address)).to.be.gt(wethBefore);
    });

    it("récupère l'intégralité du WETH déposé (sans yield)", async () => {
      const { lse, weth, alice, zyFAI } = await requestSetup();

      await zyFAI.fulfillAll(await lse.getAddress());
      await lse.connect(alice).claim(1n, alice.address);

      expect(await weth.balanceOf(alice.address)).to.equal(toWETH(1));
    });

    it("revert si double claim", async () => {
      const { lse, alice, zyFAI } = await requestSetup();

      await zyFAI.fulfillAll(await lse.getAddress());
      await lse.connect(alice).claim(1n, alice.address);

      await expect(
        lse.connect(alice).claim(1n, alice.address)
      ).to.be.revertedWithCustomError(lse, "AlreadyClaimed");
    });

    it("revert si mauvais controller", async () => {
      const { lse, alice, bob, zyFAI } = await requestSetup();

      await zyFAI.fulfillAll(await lse.getAddress());
      await expect(
        lse.connect(bob).claim(1n, alice.address)
      ).to.be.revertedWithCustomError(lse, "NotAuthorized");
    });

  });

  // ───────────────────────────────────────────────────────────────────────────
  describe("Yield", () => {

    it("le yield augmente totalAssets et dilue les nouveaux déposants", async () => {
      const { lse, weth, usdc, alice, bob, zyFAI } = await deploy();

      // Alice dépose 1 WETH
      await weth.mint(alice.address, toWETH(1));
      await weth.connect(alice).approve(await lse.getAddress(), toWETH(1));
      await lse.connect(alice).deposit(toWETH(1), alice.address);

      const totalBefore = await lse.totalAssets();

      // ZyFAI génère 200 USDC de yield (10% sur 2000 USDC)
      await usdc.mint(alice.address, toUSDC(200));
      await usdc.connect(alice).approve(await zyFAI.getAddress(), toUSDC(200));
      await zyFAI.connect(alice).simulateYield(toUSDC(200));

      expect(await lse.totalAssets()).to.be.gt(totalBefore);

      // Bob dépose après le yield → reçoit moins de shares qu'Alice (le vault vaut plus)
      await weth.mint(bob.address, toWETH(1));
      await weth.connect(bob).approve(await lse.getAddress(), toWETH(1));
      await lse.connect(bob).deposit(toWETH(1), bob.address);

      expect(await lse.balanceOf(bob.address)).to.be.lt(await lse.balanceOf(alice.address));
    });

  });

  // ───────────────────────────────────────────────────────────────────────────
  describe("setOperator()", () => {

    it("un opérateur autorisé peut requestRedeem au nom du owner", async () => {
      const { ethers, lse, weth, alice, bob } = await deploy();

      await weth.mint(alice.address, toWETH(1));
      await weth.connect(alice).approve(await lse.getAddress(), toWETH(1));
      await lse.connect(alice).deposit(toWETH(1), alice.address);

      await lse.connect(alice).setOperator(bob.address, true);

      const shares = await lse.balanceOf(alice.address);
      await expect(
        lse.connect(bob).requestRedeem(shares, alice.address, alice.address)
      ).to.not.revert(ethers);
    });

  });

});
