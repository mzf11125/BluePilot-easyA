import { Router } from "express";
import {
  getSignalDetectionService,
  TradingSignal,
  AutoTradeConfig,
  AutoTradeResult,
} from "../services/SignalDetectionService.js";

const router = Router();
const signalService = getSignalDetectionService();

/**
 * GET /api/auto-trading/config
 * Get auto-trading configuration for a user
 */
router.get("/config", async (req, res) => {
  try {
    const { userId } = req.query;

    if (typeof userId !== "string" || !userId) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const config = signalService.getAutoTradeConfig(userId);

    if (!config) {
      return res.status(404).json({ error: "Auto-trading config not found" });
    }

    res.json({
      config,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error("Get auto-trading config error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

/**
 * POST /api/auto-trading/config
 * Set or update auto-trading configuration
 */
router.post("/config", async (req, res) => {
  try {
    const config: AutoTradeConfig = req.body;

    // Validate required fields
    if (!config.userId || !config.walletAddress) {
      return res.status(400).json({ error: "Missing required fields: userId, walletAddress" });
    }

    // Set default values
    if (!config.allowedSignalTypes) {
      config.allowedSignalTypes = ["LAUNCH_MOMENTUM", "GRADUATION_IMMINENT"];
    }
    if (!config.riskLevel) {
      config.riskLevel = "MODERATE";
    }
    if (!config.maxTradeSize) {
      config.maxTradeSize = "0.1"; // 0.1 ETH
    }
    if (!config.maxDailyVolume) {
      config.maxDailyVolume = "1"; // 1 ETH
    }
    if (!config.minConfidence) {
      config.minConfidence = 70;
    }
    if (!config.maxOpenPositions) {
      config.maxOpenPositions = 5;
    }

    signalService.registerAutoTradeConfig(config);

    res.json({
      success: true,
      config,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error("Set auto-trading config error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

/**
 * POST /api/auto-trading/start
 * Start auto-trading for a user
 */
router.post("/start", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    const config = signalService.getAutoTradeConfig(userId);

    if (!config) {
      return res.status(404).json({ error: "Auto-trading config not found" });
    }

    signalService.startAutoTrading(config);

    res.json({
      success: true,
      message: "Auto-trading started",
      userId,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error("Start auto-trading error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

/**
 * POST /api/auto-trading/stop
 * Stop auto-trading for a user
 */
router.post("/stop", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    signalService.stopAutoTrading(userId);

    res.json({
      success: true,
      message: "Auto-trading stopped",
      userId,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error("Stop auto-trading error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

/**
 * GET /api/auto-trading/signals
 * Get current trading signals
 */
router.get("/signals", async (req, res) => {
  try {
    const { tokenAddress } = req.query;

    if (!tokenAddress || typeof tokenAddress !== "string") {
      return res.status(400).json({ error: "Invalid token address" });
    }

    const signals = await signalService.getSignalsForToken(tokenAddress);

    res.json({
      tokenAddress,
      signals,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error("Get signals error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

/**
 * GET /api/auto-trading/positions
 * Get open positions for a user
 */
router.get("/positions", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId || typeof userId !== "string") {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const positions = signalService.getOpenPositions(userId);

    res.json({
      userId,
      positions,
      total: positions.length,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error("Get positions error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

/**
 * POST /api/auto-trading/positions/close
 * Close a specific position
 */
router.post("/positions/close", async (req, res) => {
  try {
    const { userId, token } = req.body;

    if (!userId || !token) {
      return res.status(400).json({ error: "Missing userId or token" });
    }

    const result = await signalService.closePosition(userId, token);

    res.json({
      ...result,
      userId,
      token,
    });
  } catch (error: any) {
    console.error("Close position error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

/**
 * GET /api/auto-trading/signals/subscribe
 * Subscribe to signal notifications (SSE endpoint)
 */
router.get("/signals/subscribe", async (req, res) => {
  try {
    const { userId, signalTypes } = req.query;

    // Set headers for SSE
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Parse signal types
    const types = signalTypes
      ? (signalTypes as string).split(",")
      : ["LAUNCH_MOMENTUM", "GRADUATION_IMMINENT"];

    // Subscribe to signals
    const unsubscribers: (() => void)[] = [];

    for (const type of types) {
      const unsub = signalService.onSignal(type as any, (signal: TradingSignal) => {
        res.write(`data: ${JSON.stringify(signal)}\n\n`);
      });
      unsubscribers.push(unsub);
    }

    // Send initial message
    res.write(`data: ${JSON.stringify({ type: "connected", timestamp: Date.now() })}\n\n`);

    // Clean up on client disconnect
    req.on("close", () => {
      for (const unsub of unsubscribers) {
        unsub();
      }
    });
  } catch (error: any) {
    console.error("Signal subscription error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  }
});

/**
 * GET /api/auto-trading/status
 * Get status of auto-trading service
 */
router.get("/status", async (req, res) => {
  try {
    const { userId } = req.query;

    let status: any = {
      running: true,
      timestamp: Date.now(),
    };

    if (userId && typeof userId === "string") {
      const config = signalService.getAutoTradeConfig(userId);
      status = {
        ...status,
        userId,
        enabled: config?.enabled || false,
        hasConfig: !!config,
      };
    }

    res.json(status);
  } catch (error: any) {
    console.error("Get status error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

export default router;
