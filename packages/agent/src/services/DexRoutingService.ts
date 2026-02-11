/**
 * DEX Routing Service
 * Service for multi-DEX routing and best price comparison
 */

import { ethers, Contract } from "ethers";
import { getRobinPumpService, TokenLaunch } from "./RobinPumpService.js";
import { getContractService } from "./ContractService.js";

// DEX Router types
export type DexRouterType = "UNISWAP_V2" | "ROBINPUMP" | "AUTO";

// Route options
export interface RouteOptions {
  preferredRouter?: DexRouterType;
  maxPriceImpact?: number; // Maximum price impact in basis points
  minLiquidity?: string; // Minimum liquidity threshold
  enableRobinPump?: boolean;
}

// Route result
export interface RouteResult {
  router: DexRouterType;
  expectedAmountOut: string;
  priceImpact: number;
  gasEstimate: string;
  route: {
    from: string;
    to: string;
    router: string;
  };
}

// Price comparison result
export interface PriceComparison {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  routes: RouteResult[];
  bestRoute: RouteResult;
  timestamp: number;
}

// Uniswap V2 Router ABI (partial)
const UNISWAP_ROUTER_ABI = [
  {
    inputs: [
      { name: "amountIn", type: "uint256" },
      { name: "path", type: "address[]" },
    ],
    name: "getAmountsOut",
    outputs: [{ name: "amounts", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
];

/**
 * DEX Routing Service class
 */
export class DexRoutingService {
  private contractService: ReturnType<typeof getContractService>;
  private robinPumpService: ReturnType<typeof getRobinPumpService>;
  private uniswapRouter: Contract | null = null;
  private uniswapRouterAddress: string;

  constructor(
    rpcUrl?: string,
    chainId?: number,
    uniswapRouterAddress?: string
  ) {
    this.contractService = getContractService(rpcUrl, chainId);
    this.robinPumpService = getRobinPumpService(rpcUrl);

    // Default Uniswap V2 Router on Base
    this.uniswapRouterAddress =
      uniswapRouterAddress ||
      process.env.UNISWAP_V2_ROUTER ||
      "0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24";

    const provider = this.contractService.getProvider();
    this.uniswapRouter = new Contract(this.uniswapRouterAddress, UNISWAP_ROUTER_ABI, provider);
  }

  /**
   * Compare prices across all available DEXs
   */
  async comparePrices(
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
    options: RouteOptions = {}
  ): Promise<PriceComparison> {
    const routes: RouteResult[] = [];

    // Check Uniswap V2
    try {
      const uniswapRoute = await this.getUniswapRoute(tokenIn, tokenOut, amountIn);
      if (uniswapRoute) {
        routes.push(uniswapRoute);
      }
    } catch (error) {
      console.error("Error getting Uniswap route:", error);
    }

    // Check RobinPump if enabled and applicable
    if (options.enableRobinPump !== false) {
      try {
        const robinPumpRoute = await this.getRobinPumpRoute(tokenIn, tokenOut, amountIn);
        if (robinPumpRoute) {
          routes.push(robinPumpRoute);
        }
      } catch (error) {
        console.error("Error getting RobinPump route:", error);
      }
    }

    // Find best route
    let bestRoute = routes[0];
    if (routes.length > 1) {
      bestRoute = routes.reduce((best, current) =>
        BigInt(current.expectedAmountOut) > BigInt(best.expectedAmountOut)
          ? current
          : best
      );
    }

    return {
      tokenIn,
      tokenOut,
      amountIn,
      routes,
      bestRoute,
      timestamp: Date.now(),
    };
  }

  /**
   * Select the best router for a trade
   */
  async selectBestRouter(
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
    options: RouteOptions = {}
  ): Promise<DexRouterType> {
    // If user explicitly prefers a router, use it
    if (options.preferredRouter && options.preferredRouter !== "AUTO") {
      // Validate that the preferred router can handle this trade
      if (options.preferredRouter === "ROBINPUMP") {
        const isRP = await this.robinPumpService.isRobinPumpToken(
          tokenIn.toLowerCase() === ethers.ZeroAddress.toLowerCase() ||
          tokenIn.toLowerCase() === process.env.WETH_ADDRESS?.toLowerCase()
            ? tokenOut
            : tokenIn
        );
        if (isRP) {
          return "ROBINPUMP";
        }
      }
      return options.preferredRouter;
    }

    // Auto selection logic
    const isTokenInRP = await this.isRobinPumpToken(tokenIn);
    const isTokenOutRP = await this.isRobinPumpToken(tokenOut);

    // If both are RobinPump tokens, use RobinPump
    if (isTokenInRP && isTokenOutRP) {
      return "ROBINPUMP";
    }

    // If one is RobinPump and we're trading with ETH
    const isEthIn =
      tokenIn.toLowerCase() === ethers.ZeroAddress.toLowerCase() ||
      tokenIn.toLowerCase() === process.env.WETH_ADDRESS?.toLowerCase();
    const isEthOut =
      tokenOut.toLowerCase() === ethers.ZeroAddress.toLowerCase() ||
      tokenOut.toLowerCase() === process.env.WETH_ADDRESS?.toLowerCase();

    if ((isEthIn && isTokenOutRP) || (isEthOut && isTokenInRP)) {
      // Check trade size against new token limits
      const amountInWei = ethers.parseEther(amountIn);
      const maxNewTokenSize = options.minLiquidity
        ? ethers.parseEther(options.minLiquidity)
        : ethers.parseEther("0.5"); // Default 0.5 ETH max for new tokens

      if (amountInWei <= maxNewTokenSize) {
        return "ROBINPUMP";
      }
    }

    // Default to Uniswap V2
    return "UNISWAP_V2";
  }

  /**
   * Get route for Uniswap V2
   */
  async getUniswapRoute(
    tokenIn: string,
    tokenOut: string,
    amountIn: string
  ): Promise<RouteResult | null> {
    if (!this.uniswapRouter) {
      return null;
    }

    try {
      // Normalize token addresses
      const fromToken =
        tokenIn.toLowerCase() === ethers.ZeroAddress.toLowerCase()
          ? process.env.WETH_ADDRESS!
          : tokenIn;
      const toToken =
        tokenOut.toLowerCase() === ethers.ZeroAddress.toLowerCase()
          ? process.env.WETH_ADDRESS!
          : tokenOut;

      const path = [fromToken, toToken];
      const amountInWei = ethers.parseEther(amountIn);

      const amounts = await this.uniswapRouter.getAmountsOut(amountInWei, path);
      const amountOut = amounts[amounts.length - 1];

      return {
        router: "UNISWAP_V2",
        expectedAmountOut: amountOut.toString(),
        priceImpact: 0, // TODO: Calculate actual price impact
        gasEstimate: "200000", // Default gas estimate
        route: {
          from: tokenIn,
          to: tokenOut,
          router: this.uniswapRouterAddress,
        },
      };
    } catch (error) {
      console.error("Uniswap route error:", error);
      return null;
    }
  }

  /**
   * Get route for RobinPump
   */
  async getRobinPumpRoute(
    tokenIn: string,
    tokenOut: string,
    amountIn: string
  ): Promise<RouteResult | null> {
    try {
      const isEthIn =
        tokenIn.toLowerCase() === ethers.ZeroAddress.toLowerCase() ||
        tokenIn.toLowerCase() === process.env.WETH_ADDRESS?.toLowerCase();
      const isEthOut =
        tokenOut.toLowerCase() === ethers.ZeroAddress.toLowerCase() ||
        tokenOut.toLowerCase() === process.env.WETH_ADDRESS?.toLowerCase();

      let expectedAmountOut: string;
      let rpToken: string;

      if (isEthIn) {
        // Buying token with ETH
        rpToken = tokenOut;
        const quote = await this.robinPumpService.getBuyPrice(rpToken, amountIn);
        if (!quote) {
          return null;
        }
        expectedAmountOut = quote.tokenAmount;
      } else if (isEthOut) {
        // Selling token for ETH
        rpToken = tokenIn;
        const quote = await this.robinPumpService.getSellPrice(rpToken, amountIn);
        if (!quote) {
          return null;
        }
        expectedAmountOut = quote.ethAmount;
      } else {
        // Token-to-token trade not supported on RobinPump
        return null;
      }

      return {
        router: "ROBINPUMP",
        expectedAmountOut,
        priceImpact: 0, // Bonding curve has predictable pricing
        gasEstimate: "250000", // RobinPump trades use slightly more gas
        route: {
          from: tokenIn,
          to: tokenOut,
          router: process.env.ROBINPUMP_ROUTER || "",
        },
      };
    } catch (error) {
      console.error("RobinPump route error:", error);
      return null;
    }
  }

  /**
   * Check if a token is a RobinPump token
   */
  private async isRobinPumpToken(tokenAddress: string): Promise<boolean> {
    // Skip if it's ETH or WETH
    if (
      tokenAddress.toLowerCase() === ethers.ZeroAddress.toLowerCase() ||
      tokenAddress.toLowerCase() === process.env.WETH_ADDRESS?.toLowerCase()
    ) {
      return false;
    }

    return await this.robinPumpService.isRobinPumpToken(tokenAddress);
  }

  /**
   * Get token risk score based on maturity and liquidity
   */
  async getTokenRiskScore(tokenAddress: string): Promise<{
    score: number; // 0-100, higher = riskier
    factors: {
      isNewToken: boolean;
      isRobinPump: boolean;
      lowLiquidity: boolean;
      recentlyGraduated: boolean;
    };
  }> {
    const factors = {
      isNewToken: false,
      isRobinPump: false,
      lowLiquidity: false,
      recentlyGraduated: false,
    };

    let score = 0;

    // Check if it's a RobinPump token
    const isRP = await this.isRobinPumpToken(tokenAddress);
    factors.isRobinPump = isRP;

    if (isRP) {
      score += 30; // Base risk for RobinPump tokens

      const launch = await this.robinPumpService.getLaunch(tokenAddress);
      if (launch) {
        // Check if graduated
        if (!launch.graduated) {
          factors.isNewToken = true;
          score += 40; // Higher risk for tokens still on bonding curve
        } else {
          factors.recentlyGraduated = true;
          score += 20; // Some risk for recently graduated tokens
        }

        // Check liquidity
        const marketCap = BigInt(launch.marketCap);
        if (marketCap < ethers.parseEther("10")) {
          factors.lowLiquidity = true;
          score += 30; // Higher risk for low liquidity tokens
        }
      }
    } else {
      // For non-RobinPump tokens, check liquidity differently
      // This would require DEX liquidity queries
      score += 10; // Base risk for any token
    }

    // Ensure score is between 0-100
    score = Math.min(100, Math.max(0, score));

    return { score, factors };
  }

  /**
   * Get optimal route with constraints
   */
  async getOptimalRoute(
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
    constraints: {
      maxSlippage?: number; // in basis points
      minAmountOut?: string;
      preferRobinPump?: boolean;
      requireVerified?: boolean;
    } = {}
  ): Promise<RouteResult | null> {
    const options: RouteOptions = {
      preferredRouter: constraints.preferRobinPump ? "AUTO" : "UNISWAP_V2",
    };

    const comparison = await this.comparePrices(tokenIn, tokenOut, amountIn, options);

    let bestRoute = comparison.bestRoute;

    // Apply constraints
    if (constraints.maxSlippage) {
      const amountInWei = BigInt(amountIn);
      const amountOutWei = BigInt(bestRoute.expectedAmountOut);
      const priceImpact =
        amountInWei > amountOutWei
          ? Number(((amountInWei - amountOutWei) * BigInt(10000)) / amountInWei)
          : 0;

      if (priceImpact > constraints.maxSlippage) {
        // Try alternative route
        const alternative = comparison.routes.find(
          (r) => r.router !== bestRoute.router
        );
        if (alternative) {
          const altImpact =
            amountInWei > BigInt(alternative.expectedAmountOut)
              ? Number(
                  ((amountInWei - BigInt(alternative.expectedAmountOut)) * BigInt(10000)) /
                    amountInWei
                )
              : 0;
          if (altImpact <= constraints.maxSlippage) {
            bestRoute = alternative;
          }
        }
      }
    }

    if (constraints.minAmountOut) {
      if (BigInt(bestRoute.expectedAmountOut) < BigInt(constraints.minAmountOut)) {
        return null; // No route meets the minimum output requirement
      }
    }

    return bestRoute;
  }
}

// Singleton instance
let dexRoutingServiceInstance: DexRoutingService | null = null;

export function getDexRoutingService(
  rpcUrl?: string,
  chainId?: number,
  uniswapRouterAddress?: string
): DexRoutingService {
  if (!dexRoutingServiceInstance) {
    dexRoutingServiceInstance = new DexRoutingService(rpcUrl, chainId, uniswapRouterAddress);
  }
  return dexRoutingServiceInstance;
}
