import { describe, it, expect } from "@jest/globals";
import { CommandParser } from "../../src/services/CommandParser";

describe("CommandParser", () => {
  const parser = new CommandParser();

  describe("parse", () => {
    it("should parse swap command", () => {
      const result = parser.parse("swap 1 ETH for USDC");
      expect(result.type).toBe("swap");
      expect(result.amount).toBe("1");
      expect(result.isHumanAmount).toBe(true);
    });

    it("should parse swap with slippage", () => {
      const result = parser.parse("swap 1 ETH for USDC with 2% slippage");
      expect(result.type).toBe("swap");
      expect(result.slippageBps).toBe(200);
    });

    it("should parse deposit command", () => {
      const result = parser.parse("deposit 10 ETH");
      expect(result.type).toBe("deposit");
      expect(result.amount).toBe("10");
    });

    it("should parse withdraw command", () => {
      const result = parser.parse("withdraw 5 ETH");
      expect(result.type).toBe("withdraw");
      expect(result.amount).toBe("5");
    });

    it("should parse withdraw all command", () => {
      const result = parser.parse("withdraw all USDC");
      expect(result.type).toBe("withdraw");
      expect(result.amount).toBe("all");
    });

    it("should parse set policy command", () => {
      const result = parser.parse("set max slippage to 2%");
      expect(result.type).toBe("set_policy");
      expect(result.policy?.maxSlippageBps).toBe(200);
    });

    it("should parse set cooldown command", () => {
      const result = parser.parse("set cooldown to 30 seconds");
      expect(result.type).toBe("set_policy");
      expect(result.policy?.cooldownSeconds).toBe(30);
    });

    it("should return unknown for unrecognized command", () => {
      const result = parser.parse("do something random");
      expect(result.type).toBe("unknown");
    });
  });

  describe("amountToWei", () => {
    it("should convert whole number to wei", () => {
      const result = parser.amountToWei("1", 18);
      expect(result.toString()).toBe("1000000000000000000");
    });

    it("should convert decimal to wei", () => {
      const result = parser.amountToWei("1.5", 18);
      expect(result.toString()).toBe("1500000000000000000");
    });

    it("should handle 6 decimals (USDC)", () => {
      const result = parser.amountToWei("100", 6);
      expect(result.toString()).toBe("100000000");
    });
  });

  describe("weiToAmount", () => {
    it("should convert wei to amount", () => {
      const result = parser.weiToAmount(BigInt("1000000000000000000"), 18);
      expect(result).toBe("1");
    });

    it("should convert wei to decimal amount", () => {
      const result = parser.weiToAmount(BigInt("1500000000000000000"), 18);
      expect(result).toBe("1.5");
    });
  });

  describe("symbolToAddress", () => {
    it("should return ETH zero address", () => {
      const result = parser.symbolToAddress("ETH");
      expect(result).toBe("0x0000000000000000000000000000000000000000");
    });

    it("should return WETH address", () => {
      const result = parser.symbolToAddress("WETH");
      expect(result).toBe("0x4200000000000000000000000000000000000006");
    });

    it("should return USDC address", () => {
      const result = parser.symbolToAddress("USDC");
      expect(result).toBe("0x833589fcd6edb6e08f4c7c32d4f71b54bda02913");
    });
  });
});
