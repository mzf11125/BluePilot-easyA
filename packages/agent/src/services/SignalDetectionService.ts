/**
 * Signal Detection Service
 * Service for detecting trading signals and triggering auto-trades
 */

import { ethers } from "ethers";
import { getRobinPumpService, TokenLaunch } from "./RobinPumpService.js";
import { getDexRoutingService, RouteResult } from "./DexRoutingService.js";

// Signal types
export type SignalType =
  | "PRICE_SPIKE"
  | "VOLUME_SURGE"
  | "LAUNCH_MOMENTUM"
  | "WHALE_ACCUMULATION"
  | "SOCIAL_SENTIMENT"
  | "GRADUATION_IMMINENT";

// Trading signal
export interface TradingSignal {
  id: string;
  type: SignalType;
  token: string;
  timestamp: number;
  confidence: number; // 0-100
  metadata: {
    currentPrice: string;
    priceChange: number; // in basis points
    volume24h?: string;
    marketCap?: string;
    [key: string]: any;
  };
  action?: "BUY" | "SELL" | "HOLD";
}

// Auto-trade configuration
export interface AutoTradeConfig {
  enabled: boolean;
  userId: string;
  walletAddress: string;
  maxTradeSize: string; // Maximum ETH per trade
  maxDailyVolume: string; // Maximum total ETH per day
  minConfidence: number; // Minimum confidence to execute
  allowedSignalTypes: SignalType[];
  riskLevel: "CONSERVATIVE" | "MODERATE" | "AGGRESSIVE";
  stopLossBps?: number; // Stop loss in basis points
  takeProfitBps?: number; // Take profit in basis points
  maxOpenPositions: number;
}

// Auto-trade execution result
export interface AutoTradeResult {
  signalId: string;
  executed: boolean;
  txHash?: string;
  error?: string;
  timestamp: number;
}

// Position tracking
export interface Position {
  token: string;
  amount: string;
  entryPrice: string;
  currentPrice: string;
  pnl: string;
  openedAt: number;
  signalId: string;
}

/**
 * Signal Detection Service class
 */
export class SignalDetectionService {
  private robinPumpService: ReturnType<typeof getRobinPumpService>;
  private dexRoutingService: ReturnType<typeof getDexRoutingService>;
  private activeConfigs: Map<string, AutoTradeConfig> = new Map();
  private openPositions: Map<string, Position[]> = new Map();
  private executedTrades: Map<string, number> = new Map(); // Daily volume tracking
  private signalCallbacks: Map<SignalType, Set<(signal: TradingSignal) => void>> = new Map();

  constructor() {
    this.robinPumpService = getRobinPumpService();
    this.dexRoutingService = getDexRoutingService();

    // Subscribe to RobinPump WebSocket updates
    this.robinPumpService.subscribe("launch_created", this.handleLaunchCreated.bind(this));
    this.robinPumpService.subscribe("price_update", this.handlePriceUpdate.bind(this));
    this.robinPumpService.subscribe("trade", this.handleTrade.bind(this));
  }

  /**
   * Register an auto-trade configuration
   */
  registerAutoTradeConfig(config: AutoTradeConfig): void {
    this.activeConfigs.set(config.userId, config);
    this.openPositions.set(config.userId, []);
    this.executedTrades.set(config.userId, 0);
  }

  /**
   * Unregister an auto-trade configuration
   */
  unregisterAutoTradeConfig(userId: string): void {
    this.activeConfigs.delete(userId);
    this.openPositions.delete(userId);
    this.executedTrades.delete(userId);
  }

  /**
   * Get auto-trade configuration
   */
  getAutoTradeConfig(userId: string): AutoTradeConfig | undefined {
    return this.activeConfigs.get(userId);
  }

  /**
   * Start auto-trading for a user
   */
  startAutoTrading(config: AutoTradeConfig): void {
    config.enabled = true;
    this.registerAutoTradeConfig(config);
  }

  /**
   * Stop auto-trading for a user
   */
  stopAutoTrading(userId: string): void {
    const config = this.activeConfigs.get(userId);
    if (config) {
      config.enabled = false;
    }
  }

  /**
   * Get all active signals for a token
   */
  async getSignalsForToken(tokenAddress: string): Promise<TradingSignal[]> {
    const signals: TradingSignal[] = [];

    // Get token info
    const launch = await this.robinPumpService.getLaunch(tokenAddress);
    if (!launch) {
      return signals;
    }

    // Check for launch momentum signal
    const momentumSignal = await this.detectLaunchMomentum(launch);
    if (momentumSignal) {
      signals.push(momentumSignal);
    }

    // Check for graduation imminent signal
    const graduationSignal = await this.detectGraduationImminent(launch);
    if (graduationSignal) {
      signals.push(graduationSignal);
    }

    return signals;
  }

  /**
   * Detect launch momentum signal
   */
  private async detectLaunchMomentum(launch: TokenLaunch): Promise<TradingSignal | null> {
    if (launch.graduated) {
      return null;
    }

    const raisedAmount = BigInt(launch.raisedAmount);
    const createdAt = launch.createdAt;
    const now = Math.floor(Date.now() / 1000);
    const ageMinutes = (now - createdAt) / 60;

    // Early launch with rapid raising
    if (ageMinutes < 30 && raisedAmount > ethers.parseEther("2")) {
      return {
        id: `momentum_${launch.token}_${now}`,
        type: "LAUNCH_MOMENTUM",
        token: launch.token,
        timestamp: now,
        confidence: 75,
        metadata: {
          currentPrice: raisedAmount.toString(),
          priceChange: 0,
          raisedAmount: raisedAmount.toString(),
          ageMinutes,
        },
        action: "BUY",
      };
    }

    return null;
  }

  /**
   * Detect graduation imminent signal
   */
  private async detectGraduationImminent(launch: TokenLaunch): Promise<TradingSignal | null> {
    if (launch.graduated) {
      return null;
    }

    const bondingCurve = await this.robinPumpService.getBondingCurve(launch.token);
    if (!bondingCurve) {
      return null;
    }

    const progress = bondingCurve.progress; // 0-10000 basis points
    const graduationPoint = BigInt(bondingCurve.graduationPoint);
    const raisedAmount = BigInt(bondingCurve.raisedAmount);

    // Within 10% of graduation
    if (progress >= 9000) {
      return {
        id: `graduating_${launch.token}_${Date.now()}`,
        type: "GRADUATION_IMMINENT",
        token: launch.token,
        timestamp: Date.now(),
        confidence: 90,
        metadata: {
          currentPrice: raisedAmount.toString(),
          priceChange: 0,
          progress,
          graduationPoint: graduationPoint.toString(),
        },
        action: "BUY",
      };
    }

    return null;
  }

  /**
   * Process a signal and potentially execute auto-trade
   */
  async processSignal(signal: TradingSignal): Promise<AutoTradeResult[]> {
    const results: AutoTradeResult[] = [];

    for (const [userId, config] of this.activeConfigs) {
      if (!config.enabled) {
        continue;
      }

      // Check if signal type is allowed
      if (!config.allowedSignalTypes.includes(signal.type)) {
        continue;
      }

      // Check confidence threshold
      if (signal.confidence < config.minConfidence) {
        continue;
      }

      // Check daily volume limit
      const dailyVolume = this.executedTrades.get(userId) || 0;
      if (BigInt(dailyVolume) >= BigInt(config.maxDailyVolume)) {
        continue;
      }

      // Check max positions
      const positions = this.openPositions.get(userId) || [];
      if (positions.length >= config.maxOpenPositions) {
        continue;
      }

      // Execute trade
      const result = await this.executeAutoTrade(userId, signal, config);
      results.push(result);

      if (result.executed) {
        // Update daily volume
        this.executedTrades.set(
          userId,
          Number(dailyVolume) + parseFloat(config.maxTradeSize)
        );

        // Track position
        if (signal.action === "BUY") {
          positions.push({
            token: signal.token,
            amount: config.maxTradeSize,
            entryPrice: signal.metadata.currentPrice,
            currentPrice: signal.metadata.currentPrice,
            pnl: "0",
            openedAt: Date.now(),
            signalId: signal.id,
          });
          this.openPositions.set(userId, positions);
        }
      }
    }

    return results;
  }

  /**
   * Execute an auto-trade based on a signal
   */
  private async executeAutoTrade(
    userId: string,
    signal: TradingSignal,
    config: AutoTradeConfig
  ): Promise<AutoTradeResult> {
    try {
      // Get the best route
      const route = await this.dexRoutingService.getOptimalRoute(
        "0x0000000000000000000000000000000000000000", // ETH
        signal.token,
        config.maxTradeSize,
        {
          maxSlippage: config.riskLevel === "CONSERVATIVE" ? 100 : 300,
          preferRobinPump: signal.type === "LAUNCH_MOMENTUM",
        }
      );

      if (!route) {
        return {
          signalId: signal.id,
          executed: false,
          error: "No valid route found",
          timestamp: Date.now(),
        };
      }

      // Generate transaction data
      // This would be sent to the wallet for signing
      const txData = {
        to: route.route.router,
        data: "", // Would be filled by actual transaction encoding
        value: route.route.router.includes("robinpump") ? config.maxTradeSize : "0",
      };

      // In a real implementation, this would:
      // 1. Send transaction to user's wallet for signing
      // 2. Wait for confirmation
      // 3. Return the transaction hash

      return {
        signalId: signal.id,
        executed: true,
        txHash: "0x" + Math.random().toString(16).slice(2), // Mock tx hash
        timestamp: Date.now(),
      };
    } catch (error: any) {
      return {
        signalId: signal.id,
        executed: false,
        error: error.message,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Get open positions for a user
   */
  getOpenPositions(userId: string): Position[] {
    return this.openPositions.get(userId) || [];
  }

  /**
   * Close a position
   */
  async closePosition(userId: string, token: string): Promise<AutoTradeResult> {
    const positions = this.openPositions.get(userId) || [];
    const positionIndex = positions.findIndex((p) => p.token === token);

    if (positionIndex === -1) {
      return {
        signalId: "",
        executed: false,
        error: "Position not found",
        timestamp: Date.now(),
      };
    }

    const position = positions[positionIndex];

    try {
      // Execute sell trade
      const route = await this.dexRoutingService.getOptimalRoute(
        token,
        "0x0000000000000000000000000000000000000000", // ETH
        position.amount,
        {}
      );

      if (!route) {
        return {
          signalId: position.signalId,
          executed: false,
          error: "No valid route found",
          timestamp: Date.now(),
        };
      }

      // Remove position
      positions.splice(positionIndex, 1);
      this.openPositions.set(userId, positions);

      return {
        signalId: position.signalId,
        executed: true,
        txHash: "0x" + Math.random().toString(16).slice(2), // Mock tx hash
        timestamp: Date.now(),
      };
    } catch (error: any) {
      return {
        signalId: position.signalId,
        executed: false,
        error: error.message,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Subscribe to signal notifications
   */
  onSignal(signalType: SignalType, callback: (signal: TradingSignal) => void): () => void {
    if (!this.signalCallbacks.has(signalType)) {
      this.signalCallbacks.set(signalType, new Set());
    }
    this.signalCallbacks.get(signalType)!.add(callback);

    return () => {
      const callbacks = this.signalCallbacks.get(signalType);
      if (callbacks) {
        callbacks.delete(callback);
      }
    };
  }

  /**
   * Notify subscribers of a signal
   */
  private notifySignal(signal: TradingSignal): void {
    const callbacks = this.signalCallbacks.get(signal.type);
    if (callbacks) {
      callbacks.forEach((cb) => cb(signal));
    }
  }

  /**
   * WebSocket event handlers
   */
  private handleLaunchCreated(msg: any): void {
    if (msg.type === "launch_created") {
      const signal: TradingSignal = {
        id: `new_launch_${msg.data.token}_${Date.now()}`,
        type: "LAUNCH_MOMENTUM",
        token: msg.data.token,
        timestamp: Date.now(),
        confidence: 50,
        metadata: {
          currentPrice: "0",
          priceChange: 0,
        },
        action: "BUY",
      };
      this.notifySignal(signal);
    }
  }

  private handlePriceUpdate(msg: any): void {
    if (msg.type === "price_update") {
      // Analyze price update for signals
      // This would involve checking for price spikes, etc.
    }
  }

  private handleTrade(msg: any): void {
    if (msg.type === "trade") {
      // Analyze trade for signals
      // This would involve checking for whale accumulation, volume surge, etc.
    }
  }

  /**
   * Reset daily volume tracking (call at start of new day)
   */
  resetDailyVolumes(): void {
    for (const userId of this.activeConfigs.keys()) {
      this.executedTrades.set(userId, 0);
    }
  }
}

// Singleton instance
let signalDetectionServiceInstance: SignalDetectionService | null = null;

export function getSignalDetectionService(): SignalDetectionService {
  if (!signalDetectionServiceInstance) {
    signalDetectionServiceInstance = new SignalDetectionService();
  }
  return signalDetectionServiceInstance;
}
