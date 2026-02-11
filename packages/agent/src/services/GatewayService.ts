import { ethers } from "ethers";

/**
 * Gateway Protocol configuration for cross-chain bridging
 * This service handles bridging operations between chains
 */
export class GatewayService {
  private gatewayAddress: string;
  private provider: ethers.JsonRpcProvider;

  constructor(rpcUrl: string, gatewayAddress?: string) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.gatewayAddress =
      gatewayAddress || "0xe492aAf5de0fa587aF707CEB4b77891E0D9A306C"; // Example Gateway address
  }

  /**
   * Calculate bridge fee for cross-chain transfer
   */
  async calculateBridgeFee(
    sourceChain: number,
    destChain: number,
    amount: bigint
  ): Promise<bigint> {
    // Simplified fee calculation
    // In production, this would query the Gateway contract
    const baseFee = BigInt(500000000000000); // 0.0005 ETH
    const amountFee = amount / 1000n; // 0.1%
    return baseFee + amountFee;
  }

  /**
   * Generate bridge transaction data
   */
  generateBridgeTransaction(
    destChain: number,
    token: string,
    amount: bigint,
    recipient: string
  ): { to: string; data: string; value: string } {
    // Gateway ABI (minimal)
    const gatewayAbi = [
      "function bridgeOut(uint256 destChainId, address token, uint256 amount, address recipient, bytes calldata extraData) payable",
    ];

    const iface = new ethers.Interface(gatewayAbi);
    const data = iface.encodeFunctionData("bridgeOut", [
      destChain,
      token,
      amount,
      recipient,
      "0x",
    ]);

    const isETH = token === ethers.ZeroAddress;

    return {
      to: this.gatewayAddress,
      data,
      value: isETH ? amount.toString() : "0",
    };
  }

  /**
   * Check if a token is supported for bridging
   */
  isTokenSupported(token: string): boolean {
    // Common supported tokens
    const supportedTokens = [
      "0x0000000000000000000000000000000000000000", // ETH
      "0x4200000000000000000000000000000000000006", // WETH
      "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913", // USDC
    ];

    return supportedTokens.includes(token.toLowerCase());
  }

  /**
   * Get supported chains
   */
  getSupportedChains(): number[] {
    return [
      8453, // Base
      84532, // Base Sepolia
      1, // Ethereum
      11155111, // Sepolia
    ];
  }

  /**
   * Check if chain is supported
   */
  isChainSupported(chainId: number): boolean {
    return this.getSupportedChains().includes(chainId);
  }
}

export const gatewayService = new GatewayService(
  process.env.BASE_RPC_URL || "https://mainnet.base.org"
);
