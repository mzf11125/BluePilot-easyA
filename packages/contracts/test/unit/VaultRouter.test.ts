import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { BigNumber } from "ethers";

describe("VaultRouter", () => {
  let vaultRouter: any;
  let mockRouter: any;
  let mockWETH: any;
  let mockToken: any;
  let mockToken2: any;
  let owner: SignerWithAddress;
  let user: SignerWithAddress;
  let feeRecipient: SignerWithAddress;
  let addr1: SignerWithAddress;

  const DEFAULT_PROTOCOL_FEE = 10; // 0.1%

  beforeEach(async () => {
    [owner, user, feeRecipient, addr1] = await ethers.getSigners();

    // Deploy mock contracts
    const MockWETH = await ethers.getContractFactory("MockWETH");
    mockWETH = await MockWETH.deploy();

    const MockToken = await ethers.getContractFactory("MockToken");
    mockToken = await MockToken.deploy("Test Token", "TEST", ethers.parseEther("1000000"));
    mockToken2 = await MockToken.deploy("Test Token 2", "TST2", ethers.parseEther("1000000"));

    const MockRouter = await ethers.getContractFactory("MockUniswapRouter");
    mockRouter = await MockRouter.deploy(await mockWETH.getAddress());

    // Set prices
    await mockRouter.setPrice(await mockToken.getAddress(), ethers.parseEther("0.01"));
    await mockRouter.setPrice(await mockToken2.getAddress(), ethers.parseEther("0.02"));

    // Deploy VaultRouter
    const VaultRouter = await ethers.getContractFactory("VaultRouter");
    vaultRouter = await VaultRouter.deploy(
      await mockRouter.getAddress(),
      await mockWETH.getAddress(),
      addr1.address, // tradeExecutor (not used in tests)
      feeRecipient.address,
      DEFAULT_PROTOCOL_FEE,
      owner.address
    );
  });

  describe("Deployment", () => {
    it("should set the correct router", async () => {
      expect(await vaultRouter.router()).to.equal(await mockRouter.getAddress());
    });

    it("should set the correct WETH", async () => {
      expect(await vaultRouter.WETH()).to.equal(await mockWETH.getAddress());
    });

    it("should set the correct owner", async () => {
      expect(await vaultRouter.owner()).to.equal(owner.address);
    });

    it("should set the correct fee recipient", async () => {
      expect(await vaultRouter.feeRecipient()).to.equal(feeRecipient.address);
    });

    it("should set the correct protocol fee", async () => {
      expect(await vaultRouter.protocolFeeBps()).to.equal(DEFAULT_PROTOCOL_FEE);
    });

    it("should revert with zero router address", async () => {
      const VaultRouter = await ethers.getContractFactory("VaultRouter");
      await expect(
        VaultRouter.deploy(
          ethers.ZeroAddress,
          await mockWETH.getAddress(),
          addr1.address,
          feeRecipient.address,
          DEFAULT_PROTOCOL_FEE,
          owner.address
        )
      ).to.be.revertedWithCustomError(vaultRouter, "InvalidTokenAddress");
    });
  });

  describe("depositETH", () => {
    it("should accept ETH deposit", async () => {
      const amount = ethers.parseEther("10");

      await expect(vaultRouter.connect(user).depositETH({ value: amount }))
        .to.emit(vaultRouter, "Deposited")
        .withArgs(user.address, ethers.ZeroAddress, amount);

      expect(await vaultRouter.vaultBalances(user.address, ethers.ZeroAddress)).to.equal(amount);
    });

    it("should track total deposits", async () => {
      const amount = ethers.parseEther("10");

      await vaultRouter.connect(user).depositETH({ value: amount });

      expect(await vaultRouter.totalDeposits(ethers.ZeroAddress)).to.equal(amount);
    });

    it("should revert with zero amount", async () => {
      await expect(vaultRouter.connect(user).depositETH({ value: 0 }))
        .to.be.revertedWithCustomError(vaultRouter, "InsufficientBalance")
        .withArgs(0, 1);
    });

    it("should accumulate multiple deposits", async () => {
      await vaultRouter.connect(user).depositETH({ value: ethers.parseEther("5") });
      await vaultRouter.connect(user).depositETH({ value: ethers.parseEther("3") });

      expect(await vaultRouter.vaultBalances(user.address, ethers.ZeroAddress)).to.equal(
        ethers.parseEther("8")
      );
    });
  });

  describe("depositToken", () => {
    beforeEach(async () => {
      await mockToken.mint(user.address, ethers.parseEther("1000"));
      await mockToken.connect(user).approve(await vaultRouter.getAddress(), ethers.MaxUint256);
    });

    it("should accept token deposit", async () => {
      const amount = ethers.parseEther("100");

      await expect(vaultRouter.connect(user).depositToken(await mockToken.getAddress(), amount))
        .to.emit(vaultRouter, "Deposited")
        .withArgs(user.address, await mockToken.getAddress(), amount);

      expect(await vaultRouter.vaultBalances(user.address, await mockToken.getAddress())).to.equal(amount);
    });

    it("should revert with zero address", async () => {
      await expect(
        vaultRouter.connect(user).depositToken(ethers.ZeroAddress, ethers.parseEther("100"))
      ).to.be.revertedWithCustomError(vaultRouter, "InvalidTokenAddress");
    });

    it("should revert with zero amount", async () => {
      await expect(
        vaultRouter.connect(user).depositToken(await mockToken.getAddress(), 0)
      )
        .to.be.revertedWithCustomError(vaultRouter, "InsufficientBalance")
        .withArgs(0, 1);
    });
  });

  describe("withdrawETH", () => {
    beforeEach(async () => {
      await vaultRouter.connect(user).depositETH({ value: ethers.parseEther("10") });
    });

    it("should withdraw ETH successfully", async () => {
      const amount = ethers.parseEther("5");
      const initialBalance = await ethers.provider.getBalance(user.address);

      const tx = await vaultRouter.connect(user).withdrawETH(amount);
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      const finalBalance = await ethers.provider.getBalance(user.address);
      expect(finalBalance - initialBalance + gasUsed).to.equal(amount);

      expect(await vaultRouter.vaultBalances(user.address, ethers.ZeroAddress)).to.equal(
        ethers.parseEther("5")
      );
    });

    it("should revert with insufficient balance", async () => {
      await expect(
        vaultRouter.connect(user).withdrawETH(ethers.parseEther("15"))
      )
        .to.be.revertedWithCustomError(vaultRouter, "InsufficientVaultBalance")
        .withArgs(ethers.parseEther("10"), ethers.parseEther("15"));
    });

    it("should revert with zero amount", async () => {
      await expect(vaultRouter.connect(user).withdrawETH(0))
        .to.be.revertedWithCustomError(vaultRouter, "InsufficientBalance")
        .withArgs(0, 1);
    });
  });

  describe("withdrawToken", () => {
    beforeEach(async () => {
      await mockToken.mint(user.address, ethers.parseEther("1000"));
      await mockToken.connect(user).approve(await vaultRouter.getAddress(), ethers.MaxUint256);
      await vaultRouter.connect(user).depositToken(await mockToken.getAddress(), ethers.parseEther("100"));
    });

    it("should withdraw tokens successfully", async () => {
      const amount = ethers.parseEther("50");

      await vaultRouter.connect(user).withdrawToken(await mockToken.getAddress(), amount);

      expect(await vaultRouter.vaultBalances(user.address, await mockToken.getAddress())).to.equal(
        ethers.parseEther("50")
      );
      expect(await mockToken.balanceOf(user.address)).to.equal(ethers.parseEther("950"));
    });

    it("should revert with zero address", async () => {
      await expect(
        vaultRouter.connect(user).withdrawToken(ethers.ZeroAddress, ethers.parseEther("50"))
      ).to.be.revertedWithCustomError(vaultRouter, "InvalidTokenAddress");
    });
  });

  describe("withdrawAllETH", () => {
    beforeEach(async () => {
      await vaultRouter.connect(user).depositETH({ value: ethers.parseEther("10") });
    });

    it("should withdraw all ETH", async () => {
      const initialBalance = await ethers.provider.getBalance(user.address);

      const tx = await vaultRouter.connect(user).withdrawAllETH();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      const finalBalance = await ethers.provider.getBalance(user.address);
      expect(finalBalance - initialBalance + gasUsed).to.equal(ethers.parseEther("10"));

      expect(await vaultRouter.vaultBalances(user.address, ethers.ZeroAddress)).to.equal(0);
    });

    it("should return 0 when no balance", async () => {
      await vaultRouter.connect(user).withdrawAllETH();
      const amount = await vaultRouter.connect(user).withdrawAllETH();
      expect(amount).to.equal(0);
    });
  });

  describe("setPolicy", () => {
    it("should set policy for user", async () => {
      const maxSlippageBps = 500;
      const maxTradeSize = ethers.parseEther("5");
      const cooldownSeconds = 120;

      await expect(
        vaultRouter.connect(user).setPolicy(
          user.address,
          maxSlippageBps,
          maxTradeSize,
          cooldownSeconds,
          []
        )
      )
        .to.emit(vaultRouter, "PolicyUpdated")
        .withArgs(user.address, maxSlippageBps, maxTradeSize, cooldownSeconds);

      const policy = await vaultRouter.getPolicy(user.address);
      expect(policy[0]).to.equal(maxSlippageBps);
      expect(policy[1]).to.equal(maxTradeSize);
      expect(policy[2]).to.equal(cooldownSeconds);
    });

    it("should revert when non-owner sets policy for another user", async () => {
      await expect(
        vaultRouter.connect(addr1).setPolicy(user.address, 500, ethers.parseEther("5"), 120, [])
      ).to.be.revertedWithCustomError(vaultRouter, "UnauthorizedCaller");
    });

    it("should cap slippage at 10000", async () => {
      await vaultRouter.connect(user).setPolicy(user.address, 15000, ethers.parseEther("5"), 120, []);

      const policy = await vaultRouter.getPolicy(user.address);
      expect(policy[0]).to.equal(10000);
    });
  });

  describe("setSimplePolicy", () => {
    it("should set simple policy with default cooldown", async () => {
      await vaultRouter.connect(user).setSimplePolicy(user.address, 500, ethers.parseEther("5"));

      const policy = await vaultRouter.getPolicy(user.address);
      expect(policy[0]).to.equal(500);
      expect(policy[1]).to.equal(ethers.parseEther("5"));
      expect(policy[2]).to.equal(60); // DEFAULT_COOLDOWN_SECONDS
    });
  });

  describe("initializeDefaultPolicy", () => {
    it("should initialize default policy for new user", async () => {
      await vaultRouter.initializeDefaultPolicy(user.address);

      const policy = await vaultRouter.getPolicy(user.address);
      expect(policy[0]).to.equal(300); // DEFAULT_MAX_SLIPPAGE_BPS
      expect(policy[1]).to.equal(ethers.parseEther("10")); // DEFAULT_MAX_TRADE_SIZE
      expect(policy[2]).to.equal(60); // DEFAULT_COOLDOWN_SECONDS
    });

    it("should not override existing policy", async () => {
      await vaultRouter.connect(user).setPolicy(user.address, 1000, ethers.parseEther("20"), 300, []);
      await vaultRouter.initializeDefaultPolicy(user.address);

      const policy = await vaultRouter.getPolicy(user.address);
      expect(policy[0]).to.equal(1000);
    });
  });

  describe("executeTrade", () => {
    beforeEach(async () => {
      // Deposit ETH for trading
      await vaultRouter.connect(user).depositETH({ value: ethers.parseEther("10") });

      // Set policy
      await vaultRouter.connect(user).setPolicy(
        user.address,
        500, // 5% max slippage
        ethers.parseEther("10"),
        60,
        []
      );
    });

    it("should execute trade from ETH to tokens", async () => {
      const amountIn = ethers.parseEther("1");
      const minAmountOut = ethers.parseEther("50");

      await expect(
        vaultRouter.connect(user).executeTrade(
          ethers.ZeroAddress,
          await mockToken.getAddress(),
          amountIn,
          minAmountOut
        )
      )
        .to.emit(vaultRouter, "TradeExecuted")
        .withArgs(
          user.address,
          ethers.ZeroAddress,
          await mockToken.getAddress(),
          amountIn,
          anyValue,
          anyValue
        );

      // Check balances
      expect(await vaultRouter.vaultBalances(user.address, ethers.ZeroAddress)).to.equal(
        ethers.parseEther("9")
      );
      expect(await vaultRouter.vaultBalances(user.address, await mockToken.getAddress())).to.be.closeTo(
        ethers.parseEther("99"), // 100 - 0.1% fee
        ethers.parseEther("1")
      );
    });

    it("should revert when trade size exceeds vault balance", async () => {
      await expect(
        vaultRouter.connect(user).executeTrade(
          ethers.ZeroAddress,
          await mockToken.getAddress(),
          ethers.parseEther("15"),
          ethers.parseEther("50")
        )
      ).to.be.revertedWithCustomError(vaultRouter, "TradeExceedsBalance");
    });

    it("should revert when trade size exceeds policy limit", async () => {
      await vaultRouter.connect(user).setPolicy(
        user.address,
        500,
        ethers.parseEther("5"), // Lower max trade size
        60,
        []
      );

      await expect(
        vaultRouter.connect(user).executeTrade(
          ethers.ZeroAddress,
          await mockToken.getAddress(),
          ethers.parseEther("6"),
          ethers.parseEther("50")
        )
      ).to.be.reverted; // TradeSizeExceeded from PolicyGuard
    });

    it("should respect cooldown period", async () => {
      // First trade
      await vaultRouter.connect(user).executeTrade(
        ethers.ZeroAddress,
        await mockToken.getAddress(),
        ethers.parseEther("1"),
        ethers.parseEther("50")
      );

      // Immediate second trade should fail due to cooldown
      await expect(
        vaultRouter.connect(user).executeTrade(
          ethers.ZeroAddress,
          await mockToken.getAddress(),
          ethers.parseEther("1"),
          ethers.parseEther("50")
        )
      ).to.be.reverted; // CooldownNotElapsed from PolicyGuard
    });
  });

  describe("getVaultBalance", () => {
    it("should return correct vault balance for ETH", async () => {
      await vaultRouter.connect(user).depositETH({ value: ethers.parseEther("10") });

      expect(await vaultRouter.getVaultBalance(user.address, ethers.ZeroAddress)).to.equal(
        ethers.parseEther("10")
      );
    });

    it("should return correct vault balance for token", async () => {
      await mockToken.mint(user.address, ethers.parseEther("1000"));
      await mockToken.connect(user).approve(await vaultRouter.getAddress(), ethers.MaxUint256);
      await vaultRouter.connect(user).depositToken(await mockToken.getAddress(), ethers.parseEther("100"));

      expect(await vaultRouter.getVaultBalance(user.address, await mockToken.getAddress())).to.equal(
        ethers.parseEther("100")
      );
    });
  });

  describe("getVaultBalances", () => {
    it("should return multiple balances", async () => {
      await vaultRouter.connect(user).depositETH({ value: ethers.parseEther("10") });

      await mockToken.mint(user.address, ethers.parseEther("1000"));
      await mockToken.connect(user).approve(await vaultRouter.getAddress(), ethers.MaxUint256);
      await vaultRouter.connect(user).depositToken(await mockToken.getAddress(), ethers.parseEther("100"));

      const tokens = [ethers.ZeroAddress, await mockToken.getAddress()];
      const balances = await vaultRouter.getVaultBalances(user.address, tokens);

      expect(balances[0]).to.equal(ethers.parseEther("10"));
      expect(balances[1]).to.equal(ethers.parseEther("100"));
    });
  });

  describe("simulateTrade", () => {
    it("should simulate ETH to token trade", async () => {
      const amountOut = await vaultRouter.simulateTrade(
        ethers.ZeroAddress,
        await mockToken.getAddress(),
        ethers.parseEther("1")
      );

      // 1 WETH = 100 tokens at 0.01 price
      expect(amountOut).to.equal(ethers.parseEther("100"));
    });

    it("should simulate token to token trade", async () => {
      const amountOut = await vaultRouter.simulateTrade(
        await mockToken.getAddress(),
        await mockToken2.getAddress(),
        ethers.parseEther("100")
      );

      // 100 token1 = 1 WETH = 50 token2 at 0.02 price
      expect(amountOut).to.equal(ethers.parseEther("50"));
    });
  });

  describe("Admin Functions", () => {
    it("should allow owner to set protocol fee", async () => {
      await vaultRouter.setProtocolFee(50); // 0.5%
      expect(await vaultRouter.protocolFeeBps()).to.equal(50);
    });

    it("should cap protocol fee at max", async () => {
      await vaultRouter.setProtocolFee(200); // 2%
      expect(await vaultRouter.protocolFeeBps()).to.equal(100); // capped at 1%
    });

    it("should allow owner to set fee recipient", async () => {
      await vaultRouter.setFeeRecipient(addr1.address);
      expect(await vaultRouter.feeRecipient()).to.equal(addr1.address);
    });

    it("should revert setting zero fee recipient", async () => {
      await expect(vaultRouter.setFeeRecipient(ethers.ZeroAddress)).to.be.revertedWithCustomError(
        vaultRouter,
        "InvalidTokenAddress"
      );
    });

    it("should allow owner to emergency withdraw", async () => {
      await vaultRouter.connect(user).depositETH({ value: ethers.parseEther("10") });

      await vaultRouter.emergencyWithdraw(ethers.ZeroAddress, ethers.parseEther("1"), addr1.address);

      expect(await ethers.provider.getBalance(addr1.address)).to.equal(ethers.parseEther("10001"));
    });
  });

  describe("Protocol Fees", () => {
    beforeEach(async () => {
      await vaultRouter.connect(user).depositETH({ value: ethers.parseEther("10") });
      await vaultRouter.connect(user).setPolicy(
        user.address,
        500,
        ethers.parseEther("10"),
        0, // No cooldown for testing
        []
      );
    });

    it("should collect protocol fees on ETH trades", async () => {
      const amountIn = ethers.parseEther("1");
      const feeAmount = amountIn * BigInt(DEFAULT_PROTOCOL_FEE) / 10000n; // 0.1%
      const initialFeeRecipientBalance = await ethers.provider.getBalance(feeRecipient.address);

      await vaultRouter.connect(user).executeTrade(
        ethers.ZeroAddress,
        await mockToken.getAddress(),
        amountIn,
        ethers.parseEther("50")
      );

      const finalFeeRecipientBalance = await ethers.provider.getBalance(feeRecipient.address);
      expect(finalFeeRecipientBalance - initialFeeRecipientBalance).to.equal(feeAmount);
    });
  });
});

const anyValue = ethers.AnyValue;
