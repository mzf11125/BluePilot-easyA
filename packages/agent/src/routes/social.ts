import { Router } from "express";
import {
  getSocialTradingService,
  TraderProfile,
  CopyTradeConfig,
  LeaderboardEntry,
} from "../services/SocialTradingService.js";

const router = Router();
const socialService = getSocialTradingService();

/**
 * GET /api/social/traders
 * Search or list traders
 */
router.get("/traders", async (req, res) => {
  try {
    const { query, limit = "50" } = req.query;

    let traders: TraderProfile[];

    if (query && typeof query === "string") {
      traders = socialService.searchTraders(query);
    } else {
      // Get all traders
      traders = Array.from(
        { length: parseInt(limit as string, 10) },
        (_, i) => socialService.getTraderProfile(`0x${i.toString(16).padStart(40, "0")}`)!
      ).filter((t) => t !== null);
    }

    res.json({
      traders,
      total: traders.length,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error("Get traders error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

/**
 * GET /api/social/traders/:traderAddress
 * Get a specific trader's profile
 */
router.get("/traders/:traderAddress", async (req, res) => {
  try {
    const { traderAddress } = req.params;

    if (!/^0x[a-fA-F0-9]{40}$/.test(traderAddress)) {
      return res.status(400).json({ error: "Invalid trader address" });
    }

    const profile = socialService.getTraderProfile(traderAddress);

    if (!profile) {
      return res.status(404).json({ error: "Trader profile not found" });
    }

    // Get recent trades
    const recentTrades = socialService.getRecentTrades(traderAddress, 10);

    // Get performance metrics
    const metrics = socialService.calculateTraderMetrics(traderAddress);

    res.json({
      profile,
      recentTrades,
      metrics,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error("Get trader error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

/**
 * GET /api/social/leaderboard
 * Get trader leaderboard
 */
router.get("/leaderboard", async (req, res) => {
  try {
    const { period = "7D", limit = "50" } = req.query;

    const leaderboard = socialService.getLeaderboard(
      period as "24H" | "7D" | "30D" | "ALL",
      parseInt(limit as string, 10)
    );

    res.json({
      period,
      leaderboard,
      total: leaderboard.length,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error("Get leaderboard error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

/**
 * GET /api/social/recommendations
 * Get recommended traders for a user
 */
router.get("/recommendations", async (req, res) => {
  try {
    const { userAddress, riskTolerance = "MODERATE" } = req.query;

    if (!userAddress || typeof userAddress !== "string") {
      return res.status(400).json({ error: "Invalid user address" });
    }

    const traders = socialService.getRecommendedTraders(
      userAddress,
      riskTolerance as "CONSERVATIVE" | "MODERATE" | "AGGRESSIVE"
    );

    res.json({
      userAddress,
      riskTolerance,
      traders,
      total: traders.length,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error("Get recommendations error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

/**
 * POST /api/social/copy
 * Set up copy trading
 */
router.post("/copy", async (req, res) => {
  try {
    const config: CopyTradeConfig = req.body;

    // Validate required fields
    if (!config.copierAddress || !config.traderAddress) {
      return res.status(400).json({ error: "Missing required fields: copierAddress, traderAddress" });
    }

    // Validate addresses
    if (!/^0x[a-fA-F0-9]{40}$/.test(config.copierAddress)) {
      return res.status(400).json({ error: "Invalid copier address" });
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(config.traderAddress)) {
      return res.status(400).json({ error: "Invalid trader address" });
    }

    // Check if trader allows copy trading
    const traderProfile = socialService.getTraderProfile(config.traderAddress);
    if (!traderProfile) {
      return res.status(404).json({ error: "Trader profile not found" });
    }

    if (!traderProfile.preferences.allowCopyTrading) {
      return res.status(403).json({ error: "Trader does not allow copy trading" });
    }

    // Set default values
    if (!config.allocationPercentage) {
      config.allocationPercentage = 10; // 10% default
    }
    if (!config.maxTradeSize) {
      config.maxTradeSize = "0.5"; // 0.5 ETH
    }
    if (!config.minTradeSize) {
      config.minTradeSize = "0.01"; // 0.01 ETH
    }
    if (!config.copySellTrades) {
      config.copySellTrades = true;
    }
    if (!config.slippageMultiplier) {
      config.slippageMultiplier = 1.0;
    }
    if (!config.stopOnTraderLoss) {
      config.stopOnTraderLoss = 5000; // 50% loss
    }
    if (config.enabled === undefined) {
      config.enabled = true;
    }

    socialService.setCopyTradeConfig(config);

    // Calculate copy trading fee if applicable
    const feeAmount = traderProfile.preferences.copyTradingFee
      ? (BigInt(config.maxTradeSize) * BigInt(traderProfile.preferences.copyTradingFee)) / 10000n
      : 0n;

    res.json({
      success: true,
      config,
      feeInfo: traderProfile.preferences.copyTradingFee
        ? {
            feeBps: traderProfile.preferences.copyTradingFee,
            feeAmount: feeAmount.toString(),
          }
        : undefined,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error("Set copy trading error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

/**
 * GET /api/social/copy/:copierAddress
 * Get copy trading configurations for a copier
 */
router.get("/copy/:copierAddress", async (req, res) => {
  try {
    const { copierAddress } = req.params;

    if (!/^0x[a-fA-F0-9]{40}$/.test(copierAddress)) {
      return res.status(400).json({ error: "Invalid copier address" });
    }

    const configs = socialService.getCopyTradeConfigs(copierAddress);

    // Enrich with trader profiles
    const enriched = configs.map((config) => {
      const traderProfile = socialService.getTraderProfile(config.traderAddress);
      return {
        ...config,
        trader: traderProfile ? {
          username: traderProfile.username,
          stats: traderProfile.stats,
        } : null,
      };
    });

    res.json({
      copierAddress,
      configs: enriched,
      total: configs.length,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error("Get copy configs error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

/**
 * PUT /api/social/copy/:copierAddress/:traderAddress/toggle
 * Toggle copy trading on/off
 */
router.put("/copy/:copierAddress/:traderAddress/toggle", async (req, res) => {
  try {
    const { copierAddress, traderAddress } = req.params;
    const { enabled } = req.body;

    if (!/^0x[a-fA-F0-9]{40}$/.test(copierAddress)) {
      return res.status(400).json({ error: "Invalid copier address" });
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(traderAddress)) {
      return res.status(400).json({ error: "Invalid trader address" });
    }

    if (typeof enabled !== "boolean") {
      return res.status(400).json({ error: "Missing or invalid enabled field" });
    }

    socialService.toggleCopyTrading(copierAddress, traderAddress, enabled);

    const config = socialService.getCopyTradeConfig(copierAddress, traderAddress);

    res.json({
      success: true,
      config,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error("Toggle copy trading error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

/**
 * DELETE /api/social/copy/:copierAddress/:traderAddress
 * Stop copy trading
 */
router.delete("/copy/:copierAddress/:traderAddress", async (req, res) => {
  try {
    const { copierAddress, traderAddress } = req.params;

    if (!/^0x[a-fA-F0-9]{40}$/.test(copierAddress)) {
      return res.status(400).json({ error: "Invalid copier address" });
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(traderAddress)) {
      return res.status(400).json({ error: "Invalid trader address" });
    }

    // Disable the config
    socialService.toggleCopyTrading(copierAddress, traderAddress, false);

    res.json({
      success: true,
      message: "Copy trading stopped",
      copierAddress,
      traderAddress,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error("Stop copy trading error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

/**
 * GET /api/social/traders/:traderAddress/performance
 * Get trader performance history
 */
router.get("/traders/:traderAddress/performance", async (req, res) => {
  try {
    const { traderAddress } = req.params;
    const { period = "7D" } = req.query;

    if (!/^0x[a-fA-F0-9]{40}$/.test(traderAddress)) {
      return res.status(400).json({ error: "Invalid trader address" });
    }

    const history = socialService.getTraderPerformanceHistory(
      traderAddress,
      period as "24H" | "7D" | "30D" | "ALL"
    );

    res.json({
      traderAddress,
      period,
      history,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error("Get trader performance error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

export default router;
