import { startTestServer, stopTestServer, makeRequest } from "./setup";
import { getBaseTokens } from "../utils/coingecko";

describe("Agent Simulate Endpoint", () => {
  beforeAll(async () => {
    await startTestServer();
  }, 30000);

  afterAll(async () => {
    await stopTestServer();
  });

  it("should return valid simulation for swap command", async () => {
    const tokens = await getBaseTokens();
    const weth = tokens.find((t) => t.symbol === "WETH");
    const usdc = tokens.find((t) => t.symbol === "USDC");

    expect(weth).toBeDefined();
    expect(usdc).toBeDefined();

    const response = await makeRequest("/api/agent/simulate", {
      command: "swap 0.1 WETH for USDC",
      userAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      chainId: 84532,
    });

    expect(response).toHaveProperty("valid");
    expect(response).toHaveProperty("intent");
    expect(response.intent).toBe("swap");
  }, 30000);

  it("should return error for invalid command", async () => {
    const response = await makeRequest("/api/agent/simulate", {
      command: "do something random",
      userAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      chainId: 84532,
    });

    expect(response.valid).toBe(false);
    expect(response.error).toBeDefined();
  }, 30000);

  it("should handle insufficient balance error", async () => {
    const response = await makeRequest("/api/agent/simulate", {
      command: "swap 1000 ETH for USDC",
      userAddress: "0x0000000000000000000000000000000000000001",
      chainId: 84532,
    });

    expect(response.valid).toBe(false);
    if (response.error) {
      expect(response.error.toLowerCase()).toContain("insufficient");
    }
  }, 30000);

  it("should parse command parameters correctly", async () => {
    const response = await makeRequest("/api/agent/simulate", {
      command: "swap 1 ETH for USDC with 2% slippage",
      userAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      chainId: 84532,
    });

    expect(response.params).toBeDefined();
    expect(response.params.amount).toBe("1");
    expect(response.params.slippageBps).toBe(200);
  }, 30000);
});
