/**
 * Contract constants for BluePilot app
 */

import { NETWORKS } from "@/types/network";

// Contract addresses (update these after deployment)
export const CONTRACT_ADDRESSES = {
  VAULT_ROUTER: process.env.EXPO_PUBLIC_VAULT_ROUTER_ADDRESS || "",
  TRADE_EXECUTOR: process.env.EXPO_PUBLIC_TRADE_EXECUTOR_ADDRESS || "",
  POLICY_GUARD: process.env.EXPO_PUBLIC_POLICY_GUARD_ADDRESS || "",
} as const;

// Chain IDs
export const CHAIN_IDS = {
  BASE_MAINNET: 8453,
  BASE_SEPOLIA: 84532,
  ETHEREUM_MAINNET: 1,
  ETHEREUM_SEPOLIA: 11155111,
} as const;

// Default chain ID
export const DEFAULT_CHAIN_ID = CHAIN_IDS.BASE_MAINNET;

// RPC URLs
export const RPC_URLS: Record<number, string> = {
  [CHAIN_IDS.BASE_MAINNET]: "https://mainnet.base.org",
  [CHAIN_IDS.BASE_SEPOLIA]: "https://sepolia.base.org",
  [CHAIN_IDS.ETHEREUM_MAINNET]: "https://eth.llamarpc.com",
  [CHAIN_IDS.ETHEREUM_SEPOLIA]: "https://rpc.sepolia.org",
};

// Explorer URLs
export const EXPLORER_URLS: Record<number, string> = {
  [CHAIN_IDS.BASE_MAINNET]: "https://basescan.org",
  [CHAIN_IDS.BASE_SEPOLIA]: "https://sepolia.basescan.org",
  [CHAIN_IDS.ETHEREUM_MAINNET]: "https://etherscan.io",
  [CHAIN_IDS.ETHEREUM_SEPOLIA]: "https://sepolia.etherscan.io",
};

// Common token addresses on Base
export const TOKEN_ADDRESSES: Record<string, Record<number, string>> = {
  ETH: {
    [CHAIN_IDS.BASE_MAINNET]: "0x0000000000000000000000000000000000000000",
    [CHAIN_IDS.BASE_SEPOLIA]: "0x0000000000000000000000000000000000000000",
  },
  WETH: {
    [CHAIN_IDS.BASE_MAINNET]: "0x4200000000000000000000000000000000000006",
    [CHAIN_IDS.BASE_SEPOLIA]: "0x4200000000000000000000000000000000000006",
  },
  USDC: {
    [CHAIN_IDS.BASE_MAINNET]: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
    [CHAIN_IDS.BASE_SEPOLIA]: "0x036cbd53842c5426664d9a0c2d95eafae888fcd2",
  },
  USDbC: {
    [CHAIN_IDS.BASE_MAINNET]: "0xd9aAEc86B65d86f6A7B5B1b0c42FFA531710b6CA",
    [CHAIN_IDS.BASE_SEPOLIA]: "0xd9aAEc86B65d86f6A7B5B1b0c42FFA531710b6CA",
  },
  DAI: {
    [CHAIN_IDS.BASE_MAINNET]: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
    [CHAIN_IDS.BASE_SEPOLIA]: "0x419955411344640eC0ECaCfd8b57C02F93e92776",
  },
};

// Token metadata
export const TOKEN_METADATA: Record<string, { symbol: string; name: string; decimals: number; color: string }> = {
  ETH: { symbol: "ETH", name: "Ether", decimals: 18, color: "#627EEA" },
  WETH: { symbol: "WETH", name: "Wrapped Ether", decimals: 18, color: "#627EEA" },
  USDC: { symbol: "USDC", name: "USD Coin", decimals: 6, color: "#2775CA" },
  USDbC: { symbol: "USDbC", name: "USD Base Coin", decimals: 6, color: "#0E4F8E" },
  DAI: { symbol: "DAI", name: "Dai Stablecoin", decimals: 18, color: "#F4B731" },
};

// Uniswap V2 Router address on Base
export const UNISWAP_V2_ROUTER = "0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24";

// Gas settings
export const GAS_SETTINGS = {
  maxPriorityFeePerGas: "1000000000", // 1 gwei
  maxFeePerGas: "50000000000", // 50 gwei
  gasLimit: "800000",
} as const;

// Transaction deadlines
export const TX_DEADLINE = 300; // 5 minutes in seconds

// Slippage presets
export const SLIPPAGE_PRESETS = [0.1, 0.5, 1, 3, 5] as const;

// Default slippage (in basis points)
export const DEFAULT_SLIPPAGE_BPS = 300; // 3%

// Max slippage (in basis points)
export const MAX_SLIPPAGE_BPS = 10000; // 100%

// Get token address for current chain
export function getTokenAddress(symbol: string, chainId: number = DEFAULT_CHAIN_ID): string {
  const token = TOKEN_ADDRESSES[symbol.toUpperCase()];
  return token?.[chainId] || "";
}

// Get all supported tokens for a chain
export function getSupportedTokens(chainId: number = DEFAULT_CHAIN_ID): string[] {
  return Object.keys(TOKEN_ADDRESSES).filter(
    (symbol) => TOKEN_ADDRESSES[symbol]?.[chainId]
  );
}

// Format transaction hash for explorer
export function getExplorerTxUrl(txHash: string, chainId: number = DEFAULT_CHAIN_ID): string {
  const baseUrl = EXPLORER_URLS[chainId] || EXPLORER_URLS[DEFAULT_CHAIN_ID];
  return `${baseUrl}/tx/${txHash}`;
}

// Format address for explorer
export function getExplorerAddressUrl(address: string, chainId: number = DEFAULT_CHAIN_ID): string {
  const baseUrl = EXPLORER_URLS[chainId] || EXPLORER_URLS[DEFAULT_CHAIN_ID];
  return `${baseUrl}/address/${address}`;
}
