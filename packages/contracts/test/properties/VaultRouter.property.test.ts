import { expect } from "chai";
import { ethers } from "hardhat";
import fc from "fast-check";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("VaultRouter Property Tests", () => {
  let vaultRouter: any;
  let mockRouter: any;
  let mockWETH: any;
  let mockToken: any;
  let owner: SignerWithAddress;
  let user: SignerWithAddress;
  let feeRecipient: SignerWithAddress;

  beforeEach(async () => {
    [owner, user, feeRecipient] = await ethers.getSigners();

    const MockWETH = await ethers.getContractFactory("MockWETH");
    mockWETH = await MockWETH.deploy();

    const MockToken = await ethers.getContractFactory("MockToken");
    mockToken = await MockToken.deploy("Test Token", "TEST", ethers.parseEther("1000000"));

    const MockRouter = await ethers.getContractFactory("MockUniswapRouter");
    mockRouter = await MockRouter.deploy(await mockWETH.getAddress());
    await mockRouter.setPrice(await mockToken.getAddress(), ethers.parseEther("0.01"));

    const VaultRouter = await ethers.getContractFactory("VaultRouter");
    vaultRouter = await VaultRouter.deploy(
      await mockRouter.getAddress(),
      await mockWETH.getAddress(),
      owner.address,
      feeRecipient.address,
      10, // 0.1% fee
      owner.address
    );
  });

  /**
   * Property 11: Deposit should increase vault balance
   */
  it("Property 11: deposit should always increase balance", async () => {
    await fc.assert(
      fc.asyncProperty(fc.uint64().filter((x) => x > 0), async (amount) => {
        // Limit amount to reasonable size
        fc.pre(amount < ethers.parseEther("1000"));

        const initialBalance = await vaultRouter.vaultBalances(user.address, ethers.ZeroAddress);

        await vaultRouter.connect(user).depositETH({ value: amount });

        const finalBalance = await vaultRouter.vaultBalances(user.address, ethers.ZeroAddress);

        expect(finalBalance - initialBalance).to.equal(amount);
      })
    );
  });

  /**
   * Property 12: Withdraw should decrease vault balance
   */
  it("Property 12: withdraw should always decrease balance", async () => {
    // First deposit
    await vaultRouter.connect(user).depositETH({ value: ethers.parseEther("10") });

    await fc.assert(
      fc.asyncProperty(fc.uint64().filter((x) => x > 0), async (amount) => {
        fc.pre(amount <= ethers.parseEther("10"));

        const initialBalance = await vaultRouter.vaultBalances(user.address, ethers.ZeroAddress);

        await vaultRouter.connect(user).withdrawETH(amount);

        const finalBalance = await vaultRouter.vaultBalances(user.address, ethers.ZeroAddress);

        expect(initialBalance - finalBalance).to.equal(amount);
      })
    );
  });

  /**
   * Property 13: Total deposits should equal sum of user deposits
   */
  it("Property 13: total deposits should track correctly", async () => {
    const deposit1 = ethers.parseEther("5");
    const deposit2 = ethers.parseEther("3");

    await vaultRouter.connect(user).depositETH({ value: deposit1 });
    await vaultRouter.connect(user).depositETH({ value: deposit2 });

    const totalDeposits = await vaultRouter.totalDeposits(ethers.ZeroAddress);
    const userBalance = await vaultRouter.vaultBalances(user.address, ethers.ZeroAddress);

    expect(totalDeposits).to.equal(deposit1 + deposit2);
    expect(userBalance).to.equal(deposit1 + deposit2);
  });

  /**
   * Property 14: Policy max trade size should bound executeTrade amount
   */
  it("Property 14: trade size should respect policy max", async () => {
    await vaultRouter.connect(user).depositETH({ value: ethers.parseEther("10") });
    await vaultRouter.connect(user).setPolicy(
      user.address,
      500, // 5% slippage
      ethers.parseEther("5"), // Max 5 ETH
      0, // No cooldown
      []
    );

    // Should fail when trying to trade more than max
    await expect(
      vaultRouter.connect(user).executeTrade(
        ethers.ZeroAddress,
        await mockToken.getAddress(),
        ethers.parseEther("6"), // More than max
        ethers.parseEther("1")
      )
    ).to.be.reverted;
  });

  /**
   * Property 15: Get vault balances should return correct length
   */
  it("Property 15: getVaultBalances should return array of same length", async () => {
    await vaultRouter.connect(user).depositETH({ value: ethers.parseEther("10") });

    const tokens = [ethers.ZeroAddress, await mockToken.getAddress()];
    const balances = await vaultRouter.getVaultBalances(user.address, tokens);

    expect(balances.length).to.equal(tokens.length);
    expect(balances[0]).to.equal(ethers.parseEther("10"));
  });
});
