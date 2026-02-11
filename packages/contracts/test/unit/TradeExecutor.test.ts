import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { BigNumber } from "ethers";

describe("TradeExecutor", () => {
  let tradeExecutor: any;
  let mockRouter: any;
  let mockWETH: any;
  let mockToken: any;
  let owner: SignerWithAddress;
  let user: SignerWithAddress;
  let addr1: SignerWithAddress;

  beforeEach(async () => {
    [owner, user, addr1] = await ethers.getSigners();

    // Deploy mock contracts
    const MockWETH = await ethers.getContractFactory("MockWETH");
    mockWETH = await MockWETH.deploy();

    const MockToken = await ethers.getContractFactory("MockToken");
    mockToken = await MockToken.deploy("Test Token", "TEST", ethers.parseEther("1000000"));

    const MockRouter = await ethers.getContractFactory("MockUniswapRouter");
    mockRouter = await MockRouter.deploy(await mockWETH.getAddress());

    // Set price for mock token (1 token = 0.01 WETH)
    await mockRouter.setPrice(await mockToken.getAddress(), ethers.parseEther("0.01"));

    // Deploy TradeExecutor
    const TradeExecutor = await ethers.getContractFactory("TradeExecutor");
    tradeExecutor = await TradeExecutor.deploy(
      await mockRouter.getAddress(),
      await mockWETH.getAddress(),
      owner.address
    );
  });

  describe("Deployment", () => {
    it("should set the correct router", async () => {
      expect(await tradeExecutor.router()).to.equal(await mockRouter.getAddress());
    });

    it("should set the correct WETH", async () => {
      expect(await tradeExecutor.WETH()).to.equal(await mockWETH.getAddress());
    });

    it("should set the correct owner", async () => {
      expect(await tradeExecutor.owner()).to.equal(owner.address);
    });

    it("should set default deadline buffer", async () => {
      expect(await tradeExecutor.deadlineBuffer()).to.equal(300); // 5 minutes
    });

    it("should set default min trade amount", async () => {
      expect(await tradeExecutor.minTradeAmount()).to.equal(1000);
    });

    it("should revert with zero router address", async () => {
      const TradeExecutor = await ethers.getContractFactory("TradeExecutor");
      await expect(
        TradeExecutor.deploy(ethers.ZeroAddress, await mockWETH.getAddress(), owner.address)
      ).to.be.revertedWithCustomError(tradeExecutor, "InvalidPath");
    });

    it("should revert with zero WETH address", async () => {
      const TradeExecutor = await ethers.getContractFactory("TradeExecutor");
      await expect(
        TradeExecutor.deploy(await mockRouter.getAddress(), ethers.ZeroAddress, owner.address)
      ).to.be.revertedWithCustomError(tradeExecutor, "InvalidPath");
    });
  });

  describe("swapETHForTokens", () => {
    it("should swap ETH for tokens successfully", async () => {
      const amountIn = ethers.parseEther("1");
      const minAmountOut = ethers.parseEther("50"); // 1 ETH = 100 tokens at 0.01 price

      await expect(
        tradeExecutor.connect(user).swapETHForTokens(await mockToken.getAddress(), minAmountOut, {
          value: amountIn,
        })
      )
        .to.emit(tradeExecutor, "TradeExecuted")
        .withArgs(
          user.address,
          await mockWETH.getAddress(),
          await mockToken.getAddress(),
          amountIn,
          await mockRouter.getAmountsOut(amountIn, [
            await mockWETH.getAddress(),
            await mockToken.getAddress(),
          ]),
          anyValue // timestamp
        );
    });

    it("should revert with zero amount", async () => {
      await expect(
        tradeExecutor.connect(user).swapETHForTokens(await mockToken.getAddress(), 0)
      )
        .to.be.revertedWithCustomError(tradeExecutor, "AmountBelowMinimum")
        .withArgs(0, 1000);
    });

    it("should revert with amount below minimum", async () => {
      await expect(
        tradeExecutor.connect(user).swapETHForTokens(await mockToken.getAddress(), 100, {
          value: 500,
        })
      )
        .to.be.revertedWithCustomError(tradeExecutor, "AmountBelowMinimum")
        .withArgs(500, 1000);
    });

    it("should revert with invalid token address", async () => {
      await expect(
        tradeExecutor.connect(user).swapETHForTokens(ethers.ZeroAddress, 100, {
          value: ethers.parseEther("1"),
        })
      ).to.be.revertedWithCustomError(tradeExecutor, "InvalidPath");
    });

    it("should revert when trying to swap ETH for WETH", async () => {
      await expect(
        tradeExecutor.connect(user).swapETHForTokens(await mockWETH.getAddress(), 100, {
          value: ethers.parseEther("1"),
        })
      ).to.be.revertedWithCustomError(tradeExecutor, "InvalidPath");
    });
  });

  describe("swapTokensForETH", () => {
    beforeEach(async () => {
      // Mint tokens to user
      await mockToken.mint(user.address, ethers.parseEther("1000"));
      // Approve trade executor
      await mockToken.connect(user).approve(await tradeExecutor.getAddress(), ethers.MaxUint256);
    });

    it("should swap tokens for ETH successfully", async () => {
      const amountIn = ethers.parseEther("100");
      const minAmountOut = ethers.parseEther("0.5"); // 100 tokens = 1 WETH at 0.01 price

      await expect(
        tradeExecutor.connect(user).swapTokensForETH(
          await mockToken.getAddress(),
          amountIn,
          minAmountOut
        )
      )
        .to.emit(tradeExecutor, "TradeExecuted")
        .withArgs(
          user.address,
          await mockToken.getAddress(),
          await mockWETH.getAddress(),
          amountIn,
          anyValue,
          anyValue
        );
    });

    it("should revert with zero token address", async () => {
      await expect(
        tradeExecutor.connect(user).swapTokensForETH(ethers.ZeroAddress, ethers.parseEther("100"), 0)
      ).to.be.revertedWithCustomError(tradeExecutor, "InvalidPath");
    });

    it("should revert when swapping WETH for ETH", async () => {
      await expect(
        tradeExecutor.connect(user).swapTokensForETH(
          await mockWETH.getAddress(),
          ethers.parseEther("100"),
          0
        )
      ).to.be.revertedWithCustomError(tradeExecutor, "InvalidPath");
    });
  });

  describe("swapTokensForTokens", () => {
    let token2: any;

    beforeEach(async () => {
      // Deploy second token
      const MockToken = await ethers.getContractFactory("MockToken");
      token2 = await MockToken.deploy("Test Token 2", "TST2", ethers.parseEther("1000000"));

      // Mint tokens to user
      await mockToken.mint(user.address, ethers.parseEther("1000"));

      // Approve trade executor
      await mockToken.connect(user).approve(await tradeExecutor.getAddress(), ethers.MaxUint256);

      // Set price for token2 (1 token2 = 0.02 WETH)
      await mockRouter.setPrice(await token2.getAddress(), ethers.parseEther("0.02"));
    });

    it("should swap tokens for tokens successfully", async () => {
      const amountIn = ethers.parseEther("100");
      const minAmountOut = ethers.parseEther("40"); // 100 token1 = 1 WETH, 1 WETH = 50 token2 at 0.02 price

      await expect(
        tradeExecutor.connect(user).swapTokensForTokens(
          await mockToken.getAddress(),
          await token2.getAddress(),
          amountIn,
          minAmountOut
        )
      )
        .to.emit(tradeExecutor, "TradeExecuted")
        .withArgs(
          user.address,
          await mockToken.getAddress(),
          await token2.getAddress(),
          amountIn,
          anyValue,
          anyValue
        );
    });

    it("should revert with same token addresses", async () => {
      await expect(
        tradeExecutor.connect(user).swapTokensForTokens(
          await mockToken.getAddress(),
          await mockToken.getAddress(),
          ethers.parseEther("100"),
          0
        )
      ).to.be.revertedWithCustomError(tradeExecutor, "InvalidPath");
    });

    it("should revert with zero token addresses", async () => {
      await expect(
        tradeExecutor.connect(user).swapTokensForTokens(
          ethers.ZeroAddress,
          await token2.getAddress(),
          ethers.parseEther("100"),
          0
        )
      ).to.be.revertedWithCustomError(tradeExecutor, "InvalidPath");
    });
  });

  describe("swapETHForTokensMultiHop", () => {
    let token2: any;

    beforeEach(async () => {
      // Deploy second token
      const MockToken = await ethers.getContractFactory("MockToken");
      token2 = await MockToken.deploy("Test Token 2", "TST2", ethers.parseEther("1000000"));

      // Set prices
      await mockRouter.setPrice(await mockToken.getAddress(), ethers.parseEther("0.01"));
      await mockRouter.setPrice(await token2.getAddress(), ethers.parseEther("0.02"));
    });

    it("should swap ETH for tokens through multiple hops", async () => {
      const path = [await mockWETH.getAddress(), await mockToken.getAddress(), await token2.getAddress()];
      const amountIn = ethers.parseEther("1");
      const minAmountOut = ethers.parseEther("20");

      await expect(
        tradeExecutor.connect(user).swapETHForTokensMultiHop(path, minAmountOut, {
          value: amountIn,
        })
      )
        .to.emit(tradeExecutor, "TradeExecuted")
        .withArgs(
          user.address,
          await mockWETH.getAddress(),
          await token2.getAddress(),
          amountIn,
          anyValue,
          anyValue
        );
    });

    it("should revert with invalid path", async () => {
      const path = [await mockToken.getAddress()]; // Only one token

      await expect(
        tradeExecutor.connect(user).swapETHForTokensMultiHop(path, 0, {
          value: ethers.parseEther("1"),
        })
      ).to.be.revertedWithCustomError(tradeExecutor, "InvalidPath");
    });

    it("should revert when path doesn't start with WETH", async () => {
      const path = [await mockToken.getAddress(), await token2.getAddress()];

      await expect(
        tradeExecutor.connect(user).swapETHForTokensMultiHop(path, 0, {
          value: ethers.parseEther("1"),
        })
      ).to.be.revertedWithCustomError(tradeExecutor, "InvalidPath");
    });
  });

  describe("getAmountOut", () => {
    it("should return correct amount out", async () => {
      const amountIn = ethers.parseEther("1");
      const path = [await mockWETH.getAddress(), await mockToken.getAddress()];

      const amountOut = await tradeExecutor.getAmountOut(amountIn, path);

      // 1 WETH = 100 tokens at 0.01 price
      expect(amountOut).to.equal(ethers.parseEther("100"));
    });
  });

  describe("getPrice", () => {
    it("should return correct price", async () => {
      const amountIn = ethers.parseEther("1");
      const price = await tradeExecutor.getPrice(await mockWETH.getAddress(), await mockToken.getAddress(), amountIn);

      // 1 WETH = 100 tokens
      expect(price).to.equal(ethers.parseEther("100"));
    });

    it("should return same amount for same token", async () => {
      const amountIn = ethers.parseEther("1");
      const price = await tradeExecutor.getPrice(await mockToken.getAddress(), await mockToken.getAddress(), amountIn);

      expect(price).to.equal(amountIn);
    });
  });

  describe("Admin Functions", () => {
    it("should allow owner to set deadline buffer", async () => {
      await tradeExecutor.setDeadlineBuffer(600);
      expect(await tradeExecutor.deadlineBuffer()).to.equal(600);
    });

    it("should revert when setting deadline buffer above max", async () => {
      await expect(tradeExecutor.setDeadlineBuffer(4000)).to.be.revertedWithCustomError(
        tradeExecutor,
        "InvalidDeadline"
      );
    });

    it("should allow owner to set min trade amount", async () => {
      await tradeExecutor.setMinTradeAmount(10000);
      expect(await tradeExecutor.minTradeAmount()).to.equal(10000);
    });

    it("should revert when non-owner sets deadline buffer", async () => {
      await expect(tradeExecutor.connect(user).setDeadlineBuffer(600)).to.be.revertedWithCustomError(
        tradeExecutor,
        "OwnableUnauthorizedAccount"
      );
    });

    it("should allow owner to emergency withdraw ETH", async () => {
      // Send ETH to contract
      await owner.sendTransaction({
        to: await tradeExecutor.getAddress(),
        value: ethers.parseEther("1"),
      });

      const initialBalance = await ethers.provider.getBalance(addr1.address);

      await tradeExecutor.emergencyWithdraw(ethers.ZeroAddress, ethers.parseEther("1"), addr1.address);

      const finalBalance = await ethers.provider.getBalance(addr1.address);
      expect(finalBalance - initialBalance).to.equal(ethers.parseEther("1"));
    });

    it("should allow owner to emergency withdraw tokens", async () => {
      await mockToken.mint(await tradeExecutor.getAddress(), ethers.parseEther("100"));

      await tradeExecutor.emergencyWithdraw(
        await mockToken.getAddress(),
        ethers.parseEther("100"),
        addr1.address
      );

      expect(await mockToken.balanceOf(addr1.address)).to.equal(ethers.parseEther("100"));
    });

    it("should revert when emergency withdraw with zero recipient", async () => {
      await expect(
        tradeExecutor.emergencyWithdraw(ethers.ZeroAddress, 0, ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(tradeExecutor, "InvalidPath");
    });
  });

  describe("Receive", () => {
    it("should accept ETH", async () => {
      await expect(
        owner.sendTransaction({
          to: await tradeExecutor.getAddress(),
          value: ethers.parseEther("1"),
        })
      ).to.not.be.reverted;

      expect(await ethers.provider.getBalance(await tradeExecutor.getAddress())).to.equal(
        ethers.parseEther("1")
      );
    });
  });
});

const anyValue = ethers.AnyValue;
