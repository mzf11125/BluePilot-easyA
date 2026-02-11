import { ParsedCommand, CommandType } from "../types/index.js";
import { tokenRegistry } from "./TokenRegistry.js";

/**
 * Number word to number mapping
 */
const NUMBER_WORDS: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  hundred: 100,
  thousand: 1000,
  million: 1000000,
};

/**
 * Parses natural language trading commands
 */
export class CommandParser {
  /**
   * Parse a natural language command
   */
  parse(input: string): ParsedCommand {
    const normalized = input.toLowerCase().trim();

    // Detect command type
    const commandType = this.detectCommandType(normalized);

    const result: ParsedCommand = {
      type: commandType,
    };

    switch (commandType) {
      case "swap":
        return this.parseSwap(normalized, result);
      case "deposit":
        return this.parseDeposit(normalized, result);
      case "withdraw":
        return this.parseWithdraw(normalized, result);
      case "set_policy":
        return this.parseSetPolicy(normalized, result);
      case "get_balance":
      case "get_portfolio":
        return result;
      default:
        return result;
    }
  }

  /**
   * Detect the command type from natural language
   */
  private detectCommandType(input: string): CommandType {
    if (/^swap|trade|exchange/.test(input)) return "swap";
    if (/^deposit|add/.test(input)) return "deposit";
    if (/^withdraw|remove/.test(input)) return "withdraw";
    if (/^set.*policy|update.*policy|change.*policy/.test(input)) return "set_policy";
    if (/^balance|get.*balance/.test(input)) return "get_balance";
    if (/^portfolio|holdings/.test(input)) return "get_portfolio";
    return "unknown";
  }

  /**
   * Parse a swap command
   * Examples:
   *   "swap 1 ETH for USDC"
   *   "trade 0.5 WETH for DAI with 1% slippage"
   */
  private parseSwap(input: string, result: ParsedCommand): ParsedCommand {
    // Extract amount
    const amountMatch = input.match(/(\d+\.?\d*)\s*(\w+)?/);
    if (amountMatch) {
      const amount = amountMatch[1];
      const tokenSymbol = amountMatch[2]?.toUpperCase();
      result.amount = amount;
      result.isHumanAmount = true;
      if (tokenSymbol) {
        result.tokenIn = TOKEN_SYMBOLS[tokenSymbol] || tokenSymbol;
      }
    }

    // Extract output token (after "for", "to", "into")
    const forMatch = input.match(/(?:for|to|into)\s+(\w+)/i);
    if (forMatch) {
      const tokenSymbol = forMatch[1].toUpperCase();
      result.tokenOut = TOKEN_SYMBOLS[tokenSymbol] || tokenSymbol;
    }

    // Extract slippage
    const slippageMatch = input.match(/(\d+\.?\d*)%\s*(?:slippage)?/i);
    if (slippageMatch) {
      result.slippageBps = Math.round(parseFloat(slippageMatch[1]) * 100);
    }

    // Default slippage to 3% if not specified
    if (!result.slippageBps) {
      result.slippageBps = 300;
    }

    // If tokenIn not found but tokenOut is, swap them
    if (!result.tokenIn && result.tokenOut) {
      // Assume ETH is input if not specified
      result.tokenIn = TOKEN_SYMBOLS.ETH;
    }

    return result;
  }

  /**
   * Parse a deposit command
   * Examples:
   *   "deposit 10 ETH"
   *   "add 100 USDC to vault"
   */
  private parseDeposit(input: string, result: ParsedCommand): ParsedCommand {
    const amountMatch = input.match(/(\d+\.?\d*)\s*(\w+)/i);
    if (amountMatch) {
      result.amount = amountMatch[1];
      result.isHumanAmount = true;
      const tokenSymbol = amountMatch[2].toUpperCase();
      result.tokenIn = TOKEN_SYMBOLS[tokenSymbol] || tokenSymbol;
    }

    // Default to ETH if no token specified
    if (!result.tokenIn) {
      result.tokenIn = TOKEN_SYMBOLS.ETH;
    }

    return result;
  }

  /**
   * Parse a withdraw command
   * Examples:
   *   "withdraw 5 ETH"
   *   "remove all USDC"
   */
  private parseWithdraw(input: string, result: ParsedCommand): ParsedCommand {
    const amountMatch = input.match(/(\d+\.?\d*|all)\s*(\w+)?/i);
    if (amountMatch) {
      result.amount = amountMatch[1].toLowerCase() === "all" ? "all" : amountMatch[1];
      result.isHumanAmount = true;
      if (amountMatch[2]) {
        const tokenSymbol = amountMatch[2].toUpperCase();
        result.tokenIn = TOKEN_SYMBOLS[tokenSymbol] || tokenSymbol;
      }
    }

    // Default to ETH if no token specified
    if (!result.tokenIn) {
      result.tokenIn = TOKEN_SYMBOLS.ETH;
    }

    return result;
  }

  /**
   * Parse a set policy command
   * Examples:
   *   "set max slippage to 2%"
   *   "set max trade size to 5 ETH"
   *   "set cooldown to 30 seconds"
   */
  private parseSetPolicy(input: string, result: ParsedCommand): ParsedCommand {
    result.policy = {};

    // Extract slippage
    const slippageMatch = input.match(/(?:slippage|max slippage).*?(\d+\.?\d*)\s*%/i);
    if (slippageMatch) {
      result.policy.maxSlippageBps = Math.round(parseFloat(slippageMatch[1]) * 100);
    }

    // Extract max trade size
    const tradeSizeMatch = input.match(/(?:trade size|max trade).*?(\d+\.?\d*)\s*(\w+)/i);
    if (tradeSizeMatch) {
      result.policy.maxTradeSize = tradeSizeMatch[1];
      result.policy.maxTradeSize; // TODO: Convert to wei based on token
    }

    // Extract cooldown
    const cooldownMatch = input.match(/(?:cooldown).*?(\d+)\s*(second|minute|hour)/i);
    if (cooldownMatch) {
      const value = parseInt(cooldownMatch[1], 10);
      const unit = cooldownMatch[2].toLowerCase();
      if (unit === "second") {
        result.policy.cooldownSeconds = value;
      } else if (unit === "minute") {
        result.policy.cooldownSeconds = value * 60;
      } else if (unit === "hour") {
        result.policy.cooldownSeconds = value * 3600;
      }
    }

    return result;
  }

  /**
   * Convert a token symbol to address
   */
  symbolToAddress(symbol: string): string {
    return tokenRegistry.symbolToAddress(symbol);
  }

  /**
   * Convert an address to token symbol (if known)
   */
  addressToSymbol(address: string): string | null {
    return tokenRegistry.addressToSymbol(address);
  }

  /**
   * Parse amount to wei
   */
  amountToWei(amount: string, decimals: number = 18): bigint {
    const match = amount.match(/^(\d+\.?\d*)$/);
    if (!match) {
      throw new Error(`Invalid amount: ${amount}`);
    }

    const [whole, fractional = ""] = amount.split(".");
    const paddedFractional = fractional.padEnd(decimals, "0").slice(0, decimals);

    return BigInt(whole) * BigInt(10 ** decimals) + BigInt(paddedFractional || 0);
  }

  /**
   * Format wei to human-readable amount
   */
  weiToAmount(wei: bigint, decimals: number = 18): string {
    const divisor = BigInt(10 ** decimals);
    const whole = wei / divisor;
    const fractional = wei % divisor;

    if (fractional === 0n) {
      return whole.toString();
    }

    const fractionalStr = fractional.toString().padStart(decimals, "0");
    const trimmed = fractionalStr.replace(/0+$/, "");
    return `${whole}.${trimmed}`;
  }
}

export const commandParser = new CommandParser();
