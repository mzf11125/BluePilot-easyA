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
  /** RobinPump Router address (optional) */
  robinPumpRouter?: string;
}

export const NETWORKS: Record<number, NetworkConfig> = {
  8453: {
    chainId: 8453,
    name: "Base",
    rpcUrl: process.env.BASE_RPC_URL || "https://mainnet.base.org",
    explorerUrl: "https://basescan.org",
    wethAddress: "0x4200000000000000000000000000000000000006",
    uniswapRouter: "0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24",
    robinPumpRouter: process.env.ROBINPUMP_ROUTER || "0x0000000000000000000000000000000000000000",
  },
  84532: {
    chainId: 84532,
    name: "Base Sepolia",
    rpcUrl: process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
    explorerUrl: "https://sepolia.basescan.org",
    wethAddress: "0x4200000000000000000000000000000000000006",
    uniswapRouter: "0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD",
    robinPumpRouter: process.env.ROBINPUMP_ROUTER || "0x0000000000000000000000000000000000000000",
  },
};

// ============================================================================
// RobinPump Types
// ============================================================================

export interface TokenLaunch {
  /** Token address */
  token: string;
  /** Creator address */
  creator: string;
  /** Token name */
  name: string;
  /** Token symbol */
  symbol: string;
  /** Token image URI */
  image: string;
  /** Token description */
  description: string;
  /** Creation timestamp */
  createdAt: number;
  /** Total ETH raised */
  raisedAmount: string;
  /** Current market cap */
  marketCap: string;
  /** Whether token has graduated to DEX */
  graduated: boolean;
  /** Whether still on bonding curve */
  bondingCurve: boolean;
}

export interface BondingCurveInfo {
  /** Total tokens minted */
  totalSupply: string;
  /** Total ETH raised */
  raisedAmount: string;
  /** ETH amount needed to graduate */
  graduationPoint: string;
  /** Progress towards graduation (basis points) */
  progress: number;
}

// ============================================================================
// Trading Signal Types
// ============================================================================

export type SignalType =
  | "PRICE_SPIKE"
  | "VOLUME_SURGE"
  | "LAUNCH_MOMENTUM"
  | "WHALE_ACCUMULATION"
  | "SOCIAL_SENTIMENT"
  | "GRADUATION_IMMINENT";

export interface TradingSignal {
  /** Unique signal ID */
  id: string;
  /** Signal type */
  type: SignalType;
  /** Token address */
  token: string;
  /** Signal timestamp */
  timestamp: number;
  /** Confidence score (0-100) */
  confidence: number;
  /** Signal metadata */
  metadata: {
    /** Current price */
    currentPrice: string;
    /** Price change (basis points) */
    priceChange: number;
    /** 24h volume */
    volume24h?: string;
    /** Market cap */
    marketCap?: string;
  };
  /** Suggested action */
  action?: "BUY" | "SELL" | "HOLD";
}

// ============================================================================
// Auto Trading Types
// ============================================================================

export type RiskLevel = "CONSERVATIVE" | "MODERATE" | "AGGRESSIVE";

export interface AutoTradeConfig {
  /** Whether auto-trading is enabled */
  enabled: boolean;
  /** User ID */
  userId: string;
  /** User's wallet address */
  walletAddress: string;
  /** Maximum ETH per trade */
  maxTradeSize: string;
  /** Maximum total ETH per day */
  maxDailyVolume: string;
  /** Minimum confidence to execute (0-100) */
  minConfidence: number;
  /** Allowed signal types */
  allowedSignalTypes: SignalType[];
  /** Risk tolerance level */
  riskLevel: RiskLevel;
  /** Stop loss in basis points */
  stopLossBps?: number;
  /** Take profit in basis points */
  takeProfitBps?: number;
  /** Maximum open positions */
  maxOpenPositions: number;
}

export interface AutoTradeResult {
  /** Associated signal ID */
  signalId: string;
  /** Whether trade was executed */
  executed: boolean;
  /** Transaction hash */
  txHash?: string;
  /** Error message if failed */
  error?: string;
  /** Result timestamp */
  timestamp: number;
}

export interface Position {
  /** Token address */
  token: string;
  /** Token amount */
  amount: string;
  /** Entry price */
  entryPrice: string;
  /** Current price */
  currentPrice: string;
  /** Profit/Loss */
  pnl: string;
  /** Position open time */
  openedAt: number;
  /** Signal ID that triggered position */
  signalId: string;
}

// ============================================================================
// Social Trading Types
// ============================================================================

export interface TraderProfile {
  /** Trader address */
  address: string;
  /** Username */
  username?: string;
  /** Avatar URI */
  avatar?: string;
  /** Bio/description */
  bio?: string;
  /** Trading statistics */
  stats: {
    /** Total number of trades */
    totalTrades: number;
    /** Number of winning trades */
    winningTrades: number;
    /** Total volume traded (in wei) */
    volumeTraded: string;
    /** ROI in basis points */
    roi: number;
    /** Average hold time (seconds) */
    avgHoldTime: number;
    /** Sharpe ratio */
    sharpeRatio: number;
    /** Maximum drawdown (basis points) */
    maxDrawdown: number;
  };
  /** Copy trading preferences */
  preferences: {
    /** Whether copy trading is allowed */
    allowCopyTrading: boolean;
    /** Fee charged to copiers (basis points) */
    copyTradingFee?: number;
    /** Minimum amount to copy */
    minCopyAmount?: string;
  };
  /** Trader tags */
  tags: string[];
  /** Profile creation time */
  createdAt: number;
  /** Last update time */
  updatedAt: number;
}

export interface CopyTradeConfig {
  /** Copier's wallet address */
  copierAddress: string;
  /** Trader to copy */
  traderAddress: string;
  /** Whether copying is enabled */
  enabled: boolean;
  /** Percentage of portfolio to allocate */
  allocationPercentage: number;
  /** Maximum trade size */
  maxTradeSize: string;
  /** Minimum trade size */
  minTradeSize: string;
  /** Whether to copy sell trades */
  copySellTrades: boolean;
  /** Slippage multiplier (e.g., 1.0 = same, 1.1 = 10% more tolerance) */
  slippageMultiplier: number;
  /** Stop copying if trader loses X% */
  stopOnTraderLoss: number;
}

export interface CopyTradeResult {
  /** Copier's address */
  copierAddress: string;
  /** Trader being copied */
  traderAddress: string;
  /** Original trade transaction hash */
  originalTxHash: string;
  /** Copy trade transaction hash */
  newTxHash?: string;
  /** Whether copy was executed */
  executed: boolean;
  /** Error if failed */
  error?: string;
  /** Amount that was copied */
  amountCopied: string;
  /** Result timestamp */
  timestamp: number;
}

export interface LeaderboardEntry {
  /** Rank on leaderboard */
  rank: number;
  /** Trader profile */
  trader: TraderProfile;
  /** Time period */
  period: "24H" | "7D" | "30D" | "ALL";
  /** Performance metrics */
  metrics: {
    /** ROI in basis points */
    roi: number;
    /** Volume traded (in wei) */
    volume: string;
    /** Number of trades */
    trades: number;
    /** Win rate percentage */
    winRate: number;
  };
}
