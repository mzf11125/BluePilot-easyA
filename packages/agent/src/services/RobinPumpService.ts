/**
 * RobinPump Service
 * Service for interacting with RobinPump (pump.fun-style token launch platform on Base)
 */

import { ethers, Contract } from "ethers";
import WebSocket from "ws";

// RobinPump ABI (partial - only the functions we need)
const ROBINPUMP_ROUTER_ABI = [
  // View functions
  {
    inputs: [{ name: "token", type: "address" }],
    name: "getLaunch",
    outputs: [
      { name: "token", type: "address" },
      { name: "creator", type: "address" },
      { name: "name", type: "string" },
      { name: "symbol", type: "string" },
      { name: "image", type: "string" },
      { name: "description", type: "string" },
      { name: "createdAt", type: "uint256" },
      { name: "raisedAmount", type: "uint256" },
      { name: "marketCap", type: "uint256" },
      { name: "graduated", type: "bool" },
      { name: "bondingCurve", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "token", type: "address" }],
    name: "isRobinPumpToken",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "token", type: "address" }],
    name: "getBondingCurve",
    outputs: [
      { name: "totalSupply", type: "uint256" },
      { name: "raisedAmount", type: "uint256" },
      { name: "graduationPoint", type: "uint256" },
      { name: "progress", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "token", type: "address" },
      { name: "ethAmount", type: "uint256" },
    ],
    name: "getBuyPrice",
    outputs: [{ name: "tokenAmount", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "token", type: "address" },
      { name: "tokenAmount", type: "uint256" },
    ],
    name: "getSellPrice",
    outputs: [{ name: "ethAmount", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getActiveLaunches",
    outputs: [
      {
        components: [
          { name: "token", type: "address" },
          { name: "creator", type: "address" },
          { name: "name", type: "string" },
          { name: "symbol", type: "string" },
          { name: "image", type: "string" },
          { name: "description", type: "string" },
          { name: "createdAt", type: "uint256" },
          { name: "raisedAmount", type: "uint256" },
          { name: "marketCap", type: "uint256" },
          { name: "graduated", type: "bool" },
          { name: "bondingCurve", type: "bool" },
        ],
        name: "launches",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "limit", type: "uint256" }],
    name: "getTrendingLaunches",
    outputs: [
      {
        components: [
          { name: "token", type: "address" },
          { name: "creator", type: "address" },
          { name: "name", type: "string" },
          { name: "symbol", type: "string" },
          { name: "image", type: "string" },
          { name: "description", type: "string" },
          { name: "createdAt", type: "uint256" },
          { name: "raisedAmount", type: "uint256" },
          { name: "marketCap", type: "uint256" },
          { name: "graduated", type: "bool" },
          { name: "bondingCurve", type: "bool" },
        ],
        name: "launches",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

// Token launch interface
export interface TokenLaunch {
  token: string;
  creator: string;
  name: string;
  symbol: string;
  image: string;
  description: string;
  createdAt: number;
  raisedAmount: string;
  marketCap: string;
  graduated: boolean;
  bondingCurve: boolean;
}

// Bonding curve info
export interface BondingCurveInfo {
  totalSupply: string;
  raisedAmount: string;
  graduationPoint: string;
  progress: number; // 0-10000 basis points
}

// Price quote
export interface PriceQuote {
  tokenAmount: string;
  ethAmount: string;
  priceImpact: number;
}

// WebSocket message types
type WebSocketMessage =
  | { type: "launch_created"; data: TokenLaunch }
  | { type: "launch_graduated"; data: { token: string } }
  | { type: "price_update"; data: { token: string; price: string } }
  | { type: "trade"; data: { token: string; type: "buy" | "sell"; amount: string } };

/**
 * RobinPump Service class
 */
export class RobinPumpService {
  private provider: ethers.JsonRpcProvider;
  private router: Contract | null = null;
  private routerAddress: string;
  private ws: WebSocket | null = null;
  private subscribers: Map<string, Set<(msg: WebSocketMessage) => void>> = new Map();

  constructor(rpcUrl?: string, routerAddress?: string) {
    this.provider = new ethers.JsonRpcProvider(
      rpcUrl || process.env.BASE_RPC_URL || "https://mainnet.base.org"
    );
    this.routerAddress = routerAddress || process.env.ROBINPUMP_ROUTER || "";

    if (this.routerAddress) {
      this.router = new Contract(this.routerAddress, ROBINPUMP_ROUTER_ABI, this.provider);
    }
  }

  /**
   * Initialize the service with router address
   */
  initialize(routerAddress: string): void {
    this.routerAddress = routerAddress;
    this.router = new Contract(routerAddress, ROBINPUMP_ROUTER_ABI, this.provider);
  }

  /**
   * Check if a token is a RobinPump token
   */
  async isRobinPumpToken(tokenAddress: string): Promise<boolean> {
    if (!this.router) {
      throw new Error("RobinPump router not initialized");
    }

    try {
      return await this.router.isRobinPumpToken(tokenAddress);
    } catch (error) {
      return false;
    }
  }

  /**
   * Get launch information for a token
   */
  async getLaunch(tokenAddress: string): Promise<TokenLaunch | null> {
    if (!this.router) {
      throw new Error("RobinPump router not initialized");
    }

    try {
      const launch = await this.router.getLaunch(tokenAddress);
      return {
        token: launch.token,
        creator: launch.creator,
        name: launch.name,
        symbol: launch.symbol,
        image: launch.image,
        description: launch.description,
        createdAt: Number(launch.createdAt),
        raisedAmount: launch.raisedAmount.toString(),
        marketCap: launch.marketCap.toString(),
        graduated: launch.graduated,
        bondingCurve: launch.bondingCurve,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Get bonding curve information for a token
   */
  async getBondingCurve(tokenAddress: string): Promise<BondingCurveInfo | null> {
    if (!this.router) {
      throw new Error("RobinPump router not initialized");
    }

    try {
      const curve = await this.router.getBondingCurve(tokenAddress);
      return {
        totalSupply: curve.totalSupply.toString(),
        raisedAmount: curve.raisedAmount.toString(),
        graduationPoint: curve.graduationPoint.toString(),
        progress: Number(curve.progress),
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Get buy price quote
   */
  async getBuyPrice(tokenAddress: string, ethAmount: string): Promise<PriceQuote | null> {
    if (!this.router) {
      throw new Error("RobinPump router not initialized");
    }

    try {
      const tokenAmount = await this.router.getBuyPrice(
        tokenAddress,
        ethers.parseEther(ethAmount)
      );
      return {
        tokenAmount: tokenAmount.toString(),
        ethAmount,
        priceImpact: 0, // TODO: Calculate actual price impact
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Get sell price quote
   */
  async getSellPrice(tokenAddress: string, tokenAmount: string): Promise<PriceQuote | null> {
    if (!this.router) {
      throw new Error("RobinPump router not initialized");
    }

    try {
      const ethAmount = await this.router.getSellPrice(
        tokenAddress,
        ethers.parseEther(tokenAmount)
      );
      return {
        tokenAmount,
        ethAmount: ethAmount.toString(),
        priceImpact: 0, // TODO: Calculate actual price impact
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Get all active launches
   */
  async getActiveLaunches(): Promise<TokenLaunch[]> {
    if (!this.router) {
      throw new Error("RobinPump router not initialized");
    }

    try {
      const launches = await this.router.getActiveLaunches();
      return launches.map((l: any) => ({
        token: l.token,
        creator: l.creator,
        name: l.name,
        symbol: l.symbol,
        image: l.image,
        description: l.description,
        createdAt: Number(l.createdAt),
        raisedAmount: l.raisedAmount.toString(),
        marketCap: l.marketCap.toString(),
        graduated: l.graduated,
        bondingCurve: l.bondingCurve,
      }));
    } catch (error) {
      return [];
    }
  }

  /**
   * Get trending launches
   */
  async getTrendingLaunches(limit: number = 10): Promise<TokenLaunch[]> {
    if (!this.router) {
      throw new Error("RobinPump router not initialized");
    }

    try {
      const launches = await this.router.getTrendingLaunches(limit);
      return launches.map((l: any) => ({
        token: l.token,
        creator: l.creator,
        name: l.name,
        symbol: l.symbol,
        image: l.image,
        description: l.description,
        createdAt: Number(l.createdAt),
        raisedAmount: l.raisedAmount.toString(),
        marketCap: l.marketCap.toString(),
        graduated: l.graduated,
        bondingCurve: l.bondingCurve,
      }));
    } catch (error) {
      return [];
    }
  }

  /**
   * Get launches by a specific creator
   */
  async getLaunchesByCreator(creatorAddress: string): Promise<TokenLaunch[]> {
    // This would need to be implemented via subgraph or indexer
    // For now, get all active launches and filter
    const allLaunches = await this.getActiveLaunches();
    return allLaunches.filter((l) => l.creator.toLowerCase() === creatorAddress.toLowerCase());
  }

  /**
   * Connect to RobinPump WebSocket for real-time updates
   */
  connectWebSocket(wsUrl?: string): void {
    const url = wsUrl || process.env.ROBINPUMP_WS_URL || "wss://api.robinpump.io/ws";

    this.ws = new WebSocket(url);

    this.ws.on("open", () => {
      console.log("RobinPump WebSocket connected");
    });

    this.ws.on("message", (data: string) => {
      try {
        const message: WebSocketMessage = JSON.parse(data);
        this.notifySubscribers(message);
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    });

    this.ws.on("error", (error) => {
      console.error("RobinPump WebSocket error:", error);
    });

    this.ws.on("close", () => {
      console.log("RobinPump WebSocket disconnected");
      // Attempt to reconnect after 5 seconds
      setTimeout(() => this.connectWebSocket(url), 5000);
    });
  }

  /**
   * Subscribe to WebSocket messages
   */
  subscribe(messageType: string, callback: (msg: WebSocketMessage) => void): () => void {
    if (!this.subscribers.has(messageType)) {
      this.subscribers.set(messageType, new Set());
    }
    this.subscribers.get(messageType)!.add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(messageType);
      if (callbacks) {
        callbacks.delete(callback);
      }
    };
  }

  /**
   * Notify subscribers of a message
   */
  private notifySubscribers(message: WebSocketMessage): void {
    const callbacks = this.subscribers.get(message.type);
    if (callbacks) {
      callbacks.forEach((cb) => cb(message));
    }
  }

  /**
   * Disconnect WebSocket
   */
  disconnectWebSocket(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Generate transaction data for buying tokens
   */
  generateBuyTransaction(tokenAddress: string, ethAmount: string, minAmountOut: string) {
    if (!this.router) {
      throw new Error("RobinPump router not initialized");
    }

    const iface = new ethers.Interface(ROBINPUMP_ROUTER_ABI);
    const data = iface.encodeFunctionData("buy", [tokenAddress, minAmountOut]);

    return {
      to: this.routerAddress,
      data,
      value: ethers.parseEther(ethAmount).toString(),
    };
  }

  /**
   * Generate transaction data for selling tokens
   */
  generateSellTransaction(tokenAddress: string, tokenAmount: string, minAmountOut: string) {
    if (!this.router) {
      throw new Error("RobinPump router not initialized");
    }

    const iface = new ethers.Interface(ROBINPUMP_ROUTER_ABI);
    const data = iface.encodeFunctionData("sell", [
      tokenAddress,
      ethers.parseEther(tokenAmount),
      minAmountOut,
    ]);

    return {
      to: this.routerAddress,
      data,
      value: "0",
    };
  }
}

// Singleton instance
let robinPumpServiceInstance: RobinPumpService | null = null;

export function getRobinPumpService(rpcUrl?: string, routerAddress?: string): RobinPumpService {
  if (!robinPumpServiceInstance) {
    robinPumpServiceInstance = new RobinPumpService(rpcUrl, routerAddress);
  }
  return robinPumpServiceInstance;
}
