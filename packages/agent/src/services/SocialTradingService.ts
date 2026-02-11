/**
 * Social Trading Service
 * Service for trader profiles and copy trading functionality
 */

import { ethers } from "ethers";

// Trader profile
export interface TraderProfile {
  address: string;
  username?: string;
  avatar?: string;
  bio?: string;
  stats: {
    totalTrades: number;
    winningTrades: number;
    volumeTraded: string;
    roi: number; // in basis points
    avgHoldTime: number; // in seconds
    sharpeRatio: number;
    maxDrawdown: number; // in basis points
  };
  preferences: {
    allowCopyTrading: boolean;
    copyTradingFee?: number; // in basis points
    minCopyAmount?: string;
  };
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

// Copy trade configuration
export interface CopyTradeConfig {
  copierAddress: string;
  traderAddress: string;
  enabled: boolean;
  allocationPercentage: number; // 1-100, % of portfolio to allocate
  maxTradeSize: string;
  minTradeSize: string;
  copySellTrades: boolean;
  slippageMultiplier: number; // e.g., 1.0 = same slippage, 1.1 = 10% more slippage tolerance
  stopOnTraderLoss: number; // Stop copying if trader loses X% (in basis points)
}

// Trade for copy trading
export interface TradeToCopy {
  traderAddress: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  timestamp: number;
  txHash: string;
}

// Copy trade execution result
export interface CopyTradeResult {
  copierAddress: string;
  traderAddress: string;
  originalTxHash: string;
  newTxHash?: string;
  executed: boolean;
  error?: string;
  amountCopied: string;
  timestamp: number;
}

// Leaderboard entry
export interface LeaderboardEntry {
  rank: number;
  trader: TraderProfile;
  period: "24H" | "7D" | "30D" | "ALL";
  metrics: {
    roi: number;
    volume: string;
    trades: number;
    winRate: number;
  };
}

/**
 * Social Trading Service class
 */
export class SocialTradingService {
  private profiles: Map<string, TraderProfile> = new Map();
  private copyConfigs: Map<string, CopyTradeConfig> = new Map(); // key: copierAddress_traderAddress
  private recentTrades: Map<string, TradeToCopy[]> = new Map(); // key: traderAddress

  constructor() {
    // Initialize with some mock top traders
    this.initializeMockData();
  }

  /**
   * Initialize mock data for testing
   */
  private initializeMockData(): void {
    const mockTraders: TraderProfile[] = [
      {
        address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
        username: "AlphaWhale",
        bio: "Early stage DEX trader. Focus on new launches.",
        stats: {
          totalTrades: 234,
          winningTrades: 178,
          volumeTraded: ethers.parseEther("1500").toString(),
          roi: 3250, // 32.5%
          avgHoldTime: 86400, // 1 day
          sharpeRatio: 2.3,
          maxDrawdown: 850, // 8.5%
        },
        preferences: {
          allowCopyTrading: true,
          copyTradingFee: 100, // 1%
          minCopyAmount: ethers.parseEther("0.1").toString(),
        },
        tags: ["DeFi", "New Launches", "High Risk"],
        createdAt: Date.now() - 86400000 * 30,
        updatedAt: Date.now(),
      },
      {
        address: "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed",
        username: "ConservativeTrader",
        bio: "Low-risk, established tokens only.",
        stats: {
          totalTrades: 89,
          winningTrades: 72,
          volumeTraded: ethers.parseEther("5000").toString(),
          roi: 1200, // 12%
          avgHoldTime: 604800, // 1 week
          sharpeRatio: 3.1,
          maxDrawdown: 250, // 2.5%
        },
        preferences: {
          allowCopyTrading: true,
          copyTradingFee: 50, // 0.5%
          minCopyAmount: ethers.parseEther("0.5").toString(),
        },
        tags: ["Conservative", "Blue Chip"],
        createdAt: Date.now() - 86400000 * 60,
        updatedAt: Date.now(),
      },
    ];

    for (const trader of mockTraders) {
      this.profiles.set(trader.address.toLowerCase(), trader);
    }
  }

  /**
   * Get a trader's profile
   */
  getTraderProfile(traderAddress: string): TraderProfile | null {
    return this.profiles.get(traderAddress.toLowerCase()) || null;
  }

  /**
   * Create or update a trader profile
   */
  setTraderProfile(profile: TraderProfile): void {
    const existing = this.profiles.get(profile.address.toLowerCase());
    if (existing) {
      profile.createdAt = existing.createdAt;
    } else {
      profile.createdAt = Date.now();
    }
    profile.updatedAt = Date.now();
    this.profiles.set(profile.address.toLowerCase(), profile);
  }

  /**
   * Get top traders (leaderboard)
   */
  getLeaderboard(period: "24H" | "7D" | "30D" | "ALL" = "7D", limit: number = 50): LeaderboardEntry[] {
    const traders = Array.from(this.profiles.values());

    // Sort by ROI (in a real implementation, would filter by period)
    const sorted = traders
      .sort((a, b) => b.stats.roi - a.stats.roi)
      .slice(0, limit)
      .map((trader, index) => ({
        rank: index + 1,
        trader,
        period,
        metrics: {
          roi: trader.stats.roi,
          volume: trader.stats.volumeTraded,
          trades: trader.stats.totalTrades,
          winRate: Math.floor((trader.stats.winningTrades / trader.stats.totalTrades) * 100),
        },
      }));

    return sorted;
  }

  /**
   * Search traders by name or tags
   */
  searchTraders(query: string): TraderProfile[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.profiles.values()).filter(
      (trader) =>
        trader.username?.toLowerCase().includes(lowerQuery) ||
        trader.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Set up copy trading configuration
   */
  setCopyTradeConfig(config: CopyTradeConfig): void {
    const key = `${config.copierAddress.toLowerCase()}_${config.traderAddress.toLowerCase()}`;
    this.copyConfigs.set(key, config);
  }

  /**
   * Get copy trading configuration
   */
  getCopyTradeConfig(copierAddress: string, traderAddress: string): CopyTradeConfig | null {
    const key = `${copierAddress.toLowerCase()}_${traderAddress.toLowerCase()}`;
    return this.copyConfigs.get(key) || null;
  }

  /**
   * Get all copy configurations for a copier
   */
  getCopyTradeConfigs(copierAddress: string): CopyTradeConfig[] {
    const configs: CopyTradeConfig[] = [];
    for (const [key, config] of this.copyConfigs) {
      if (config.copierAddress.toLowerCase() === copierAddress.toLowerCase()) {
        configs.push(config);
      }
    }
    return configs;
  }

  /**
   * Enable/disable copy trading
   */
  toggleCopyTrading(copierAddress: string, traderAddress: string, enabled: boolean): void {
    const config = this.getCopyTradeConfig(copierAddress, traderAddress);
    if (config) {
      config.enabled = enabled;
      this.setCopyTradeConfig(config);
    }
  }

  /**
   * Process a trade for copy trading
   */
  async processCopyTrade(trade: TradeToCopy): Promise<CopyTradeResult[]> {
    const results: CopyTradeResult[] = [];

    // Find all copiers of this trader
    for (const [key, config] of this.copyConfigs) {
      if (!config.enabled) {
        continue;
      }

      if (config.traderAddress.toLowerCase() !== trade.traderAddress.toLowerCase()) {
        continue;
      }

      // Check if trader allows copy trading
      const traderProfile = this.getTraderProfile(trade.traderAddress);
      if (!traderProfile || !traderProfile.preferences.allowCopyTrading) {
        continue;
      }

      // Calculate copy amount based on allocation
      const originalAmount = BigInt(trade.amountIn);
      const copyAmount = (originalAmount * BigInt(config.allocationPercentage)) / 100n;

      // Check min/max limits
      if (copyAmount < BigInt(config.minTradeSize)) {
        results.push({
          copierAddress: config.copierAddress,
          traderAddress: trade.traderAddress,
          originalTxHash: trade.txHash,
          executed: false,
          error: "Amount below minimum",
          amountCopied: "0",
          timestamp: Date.now(),
        });
        continue;
      }

      if (copyAmount > BigInt(config.maxTradeSize)) {
        results.push({
          copierAddress: config.copierAddress,
          traderAddress: trade.traderAddress,
          originalTxHash: trade.txHash,
          executed: false,
          error: "Amount exceeds maximum",
          amountCopied: "0",
          timestamp: Date.now(),
        });
        continue;
      }

      // Execute the copy trade
      const result = await this.executeCopyTrade(config, trade, copyAmount.toString());
      results.push(result);
    }

    return results;
  }

  /**
   * Execute a copy trade
   */
  private async executeCopyTrade(
    config: CopyTradeConfig,
    originalTrade: TradeToCopy,
    copyAmount: string
  ): Promise<CopyTradeResult> {
    try {
      // In a real implementation, this would:
      // 1. Get the best route for the copy trade
      // 2. Adjust for slippage multiplier
      // 3. Generate transaction data
      // 4. Send to copier's wallet for signing
      // 5. Wait for confirmation
      // 6. Return the transaction hash

      return {
        copierAddress: config.copierAddress,
        traderAddress: originalTrade.traderAddress,
        originalTxHash: originalTrade.txHash,
        executed: true,
        newTxHash: "0x" + Math.random().toString(16).slice(2), // Mock tx hash
        amountCopied: copyAmount,
        timestamp: Date.now(),
      };
    } catch (error: any) {
      return {
        copierAddress: config.copierAddress,
        traderAddress: originalTrade.traderAddress,
        originalTxHash: originalTrade.txHash,
        executed: false,
        error: error.message,
        amountCopied: "0",
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Record a trade for a trader (used for tracking stats)
   */
  recordTrade(trade: TradeToCopy): void {
    const traderAddress = trade.traderAddress.toLowerCase();
    if (!this.recentTrades.has(traderAddress)) {
      this.recentTrades.set(traderAddress, []);
    }

    const trades = this.recentTrades.get(traderAddress)!;
    trades.push(trade);

    // Keep only last 100 trades
    if (trades.length > 100) {
      trades.shift();
    }

    // Update trader stats
    this.updateTraderStats(traderAddress);
  }

  /**
   * Get recent trades for a trader
   */
  getRecentTrades(traderAddress: string, limit: number = 10): TradeToCopy[] {
    const trades = this.recentTrades.get(traderAddress.toLowerCase()) || [];
    return trades.slice(-limit);
  }

  /**
   * Update trader statistics based on trade history
   */
  private updateTraderStats(traderAddress: string): void {
    const profile = this.getTraderProfile(traderAddress);
    if (!profile) {
      return;
    }

    const trades = this.recentTrades.get(traderAddress) || [];
    profile.stats.totalTrades = trades.length;

    // Calculate win rate (simplified - in reality would track PnL per trade)
    profile.stats.winningTrades = Math.floor(trades.length * 0.65); // Mock 65% win rate

    profile.updatedAt = Date.now();
    this.setTraderProfile(profile);
  }

  /**
   * Calculate performance metrics for a trader
   */
  calculateTraderMetrics(traderAddress: string): {
    sharpeRatio: number;
    maxDrawdown: number;
    roi: number;
  } {
    const profile = this.getTraderProfile(traderAddress);
    if (!profile) {
      return { sharpeRatio: 0, maxDrawdown: 0, roi: 0 };
    }

    // In a real implementation, this would:
    // 1. Fetch all historical trades
    // 2. Calculate returns over time
    // 3. Compute Sharpe ratio, max drawdown, and ROI

    return {
      sharpeRatio: profile.stats.sharpeRatio,
      maxDrawdown: profile.stats.maxDrawdown,
      roi: profile.stats.roi,
    };
  }

  /**
   * Get recommended traders for a user
   */
  getRecommendedTraders(
    userAddress: string,
    riskTolerance: "CONSERVATIVE" | "MODERATE" | "AGGRESSIVE" = "MODERATE"
  ): TraderProfile[] {
    const allTraders = Array.from(this.profiles.values());

    // Filter by risk tolerance and copy trading allowed
    let filtered = allTraders.filter((t) => t.preferences.allowCopyTrading);

    // Apply risk-based filtering
    if (riskTolerance === "CONSERVATIVE") {
      filtered = filtered.filter(
        (t) =>
          t.stats.maxDrawdown < 500 && // Low drawdown
          t.stats.roi > 500 && // Positive ROI but not extreme
          t.tags.includes("Conservative")
      );
    } else if (riskTolerance === "AGGRESSIVE") {
      filtered = filtered.filter(
        (t) =>
          t.stats.roi > 2000 && // High ROI
          t.tags.includes("High Risk") || t.tags.includes("New Launches")
      );
    }

    // Sort by Sharpe ratio (risk-adjusted returns)
    return filtered.sort((a, b) => b.stats.sharpeRatio - a.stats.sharpeRatio).slice(0, 10);
  }

  /**
   * Get trader performance history
   */
  getTraderPerformanceHistory(
    traderAddress: string,
    period: "24H" | "7D" | "30D" | "ALL" = "7D"
  ): {
    timestamp: number;
    value: number;
  }[] {
    // In a real implementation, this would query historical data
    // For now, return mock data
    const points = period === "24H" ? 24 : period === "7D" ? 7 : 30;
    const data = [];
    const now = Date.now();
    const interval = period === "24H" ? 3600000 : period === "7D" ? 86400000 : 86400000;

    for (let i = points; i >= 0; i--) {
      data.push({
        timestamp: now - i * interval,
        value: 100 + Math.random() * 50, // Mock portfolio value
      });
    }

    return data;
  }
}

// Singleton instance
let socialTradingServiceInstance: SocialTradingService | null = null;

export function getSocialTradingService(): SocialTradingService {
  if (!socialTradingServiceInstance) {
    socialTradingServiceInstance = new SocialTradingService();
  }
  return socialTradingServiceInstance;
}
