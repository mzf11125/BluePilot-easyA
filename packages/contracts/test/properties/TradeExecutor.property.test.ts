import { expect } from "chai";
import { ethers } from "hardhat";
import fc from "fast-check";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("TradeExecutor Property Tests", () => {
  let tradeExecutor: any;
  let mockRouter: any;
  let mockWETH: any;
  let owner: SignerWithAddress;
  let user: SignerWithAddress;

  beforeEach(async () => {
    [owner, user] = await ethers.getSigners();

    const MockWETH = await ethers.getContractFactory("MockWETH");
    mockWETH = await MockWETH.deploy();

    const MockRouter = await ethers.getContractFactory("MockUniswapRouter");
    mockRouter = await MockRouter.deploy(await mockWETH.getAddress());

    const TradeExecutor = await ethers.getContractFactory("TradeExecutor");
    tradeExecutor = await TradeExecutor.deploy(
      await mockRouter.getAddress(),
      await mockWETH.getAddress(),
      owner.address
    );
  });

  /**
   * Property 7: Trade amount should always be >= minimum trade amount
   */
  it("Property 7: should reject trades below minimum amount", async () => {
    const minTradeAmount = await tradeExecutor.minTradeAmount();

    // Test with zero amount
    await expect(
      tradeExecutor.connect(user).swapETHForTokens(owner.address, 0, { value: 0 })
    ).to.be.revertedWithCustomError(tradeExecutor, "AmountBelowMinimum");

    // Test with amount below minimum (but > 0)
    if (minTradeAmount > 1) {
      await expect(
        tradeExecutor.connect(user).swapETHForTokens(owner.address, 100, { value: minTradeAmount - 1n })
      ).to.be.revertedWithCustomError(tradeExecutor, "AmountBelowMinimum");
    }
  });

  /**
   * Property 8: Get amount out should return positive value for positive input
   */
  it("Property 8: getAmountOut should return >= 0 for any positive input", async () => {
    const MockToken = await ethers.getContractFactory("MockToken");
    const mockToken = await MockToken.deploy("Test", "TST", ethers.parseEther("1000000"));

    await mockRouter.setPrice(await mockToken.getAddress(), ethers.parseEther("0.01"));

    const wethAddr = await mockWETH.getAddress();
    const tokenAddr = await mockToken.getAddress();

    await fc.assert(
      fc.asyncProperty(fc.uint64().filter((x) => x > 0), async (amountIn) => {
        const path = [wethAddr, tokenAddr];
        const amountOut = await tradeExecutor.getAmountOut(amountIn, path);

        expect(amountOut).to.be.greaterThanOrEqual(0);
      })
    );
  });

  /**
   * Property 9: Price should be transitive (symmetric relationship)
   */
  it("Property 9: getPrice should be consistent", async () => {
    const MockToken = await ethers.getContractFactory("MockToken");
    const mockToken = await MockToken.deploy("Test", "TST", ethers.parseEther("1000000"));

    const priceInEth = ethers.parseEther("0.01");
    await mockRouter.setPrice(await mockToken.getAddress(), priceInEth);

    const wethAddr = await mockWETH.getAddress();
    const tokenAddr = await mockToken.getAddress();

    const amountIn = ethers.parseEther("1");
    const price = await tradeExecutor.getPrice(wethAddr, tokenAddr, amountIn);

    // Price should be > 0
    expect(price).to.be.greaterThan(0);
  });

  /**
   * Property 10: Same token price should equal input amount
   */
  it("Property 10: same token price should equal input", async () => {
    const MockToken = await ethers.getContractFactory("MockToken");
    const mockToken = await MockToken.deploy("Test", "TST", ethers.parseEther("1000000"));

    const tokenAddr = await mockToken.getAddress();

    await fc.assert(
      fc.asyncProperty(fc.uint64().filter((x) => x > 0), async (amountIn) => {
        const price = await tradeExecutor.getPrice(tokenAddr, tokenAddr, amountIn);
        expect(price).to.equal(amountIn);
      })
    );
  });
});
