/**
 * Core type definitions for the Agent API
 */

// ============================================================================
// Agent Request/Response Types
// ============================================================================

export interface AgentRequest {
  /** User's natural language command */
  command: string;
  /** User's wallet address */
  userAddress: string;
  /** Optional chain ID */
  chainId?: number;
  /** Optional parameters for the command */
  params?: Record<string, unknown>;
}

export interface SimulateResponse {
  /** Whether the command is valid */
  valid: boolean;
  /** Parsed intent */
  intent: string;
  /** Extracted parameters */
  params: Record<string, unknown>;
  /** Simulated transaction data */
  simulation?: SimulationData;
  /** Error message if invalid */
  error?: string;
}

export interface ExecuteResponse {
  /** Whether execution was successful */
  success: boolean;
  /** Unsigned transaction data */
  transaction?: TransactionData;
  /** Error message if failed */
  error?: string;
}

export interface TransactionData {
  /** Target contract address */
  to: string;
  /** Transaction data */
  data: string;
  /** ETH value to send */
  value: string;
  /** Estimated gas */
  gas?: string;
  /** Gas price */
  gasPrice?: string;
}

export interface SimulationData {
  /** Expected token amounts */
  amounts?: {
    tokenIn: string;
    tokenOut: string;
    amountIn: string;
    amountOut: string;
  };
  /** Price impact */
  priceImpact?: number;
  /** Estimated gas */
  gasUsed?: string;
  /** Protocol fee */
  fee?: string;
}

// ============================================================================
// Policy Types
// ============================================================================

export interface Policy {
  /** Maximum slippage in basis points */
  maxSlippageBps: number;
  /** Maximum trade size in wei */
  maxTradeSize: string;
  /** Cooldown period in seconds */
  cooldownSeconds: number;
  /** List of allowed token addresses */
  tokenAllowlist: string[];
}

export interface PolicyResponse {
  /** User's policy */
  policy: Policy;
  /** Last trade timestamp */
  lastTradeTimestamp: number;
  /** Whether policy exists */
  exists: boolean;
}

// ============================================================================
// Transaction History Types
// ============================================================================

export interface TradeEvent {
  /** Transaction hash */
  txHash: string;
  /** User address */
  user: string;
  /** Input token */
  tokenIn: string;
  /** Output token */
  tokenOut: string;
  /** Amount in */
  amountIn: string;
  /** Amount out */
  amountOut: string;
  /** Timestamp */
  timestamp: number;
  /** Block number */
  blockNumber: number;
}

export interface HistoryRequest {
  /** User address */
  userAddress: string;
  /** Token to filter by (optional) */
  token?: string;
  /** Number of events to return */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
}

export interface HistoryResponse {
  /** List of trades */
  trades: TradeEvent[];
  /** Total count */
  total: number;
}

// ============================================================================
// Token Types
// ============================================================================

export interface TokenInfo {
  /** Token address */
  address: string;
  /** Token symbol */
  symbol: string;
  /** Token name */
  name: string;
  /** Token decimals */
  decimals: number;
  /** Token logo URL */
  logoURI?: string;
}

export interface TokenBalance {
  /** Token info */
  token: TokenInfo;
  /** Balance in wei */
  balance: string;
  /** Balance formatted */
  formatted: string;
  /** USD value (optional) */
  usdValue?: number;
}

export interface PortfolioResponse {
  /** User address */
  address: string;
  /** Total USD value */
  totalValue: number;
  /** Token balances */
  balances: TokenBalance[];
  /** Last updated timestamp */
  updatedAt: number;
}

// ============================================================================
// Command Parsing Types
// ============================================================================

export type CommandType =
  | "swap"
  | "deposit"
  | "withdraw"
  | "set_policy"
  | "get_balance"
  | "get_portfolio"
  | "unknown";

export interface ParsedCommand {
  /** Command type */
  type: CommandType;
  /** Input token address */
  tokenIn?: string;
  /** Output token address */
  tokenOut?: string;
  /** Amount (in wei or human-readable) */
  amount?: string;
  /** Maximum slippage in basis points */
  slippageBps?: number;
  /** Policy parameters */
  policy?: Partial<Policy>;
  /** Whether amount is in human-readable format */
  isHumanAmount?: boolean;
}

// ============================================================================
// Error Types
// ============================================================================

export class AgentError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = "AgentError";
    this.code = code;
  }
}

export const ErrorCodes = {
  INVALID_COMMAND: "INVALID_COMMAND",
  INVALID_AMOUNT: "INVALID_AMOUNT",
  INVALID_TOKEN: "INVALID_TOKEN",
  INSUFFICIENT_BALANCE: "INSUFFICIENT_BALANCE",
  POLICY_VIOLATION: "POLICY_VIOLATION",
  CONTRACT_ERROR: "CONTRACT_ERROR",
  NETWORK_ERROR: "NETWORK_ERROR",
} as const;

// ============================================================================
// RPC Provider Types
// ============================================================================

export interface NetworkConfig {
  /** Chain ID */
  chainId: number;
  /** Network name */
  name: string;
  /** RPC URL */
  rpcUrl: string;
  /** Explorer URL */
  explorerUrl: string;
  /** Wrapped ETH address */
  wethAddress: string;
  /** Uniswap Router address */
  uniswapRouter: string;
}

export const NETWORKS: Record<number, NetworkConfig> = {
  8453: {
    chainId: 8453,
    name: "Base",
    rpcUrl: process.env.BASE_RPC_URL || "https://mainnet.base.org",
    explorerUrl: "https://basescan.org",
    wethAddress: "0x4200000000000000000000000000000000000006",
    uniswapRouter: "0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24",
  },
  84532: {
    chainId: 84532,
    name: "Base Sepolia",
    rpcUrl: process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
    explorerUrl: "https://sepolia.basescan.org",
    wethAddress: "0x4200000000000000000000000000000000000006",
    uniswapRouter: "0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24",
  },
};
