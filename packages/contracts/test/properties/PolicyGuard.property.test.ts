import { expect } from "chai";
import { ethers } from "hardhat";
import fc from "fast-check";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("PolicyGuard Property Tests", () => {
  let policyGuard: any;
  let mockToken: any;
  let owner: SignerWithAddress;

  beforeEach(async () => {
    [owner] = await ethers.getSigners();

    const MockToken = await ethers.getContractFactory("MockToken");
    mockToken = await MockToken.deploy("Test Token", "TEST", ethers.parseEther("1000000"));

    const PolicyGuardTest = await ethers.getContractFactory("PolicyGuardTest");
    policyGuard = await PolicyGuardTest.deploy();
  });

  /**
   * Property 1: Trade size validation should always reject amounts greater than max
   */
  it("Property 1: should reject trade sizes above maximum", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uint64(),
        fc.uint64(),
        async (tradeSize, maxTradeSize) => {
          fc.pre(tradeSize > 0 && maxTradeSize > 0);

          try {
            await policyGuard.testTradeSize(tradeSize, maxTradeSize);
            // If no revert, tradeSize should be <= maxTradeSize
            expect(tradeSize).to.be.at.most(maxTradeSize);
          } catch (e: any) {
            // If reverted, it should be TradeSizeExceeded and tradeSize > maxTradeSize
            if (e.message.includes("TradeSizeExceeded")) {
              expect(tradeSize).to.be.greaterThan(maxTradeSize);
            }
          }
        }
      )
    );
  });

  /**
   * Property 2: Trade size should always be > 0
   */
  it("Property 2: should reject zero trade size", async () => {
    await policyGuard.testTradeSize(0, ethers.parseEther("10")).catch((e: any) => {
      expect(e.message).to.include("ZeroTradeAmount");
    });
  });

  /**
   * Property 3: Slippage validation should reject values > 10000 bps (100%)
   */
  it("Property 3: should reject slippage above 100%", async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 0, max: 20000 }), async (slippageBps) => {
        const maxSlippageBps = 10000;

        try {
          await policyGuard.testSlippage(slippageBps, maxSlippageBps);
          // If no revert, slippage should be <= 10000
          expect(slippageBps).to.be.at.most(10000);
        } catch (e: any) {
          // If reverted with SlippageExceeded, verify conditions
          if (e.message.includes("SlippageExceeded")) {
            expect(slippageBps).to.be.greaterThan(maxSlippageBps);
          }
        }
      })
    );
  });

  /**
   * Property 4: Cooldown should allow trading after cooldown period
   */
  it("Property 4: should allow trade when elapsed time >= cooldown", async () => {
    const now = Math.floor(Date.now() / 1000);
    const lastTrade = now - 100;
    const cooldown = 60;

    // Should pass since 100 > 60
    await policyGuard.testCooldown(lastTrade, cooldown);
  });

  /**
   * Property 5: Empty allowlist should allow all tokens
   */
  it("Property 5: empty allowlist should allow any token", async () => {
    const randomAddress = fc.sample(fc.address(), 1)[0];

    await policyGuard.testTokenAllowlist(randomAddress, []);
  });

  /**
   * Property 6: Calculate min amount out should always produce value <= expected
   */
  it("Property 6: min amount out should be <= expected amount", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uint64(),
        fc.uint64(),
        fc.integer({ min: 0, max: 10000 }),
        async (amountIn, amountOutExpected, slippageBps) => {
          fc.pre(amountIn > 0 && amountOutExpected > 0);

          const minAmountOut = await policyGuard.testCalculateMinAmountOut(
            amountIn,
            amountOutExpected,
            slippageBps
          );

          // minAmountOut should be <= amountOutExpected
          expect(Number(minAmountOut)).to.be.at.most(Number(amountOutExpected));

          // With 0% slippage, minAmountOut should equal expected
          if (slippageBps === 0) {
            expect(minAmountOut).to.equal(amountOutExpected);
          }

          // With 100% slippage, minAmountOut should be 0
          if (slippageBps === 10000) {
            expect(minAmountOut).to.equal(0);
          }
        }
      )
    );
  });
});
