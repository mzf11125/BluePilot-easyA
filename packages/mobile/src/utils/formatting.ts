/**
 * Formatting utilities for addresses, amounts, and dates
 */

/**
 * Shorten an Ethereum address for display
 * @param address - Full Ethereum address
 * @param startLength - Number of characters to show at start
 * @param endLength - Number of characters to show at end
 * @returns Shortened address (e.g., "0x1234...5678")
 */
export function shortenAddress(
  address: string,
  startLength: number = 6,
  endLength: number = 4
): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
}

/**
 * Format a token amount for display
 * @param amount - Amount in wei (bigint or string)
 * @param decimals - Token decimals
 * @param maxDecimals - Maximum decimals to display
 * @returns Formatted amount string
 */
export function formatAmount(
  amount: bigint | string,
  decimals: number = 18,
  maxDecimals: number = 6
): string {
  const wei = typeof amount === "string" ? BigInt(amount) : amount;
  const divisor = BigInt(10 ** decimals);

  const whole = wei / divisor;
  const fraction = wei % divisor;

  if (fraction === 0n) {
    return whole.toString();
  }

  const fractionStr = fraction.toString().padStart(decimals, "0");
  const trimmed = fractionStr.replace(/0+$/, "");

  // Limit decimal places
  const limitedFraction = trimmed.slice(0, maxDecimals);

  return limitedFraction.length > 0
    ? `${whole}.${limitedFraction}`
    : whole.toString();
}

/**
 * Format a value as USD
 * @param value - Value in dollars
 * @param decimals - Number of decimal places
 * @returns Formatted USD string
 */
export function formatUSD(value: number | string, decimals: number = 2): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

/**
 * Format a number with K/M/B suffixes
 * @param value - Number to format
 * @returns Formatted string with suffix
 */
export function formatCompact(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;

  if (num < 1000) return num.toString();
  if (num < 1_000_000) return (num / 1000).toFixed(1) + "K";
  if (num < 1_000_000_000) return (num / 1_000_000).toFixed(1) + "M";
  return (num / 1_000_000_000).toFixed(1) + "B";
}

/**
 * Convert a human-readable amount to wei
 * @param amount - Amount in human-readable format
 * @param decimals - Token decimals
 * @returns Amount in wei
 */
export function parseAmount(amount: string, decimals: number = 18): bigint {
  const [whole = "0", fraction = "0"] = amount.split(".");

  const paddedFraction = fraction.padEnd(decimals, "0").slice(0, decimals);

  return BigInt(whole) * BigInt(10 ** decimals) + BigInt(paddedFraction || 0);
}

/**
 * Format a timestamp as a relative time
 * @param timestamp - Unix timestamp in seconds
 * @returns Relative time string (e.g., "2 hours ago")
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;

  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return `${Math.floor(diff / 604800)}w ago`;
}

/**
 * Format a timestamp as a date string
 * @param timestamp - Unix timestamp in seconds
 * @param format - Format style
 * @returns Formatted date string
 */
export function formatDate(
  timestamp: number,
  format: "short" | "medium" | "long" = "medium"
): string {
  const date = new Date(timestamp * 1000);

  const options: Intl.DateTimeFormatOptions =
    format === "short"
      ? { month: "short", day: "numeric" }
      : format === "medium"
      ? { month: "short", day: "numeric", year: "numeric" }
      : { month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" };

  return date.toLocaleDateString("en-US", options);
}

/**
 * Format percentage with +/- sign
 * @param value - Percentage value (e.g., 5.2 for +5.2%)
 * @param decimals - Number of decimal places
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * Format gas price to gwei
 * @param gasPrice - Gas price in wei
 * @returns Gas price in gwei
 */
export function formatGasPrice(gasPrice: bigint | string): string {
  const wei = typeof gasPrice === "string" ? BigInt(gasPrice) : gasPrice;
  const gwei = Number(wei) / 1e9;
  return gwei.toFixed(2);
}

/**
 * Calculate percentage change
 * @param oldValue - Old value
 * @param newValue - New value
 * @returns Percentage change
 */
export function calculatePercentageChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return newValue > 0 ? 100 : 0;
  return ((newValue - oldValue) / oldValue) * 100;
}

/**
 * Truncate text with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text
 */
export function truncate(text: string, maxLength: number = 50): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
}

/**
 * Validate Ethereum address
 * @param address - Address to validate
 * @returns Whether address is valid
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Validate email address
 * @param email - Email to validate
 * @returns Whether email is valid
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Convert basis points to percentage
 * @param bps - Basis points (100 = 1%)
 * @returns Percentage value
 */
export function bpsToPercentage(bps: number): number {
  return bps / 100;
}

/**
 * Convert percentage to basis points
 * @param percentage - Percentage value (1 = 1%)
 * @returns Basis points
 */
export function percentageToBps(percentage: number): number {
  return Math.round(percentage * 100);
}

/**
 * Format slippage for display
 * @param bps - Slippage in basis points
 * @returns Formatted slippage string
 */
export function formatSlippage(bps: number): string {
  return `${(bps / 100).toFixed(2)}%`;
}
