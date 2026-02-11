import { Router } from "express";
import { commandParser } from "../services/CommandParser.js";
import { getContractService } from "../services/ContractService.js";
import {
  AgentRequest,
  SimulateResponse,
  ExecuteResponse,
  TransactionData,
  AgentError,
  ErrorCodes,
} from "../types/index.js";

const router = Router();
const VAULT_ROUTER_ADDRESS = process.env.VAULT_ROUTER_ADDRESS || "";
const TRADE_EXECUTOR_ADDRESS = process.env.TRADE_EXECUTOR_ADDRESS || "";

/**
 * POST /api/agent/simulate
 * Parse a natural language command and simulate the transaction
 */
router.post("/simulate", async (req, res) => {
  try {
    const { command, userAddress, chainId } = req.body as AgentRequest;

    if (!VAULT_ROUTER_ADDRESS) {
      return res.status(500).json({
        valid: false,
        error: "VaultRouter contract not configured",
      });
    }

    // Parse the command
    const parsed = commandParser.parse(command);

    const response: SimulateResponse = {
      valid: parsed.type !== "unknown",
      intent: parsed.type,
      params: parsed as unknown as Record<string, unknown>,
    };

    if (parsed.type === "swap" && parsed.tokenIn && parsed.tokenOut && parsed.amount) {
      try {
        const contractService = getContractService(undefined, chainId);

        // Get token info
        const [tokenInInfo, tokenOutInfo] = await Promise.all([
          contractService.getTokenInfo(parsed.tokenIn),
          contractService.getTokenInfo(parsed.tokenOut),
        ]);

        // Get user balance
        const balance = await contractService.getVaultBalance(
          VAULT_ROUTER_ADDRESS,
          userAddress,
          parsed.tokenIn
        );

        // Check if balance is sufficient
        const amountWei =
          parsed.isHumanAmount && parsed.tokenIn === "0x0000000000000000000000000000000000000000"
            ? BigInt(Math.floor(parseFloat(parsed.amount) * 1e18))
            : BigInt(Math.floor(parseFloat(parsed.amount) * 1e18));

        if (balance < amountWei) {
          response.error = `Insufficient ${tokenInInfo.symbol} balance. Have: ${balance}, Need: ${amountWei}`;
          response.valid = false;
        }

        // Simulate trade
        const simulation = await contractService.simulateTrade(
          VAULT_ROUTER_ADDRESS,
          parsed.tokenIn,
          parsed.tokenOut,
          parsed.amount
        );

        response.simulation = {
          ...simulation,
          amounts: {
            ...simulation.amounts!,
            tokenIn: parsed.tokenIn,
            tokenOut: parsed.tokenOut,
          },
        };
      } catch (error: any) {
        response.error = error.message;
        response.valid = false;
      }
    } else if (parsed.type === "unknown") {
      response.error = "Unable to parse command. Please try a different phrasing.";
    }

    res.json(response);
  } catch (error: any) {
    console.error("Simulation error:", error);
    res.status(500).json({
      valid: false,
      error: error.message || "Internal server error",
    });
  }
});

/**
 * POST /api/agent/execute
 * Generate an unsigned transaction for a natural language command
 */
router.post("/execute", async (req, res) => {
  try {
    const { command, userAddress } = req.body as AgentRequest;

    if (!VAULT_ROUTER_ADDRESS) {
      return res.status(500).json({
        success: false,
        error: "VaultRouter contract not configured",
      });
    }

    // Parse the command
    const parsed = commandParser.parse(command);

    if (parsed.type === "unknown") {
      return res.status(400).json({
        success: false,
        error: "Unable to parse command",
      });
    }

    const contractService = getContractService();
    let transaction: TransactionData | undefined;

    switch (parsed.type) {
      case "swap": {
        if (!parsed.tokenIn || !parsed.tokenOut || !parsed.amount) {
          throw new AgentError("Missing swap parameters", ErrorCodes.INVALID_COMMAND);
        }

        // Simulate first to get expected output
        const simulation = await contractService.simulateTrade(
          VAULT_ROUTER_ADDRESS,
          parsed.tokenIn,
          parsed.tokenOut,
          parsed.amount
        );

        // Calculate minimum amount out with slippage
        const slippageBps = parsed.slippageBps || 300;
        const amountOut = BigInt(simulation.amounts!.amountOut);
        const minAmountOut = (amountOut * BigInt(10000 - slippageBps)) / 10000n;

        // Generate transaction
        transaction = await contractService.generateTradeTransaction(
          VAULT_ROUTER_ADDRESS,
          parsed.tokenIn,
          parsed.tokenOut,
          parsed.amount,
          minAmountOut.toString()
        );
        break;
      }

      case "deposit": {
        if (!parsed.tokenIn || !parsed.amount) {
          throw new AgentError("Missing deposit parameters", ErrorCodes.INVALID_COMMAND);
        }

        transaction = contractService.generateDepositTransaction(
          VAULT_ROUTER_ADDRESS,
          parsed.tokenIn,
          parsed.amount
        );
        break;
      }

      case "withdraw": {
        if (!parsed.tokenIn || !parsed.amount) {
          throw new AgentError("Missing withdrawal parameters", ErrorCodes.INVALID_COMMAND);
        }

        const amount = parsed.amount === "all" ? "0" : parsed.amount; // 0 signals withdrawAll in contract

        transaction = contractService.generateWithdrawTransaction(
          VAULT_ROUTER_ADDRESS,
          parsed.tokenIn,
          amount
        );
        break;
      }

      case "set_policy": {
        const policy = parsed.policy || {};
        transaction = contractService.generatePolicyTransaction(
          VAULT_ROUTER_ADDRESS,
          userAddress,
          {
            maxSlippageBps: policy.maxSlippageBps || 300,
            maxTradeSize: policy.maxTradeSize || "10",
            cooldownSeconds: policy.cooldownSeconds || 60,
            tokenAllowlist: policy.tokenAllowlist || [],
          }
        );
        break;
      }

      default:
        throw new AgentError(`Unsupported command type: ${parsed.type}`, ErrorCodes.INVALID_COMMAND);
    }

    // Estimate gas
    if (transaction) {
      const gas = await contractService.estimateGas(
        transaction.to,
        transaction.data,
        userAddress,
        transaction.value
      );
      transaction.gas = gas.toString();
    }

    res.json({
      success: true,
      transaction,
    } as ExecuteResponse);
  } catch (error: any) {
    console.error("Execute error:", error);

    if (error instanceof AgentError) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
});

/**
 * GET /api/agent/policy
 * Get user's trading policy
 */
router.get("/policy", async (req, res) => {
  try {
    const { userAddress } = req.query;

    if (typeof userAddress !== "string" || !/^0x[a-fA-F0-9]{40}$/.test(userAddress)) {
      return res.status(400).json({ error: "Invalid user address" });
    }

    if (!VAULT_ROUTER_ADDRESS) {
      return res.status(500).json({ error: "VaultRouter contract not configured" });
    }

    const contractService = getContractService();
    const policy = await contractService.getPolicy(VAULT_ROUTER_ADDRESS, userAddress);

    // Check if policy exists (has been set)
    const exists = policy.maxTradeSize !== "0";

    res.json({
      policy,
      lastTradeTimestamp: 0,
      exists,
    });
  } catch (error: any) {
    console.error("Get policy error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

/**
 * POST /api/agent/policy
 * Update user's trading policy
 */
router.post("/policy", async (req, res) => {
  try {
    const { userAddress, maxSlippageBps, maxTradeSize, cooldownSeconds, tokenAllowlist } = req.body;

    if (!userAddress || !/^0x[a-fA-F0-9]{40}$/.test(userAddress)) {
      return res.status(400).json({ error: "Invalid user address" });
    }

    if (!VAULT_ROUTER_ADDRESS) {
      return res.status(500).json({ error: "VaultRouter contract not configured" });
    }

    const contractService = getContractService();

    const transaction = contractService.generatePolicyTransaction(
      VAULT_ROUTER_ADDRESS,
      userAddress,
      {
        maxSlippageBps: maxSlippageBps || 300,
        maxTradeSize: maxTradeSize || "10",
        cooldownSeconds: cooldownSeconds || 60,
        tokenAllowlist: tokenAllowlist || [],
      }
    );

    // Add gas estimate
    const gas = await contractService.estimateGas(transaction.to, transaction.data, userAddress, "0");
    transaction.gas = gas.toString();

    res.json({
      success: true,
      transaction,
    });
  } catch (error: any) {
    console.error("Set policy error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

/**
 * GET /api/agent/history
 * Get user's trade history
 */
router.get("/history", async (req, res) => {
  try {
    const { userAddress, token, limit = "50", offset = "0" } = req.query;

    if (typeof userAddress !== "string" || !/^0x[a-fA-F0-9]{40}$/.test(userAddress)) {
      return res.status(400).json({ error: "Invalid user address" });
    }

    if (!VAULT_ROUTER_ADDRESS) {
      return res.status(500).json({ error: "VaultRouter contract not configured" });
    }

    const contractService = getContractService();
    const events = await contractService.getTradeEvents(
      VAULT_ROUTER_ADDRESS,
      userAddress,
      parseInt(limit as string, 10)
    );

    // Apply token filter if specified
    const filteredEvents = token
      ? events.filter((e) => e.tokenIn === token || e.tokenOut === token)
      : events;

    res.json({
      trades: filteredEvents,
      total: filteredEvents.length,
    });
  } catch (error: any) {
    console.error("Get history error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

/**
 * GET /api/agent/balance
 * Get user's vault balance
 */
router.get("/balance", async (req, res) => {
  try {
    const { userAddress, token } = req.query;

    if (typeof userAddress !== "string" || !/^0x[a-fA-F0-9]{40}$/.test(userAddress)) {
      return res.status(400).json({ error: "Invalid user address" });
    }

    if (!VAULT_ROUTER_ADDRESS) {
      return res.status(500).json({ error: "VaultRouter contract not configured" });
    }

    const contractService = getContractService();
    const tokenAddress = token
      ? (token as string)
      : "0x0000000000000000000000000000000000000000";

    const balance = await contractService.getVaultBalance(
      VAULT_ROUTER_ADDRESS,
      userAddress,
      tokenAddress
    );

    const tokenInfo = await contractService.getTokenInfo(tokenAddress);

    res.json({
      token: tokenAddress,
      symbol: tokenInfo.symbol,
      decimals: tokenInfo.decimals,
      balance: balance.toString(),
      formatted: (Number(balance) / 1e18).toFixed(6),
    });
  } catch (error: any) {
    console.error("Get balance error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

/**
 * GET /api/agent/health
 * Health check endpoint
 */
router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: Date.now(),
    contracts: {
      vaultRouter: VAULT_ROUTER_ADDRESS,
      tradeExecutor: TRADE_EXECUTOR_ADDRESS,
    },
  });
});

export default router;
