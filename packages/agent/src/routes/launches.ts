import { Router } from "express";
import { getRobinPumpService, TokenLaunch } from "../services/RobinPumpService.js";
import { getDexRoutingService, RouteResult } from "../services/DexRoutingService.js";

const router = Router();
const robinPumpService = getRobinPumpService();
const dexRoutingService = getDexRoutingService();

/**
 * GET /api/launches
 * Get all active token launches
 */
router.get("/list", async (req, res) => {
  try {
    const { limit, trending } = req.query;

    let launches: TokenLaunch[];

    if (trending === "true") {
      launches = await robinPumpService.getTrendingLaunches(
        limit ? parseInt(limit as string, 10) : 20
      );
    } else {
      launches = await robinPumpService.getActiveLaunches();
      if (limit) {
        launches = launches.slice(0, parseInt(limit as string, 10));
      }
    }

    res.json({
      launches,
      total: launches.length,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error("Get launches error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

/**
 * GET /api/launches/:tokenAddress
 * Get details for a specific token launch
 */
router.get("/:tokenAddress", async (req, res) => {
  try {
    const { tokenAddress } = req.params;

    if (!/^0x[a-fA-F0-9]{40}$/.test(tokenAddress)) {
      return res.status(400).json({ error: "Invalid token address" });
    }

    const launch = await robinPumpService.getLaunch(tokenAddress);

    if (!launch) {
      return res.status(404).json({ error: "Launch not found" });
    }

    // Get bonding curve info
    const bondingCurve = await robinPumpService.getBondingCurve(tokenAddress);

    res.json({
      launch,
      bondingCurve,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error("Get launch error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

/**
 * GET /api/launches/:tokenAddress/price
 * Get price quote for buying/selling a token
 */
router.get("/:tokenAddress/price", async (req, res) => {
  try {
    const { tokenAddress } = req.params;
    const { action, amount } = req.query;

    if (!/^0x[a-fA-F0-9]{40}$/.test(tokenAddress)) {
      return res.status(400).json({ error: "Invalid token address" });
    }

    if (!action || (action !== "buy" && action !== "sell")) {
      return res.status(400).json({ error: "Invalid action, must be 'buy' or 'sell'" });
    }

    if (!amount || isNaN(parseFloat(amount as string))) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    let quote;
    if (action === "buy") {
      quote = await robinPumpService.getBuyPrice(tokenAddress, amount as string);
    } else {
      quote = await robinPumpService.getSellPrice(tokenAddress, amount as string);
    }

    if (!quote) {
      return res.status(404).json({ error: "Quote not available" });
    }

    res.json({
      tokenAddress,
      action,
      amount,
      quote,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error("Get price error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

/**
 * GET /api/launches/:tokenAddress/route
 * Get best route for trading a token
 */
router.get("/:tokenAddress/route", async (req, res) => {
  try {
    const { tokenAddress } = req.params;
    const { amountIn, router } = req.query;

    if (!/^0x[a-fA-F0-9]{40}$/.test(tokenAddress)) {
      return res.status(400).json({ error: "Invalid token address" });
    }

    if (!amountIn || isNaN(parseFloat(amountIn as string))) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    // Compare routes across DEXs
    const comparison = await dexRoutingService.comparePrices(
      "0x0000000000000000000000000000000000000000", // ETH
      tokenAddress,
      amountIn as string,
      {
        preferredRouter: router as any,
        enableRobinPump: true,
      }
    );

    res.json({
      tokenAddress,
      amountIn,
      comparison,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error("Get route error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

/**
 * POST /api/launches/:tokenAddress/buy
 * Generate transaction data for buying a token
 */
router.post("/:tokenAddress/buy", async (req, res) => {
  try {
    const { tokenAddress } = req.params;
    const { ethAmount, minAmountOut, useRobinPump } = req.body;

    if (!/^0x[a-fA-F0-9]{40}$/.test(tokenAddress)) {
      return res.status(400).json({ error: "Invalid token address" });
    }

    if (!ethAmount || isNaN(parseFloat(ethAmount))) {
      return res.status(400).json({ error: "Invalid ETH amount" });
    }

    // Check if token is on RobinPump
    const isRobinPump = await robinPumpService.isRobinPumpToken(tokenAddress);

    let txData;
    if (isRobinPump && (useRobinPump !== false)) {
      // Use RobinPump
      const minOut = minAmountOut || "0";
      txData = robinPumpService.generateBuyTransaction(tokenAddress, ethAmount, minOut);
    } else {
      // Use Uniswap V2 (would need to implement)
      return res.status(501).json({ error: "Uniswap routing not yet implemented" });
    }

    res.json({
      tokenAddress,
      ethAmount,
      txData,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error("Generate buy error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

/**
 * POST /api/launches/:tokenAddress/sell
 * Generate transaction data for selling a token
 */
router.post("/:tokenAddress/sell", async (req, res) => {
  try {
    const { tokenAddress } = req.params;
    const { tokenAmount, minAmountOut, useRobinPump } = req.body;

    if (!/^0x[a-fA-F0-9]{40}$/.test(tokenAddress)) {
      return res.status(400).json({ error: "Invalid token address" });
    }

    if (!tokenAmount || isNaN(parseFloat(tokenAmount))) {
      return res.status(400).json({ error: "Invalid token amount" });
    }

    // Check if token is on RobinPump
    const isRobinPump = await robinPumpService.isRobinPumpToken(tokenAddress);

    let txData;
    if (isRobinPump && (useRobinPump !== false)) {
      // Use RobinPump
      const minOut = minAmountOut || "0";
      txData = robinPumpService.generateSellTransaction(tokenAddress, tokenAmount, minOut);
    } else {
      // Use Uniswap V2 (would need to implement)
      return res.status(501).json({ error: "Uniswap routing not yet implemented" });
    }

    res.json({
      tokenAddress,
      tokenAmount,
      txData,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error("Generate sell error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

/**
 * GET /api/launches/trending
 * Get trending launches
 */
router.get("/trending/list", async (req, res) => {
  try {
    const { limit = "20", period = "24h" } = req.query;

    const launches = await robinPumpService.getTrendingLaunches(
      parseInt(limit as string, 10)
    );

    res.json({
      launches,
      period,
      total: launches.length,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error("Get trending error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

/**
 * GET /api/launches/creator/:creatorAddress
 * Get launches by a specific creator
 */
router.get("/creator/:creatorAddress", async (req, res) => {
  try {
    const { creatorAddress } = req.params;

    if (!/^0x[a-fA-F0-9]{40}$/.test(creatorAddress)) {
      return res.status(400).json({ error: "Invalid creator address" });
    }

    const launches = await robinPumpService.getLaunchesByCreator(creatorAddress);

    res.json({
      creatorAddress,
      launches,
      total: launches.length,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error("Get creator launches error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

export default router;
