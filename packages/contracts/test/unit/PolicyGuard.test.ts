import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { BigNumber } from "ethers";

describe("PolicyGuard", () => {
  let user: SignerWithAddress;
  let policyGuard: any;
  let mockToken: any;

  beforeEach(async () => {
    [user] = await ethers.getSigners();

    // Deploy mock token
    const MockToken = await ethers.getContractFactory("MockToken", {
      libraries: {},
    });
    mockToken = await MockToken.deploy("Test Token", "TEST", ethers.parseEther("1000000"));

    // Deploy contract that uses PolicyGuard library
    const PolicyGuardTest = await ethers.getContractFactory("PolicyGuardTest");
    policyGuard = await PolicyGuardTest.deploy();
  });

  describe("checkTradeSize", () => {
    it("should pass when trade size is within limit", async () => {
      const tradeSize = ethers.parseEther("1");
      const maxTradeSize = ethers.parseEther("10");

      await expect(policyGuard.testTradeSize(tradeSize, maxTradeSize)).to.not.be.reverted;
    });

    it("should revert when trade size exceeds maximum", async () => {
      const tradeSize = ethers.parseEther("11");
      const maxTradeSize = ethers.parseEther("10");

      await expect(policyGuard.testTradeSize(tradeSize, maxTradeSize))
        .to.be.revertedWithCustomError(policyGuard, "TradeSizeExceeded")
        .withArgs(tradeSize, maxTradeSize);
    });

    it("should revert when trade size is zero", async () => {
      await expect(policyGuard.testTradeSize(0, ethers.parseEther("10")))
        .to.be.revertedWithCustomError(policyGuard, "ZeroTradeAmount");
    });

    it("should pass when trade size equals maximum", async () => {
      const tradeSize = ethers.parseEther("10");
      const maxTradeSize = ethers.parseEther("10");

      await expect(policyGuard.testTradeSize(tradeSize, maxTradeSize)).to.not.be.reverted;
    });
  });

  describe("checkSlippage", () => {
    it("should pass when slippage is within limit", async () => {
      const slippageBps = 300; // 3%
      const maxSlippageBps = 500; // 5%

      await expect(policyGuard.testSlippage(slippageBps, maxSlippageBps)).to.not.be.reverted;
    });

    it("should revert when slippage exceeds maximum", async () => {
      const slippageBps = 600; // 6%
      const maxSlippageBps = 500; // 5%

      await expect(policyGuard.testSlippage(slippageBps, maxSlippageBps))
        .to.be.revertedWithCustomError(policyGuard, "SlippageExceeded")
        .withArgs(slippageBps, maxSlippageBps);
    });

    it("should revert when slippage exceeds 100%", async () => {
      const slippageBps = 10001; // 100.01%
      const maxSlippageBps = 10000;

      await expect(policyGuard.testSlippage(slippageBps, maxSlippageBps))
        .to.be.revertedWithCustomError(policyGuard, "SlippageExceeded");
    });

    it("should allow 100% slippage", async () => {
      const slippageBps = 10000; // 100%
      const maxSlippageBps = 10000;

      await expect(policyGuard.testSlippage(slippageBps, maxSlippageBps)).to.not.be.reverted;
    });
  });

  describe("checkCooldown", () => {
    it("should pass when cooldown has elapsed", async () => {
      const lastTradeTimestamp = Math.floor(Date.now() / 1000) - 100;
      const cooldownSeconds = 60;

      await expect(policyGuard.testCooldown(lastTradeTimestamp, cooldownSeconds)).to.not.be.reverted;
    });

    it("should revert when cooldown has not elapsed", async () => {
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const lastTradeTimestamp = currentTimestamp - 30;
      const cooldownSeconds = 60;

      await expect(policyGuard.testCooldown(lastTradeTimestamp, cooldownSeconds))
        .to.be.revertedWithCustomError(policyGuard, "CooldownNotElapsed");
    });

    it("should pass when cooldown is zero", async () => {
      const lastTradeTimestamp = Math.floor(Date.now() / 1000);

      await expect(policyGuard.testCooldown(lastTradeTimestamp, 0)).to.not.be.reverted;
    });

    it("should return remaining seconds correctly", async () => {
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const lastTradeTimestamp = currentTimestamp - 30;
      const cooldownSeconds = 60;

      const remaining = await policyGuard.getRemainingCooldown(lastTradeTimestamp, cooldownSeconds);
      expect(remaining).to.be.closeTo(30, 2); // Allow 2 second tolerance
    });
  });

  describe("checkTokenAllowlist", () => {
    const token1 = "0x0000000000000000000000000000000000000001";
    const token2 = "0x0000000000000000000000000000000000000002";
    const token3 = "0x0000000000000000000000000000000000000003";

    it("should allow all tokens when allowlist is empty", async () => {
      const allowlist: string[] = [];

      await expect(policyGuard.testTokenAllowlist(token1, allowlist)).to.not.be.reverted;
      await expect(policyGuard.testTokenAllowlist(token2, allowlist)).to.not.be.reverted;
    });

    it("should allow tokens in the allowlist", async () => {
      const allowlist = [token1, token2];

      await expect(policyGuard.testTokenAllowlist(token1, allowlist)).to.not.be.reverted;
      await expect(policyGuard.testTokenAllowlist(token2, allowlist)).to.not.be.reverted;
    });

    it("should revert when token is not in allowlist", async () => {
      const allowlist = [token1, token2];

      await expect(policyGuard.testTokenAllowlist(token3, allowlist))
        .to.be.revertedWithCustomError(policyGuard, "TokenNotAllowed")
        .withArgs(token3);
    });

    it("should always allow ETH (address(0)) when allowlist is not empty", async () => {
      const allowlist = [token1, token2];

      await expect(policyGuard.testTokenAllowlist(ethers.ZeroAddress, allowlist)).to.not.be.reverted;
    });
  });

  describe("calculateMinAmountOut", () => {
    it("should calculate minimum amount correctly", async () => {
      const amountIn = ethers.parseEther("10");
      const amountOutExpected = ethers.parseEther("9");
      const slippageBps = 300; // 3%

      const minAmountOut = await policyGuard.testCalculateMinAmountOut(
        amountIn,
        amountOutExpected,
        slippageBps
      );

      // 9 * (10000 - 300) / 10000 = 9 * 9700 / 10000 = 8.73
      const expected = amountOutExpected.mul(9700).div(10000);
      expect(minAmountOut).to.equal(expected);
    });

    it("should handle 0% slippage", async () => {
      const amountIn = ethers.parseEther("10");
      const amountOutExpected = ethers.parseEther("9");
      const slippageBps = 0;

      const minAmountOut = await policyGuard.testCalculateMinAmountOut(
        amountIn,
        amountOutExpected,
        slippageBps
      );

      expect(minAmountOut).to.equal(amountOutExpected);
    });

    it("should handle 100% slippage", async () => {
      const amountIn = ethers.parseEther("10");
      const amountOutExpected = ethers.parseEther("9");
      const slippageBps = 10000;

      const minAmountOut = await policyGuard.testCalculateMinAmountOut(
        amountIn,
        amountOutExpected,
        slippageBps
      );

      expect(minAmountOut).to.equal(0);
    });
  });

  describe("checkAmountOut", () => {
    it("should pass when actual amount meets minimum", async () => {
      const actualAmountOut = ethers.parseEther("9");
      const minAmountOut = ethers.parseEther("8.5");

      await expect(policyGuard.testCheckAmountOut(actualAmountOut, minAmountOut)).to.not.be.reverted;
    });

    it("should revert when actual amount is below minimum", async () => {
      const actualAmountOut = ethers.parseEther("8");
      const minAmountOut = ethers.parseEther("8.5");

      await expect(policyGuard.testCheckAmountOut(actualAmountOut, minAmountOut))
        .to.be.revertedWithCustomError(policyGuard, "SlippageExceeded");
    });

    it("should pass when amounts are equal", async () => {
      const amount = ethers.parseEther("9");

      await expect(policyGuard.testCheckAmountOut(amount, amount)).to.not.be.reverted;
    });
  });

  describe("validateTrade (integrated)", () => {
    it("should pass all validations for a valid trade", async () => {
      const policy = {
        maxSlippageBps: 500,
        maxTradeSize: ethers.parseEther("10"),
        cooldownSeconds: 60,
        tokenAllowlist: [] as string[],
      };

      const params = {
        tradeSize: ethers.parseEther("1"),
        slippageBps: 300,
        minAmountOut: ethers.parseEther("0.9"),
        tokenIn: ethers.ZeroAddress,
        tokenOut: await mockToken.getAddress(),
      };

      const lastTradeTimestamp = 0;

      await expect(
        policyGuard.testValidateTrade(policy, params, lastTradeTimestamp)
      ).to.not.be.reverted;
    });

    it("should revert when trade size exceeds policy limit", async () => {
      const policy = {
        maxSlippageBps: 500,
        maxTradeSize: ethers.parseEther("10"),
        cooldownSeconds: 60,
        tokenAllowlist: [] as string[],
      };

      const params = {
        tradeSize: ethers.parseEther("11"),
        slippageBps: 300,
        minAmountOut: ethers.parseEther("0.9"),
        tokenIn: ethers.ZeroAddress,
        tokenOut: await mockToken.getAddress(),
      };

      const lastTradeTimestamp = 0;

      await expect(
        policyGuard.testValidateTrade(policy, params, lastTradeTimestamp)
      ).to.be.revertedWithCustomError(policyGuard, "TradeSizeExceeded");
    });

    it("should revert when slippage exceeds policy limit", async () => {
      const policy = {
        maxSlippageBps: 300,
        maxTradeSize: ethers.parseEther("10"),
        cooldownSeconds: 60,
        tokenAllowlist: [] as string[],
      };

      const params = {
        tradeSize: ethers.parseEther("1"),
        slippageBps: 500,
        minAmountOut: ethers.parseEther("0.9"),
        tokenIn: ethers.ZeroAddress,
        tokenOut: await mockToken.getAddress(),
      };

      const lastTradeTimestamp = 0;

      await expect(
        policyGuard.testValidateTrade(policy, params, lastTradeTimestamp)
      ).to.be.revertedWithCustomError(policyGuard, "SlippageExceeded");
    });

    it("should revert when minAmountOut is zero", async () => {
      const policy = {
        maxSlippageBps: 500,
        maxTradeSize: ethers.parseEther("10"),
        cooldownSeconds: 60,
        tokenAllowlist: [] as string[],
      };

      const params = {
        tradeSize: ethers.parseEther("1"),
        slippageBps: 300,
        minAmountOut: 0,
        tokenIn: ethers.ZeroAddress,
        tokenOut: await mockToken.getAddress(),
      };

      const lastTradeTimestamp = 0;

      await expect(
        policyGuard.testValidateTrade(policy, params, lastTradeTimestamp)
      ).to.be.revertedWithCustomError(policyGuard, "ZeroMinAmountOut");
    });
  });
});
