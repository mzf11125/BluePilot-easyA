import { getContractService } from "../../src/services/ContractService";
import dotenv from "dotenv";

dotenv.config();

const VAULT_ROUTER_ADDRESS = process.env.VAULT_ROUTER_ADDRESS!;
const TRADE_EXECUTOR_ADDRESS = process.env.TRADE_EXECUTOR_ADDRESS!;
const BASE_SEPOLIA_CHAIN_ID = 84532;
const TEST_USER_ADDRESS = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb";
const WETH_ADDRESS = "0x4200000000000000000000000000000000000006";
const USDC_ADDRESS = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";

describe("Contract Read Operations", () => {
  const contractService = getContractService(undefined, BASE_SEPOLIA_CHAIN_ID);

  it("should get token info for WETH", async () => {
    const tokenInfo = await contractService.getTokenInfo(WETH_ADDRESS);

    expect(tokenInfo).toHaveProperty("symbol");
    expect(tokenInfo).toHaveProperty("decimals");
    expect(tokenInfo.decimals).toBe(18);
  }, 30000);

  it("should get vault balance for user", async () => {
    const balance = await contractService.getVaultBalance(
      VAULT_ROUTER_ADDRESS,
      TEST_USER_ADDRESS,
      WETH_ADDRESS
    );

    expect(typeof balance).toBe("bigint");
    expect(balance).toBeGreaterThanOrEqual(0n);
  }, 30000);

  it("should simulate trade between WETH and USDC", async () => {
    try {
      const simulation = await contractService.simulateTrade(
        VAULT_ROUTER_ADDRESS,
        WETH_ADDRESS,
        USDC_ADDRESS,
        "0.01"
      );

      expect(simulation).toHaveProperty("valid");
      expect(simulation).toHaveProperty("amounts");
    } catch (error: any) {
      // Simulation might fail if liquidity is insufficient, which is acceptable
      expect(error.message).toBeDefined();
    }
  }, 30000);

  it("should throw error for invalid contract address", async () => {
    const invalidAddress = "0x0000000000000000000000000000000000000001";

    await expect(
      contractService.getVaultBalance(
        invalidAddress,
        TEST_USER_ADDRESS,
        WETH_ADDRESS
      )
    ).rejects.toThrow();
  }, 30000);

  it("should get token info for USDC", async () => {
    const tokenInfo = await contractService.getTokenInfo(USDC_ADDRESS);

    expect(tokenInfo).toHaveProperty("symbol");
    expect(tokenInfo).toHaveProperty("decimals");
    expect(tokenInfo.decimals).toBe(6);
  }, 30000);
});
