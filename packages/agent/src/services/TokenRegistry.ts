interface TokenInfo {
  symbol: string;
  address: string;
  decimals: number;
  name?: string;
}

const TOKEN_CACHE = new Map<string, TokenInfo>();
const CACHE_TTL = 3600000;
let lastFetch = 0;

const FALLBACK_TOKENS: Record<string, TokenInfo> = {
  ETH: { symbol: "ETH", address: "0x0000000000000000000000000000000000000000", decimals: 18 },
  WETH: { symbol: "WETH", address: "0x4200000000000000000000000000000000000006", decimals: 18 },
  USDC: { symbol: "USDC", address: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913", decimals: 6 },
  USDbC: { symbol: "USDbC", address: "0xd9aAEc86B65d86f6A7B5B1b0c42FFA531710b6CA", decimals: 6 },
  DAI: { symbol: "DAI", address: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb", decimals: 18 },
};

export class TokenRegistry {
  private static instance: TokenRegistry;

  private constructor() {
    this.initializeCache();
  }

  static getInstance(): TokenRegistry {
    if (!TokenRegistry.instance) {
      TokenRegistry.instance = new TokenRegistry();
    }
    return TokenRegistry.instance;
  }

  private initializeCache(): void {
    for (const [symbol, info] of Object.entries(FALLBACK_TOKENS)) {
      TOKEN_CACHE.set(symbol, info);
      TOKEN_CACHE.set(info.address.toLowerCase(), info);
    }
  }

  async getTokenBySymbol(symbol: string): Promise<TokenInfo | null> {
    const upper = symbol.toUpperCase();
    const cached = TOKEN_CACHE.get(upper);
    if (cached) return cached;

    if (Date.now() - lastFetch > CACHE_TTL) {
      await this.refreshTokens();
      return TOKEN_CACHE.get(upper) || FALLBACK_TOKENS[upper] || null;
    }

    return FALLBACK_TOKENS[upper] || null;
  }

  symbolToAddress(symbol: string): string {
    const upper = symbol.toUpperCase();
    const cached = TOKEN_CACHE.get(upper);
    return cached?.address || FALLBACK_TOKENS[upper]?.address || symbol;
  }

  addressToSymbol(address: string): string | null {
    const lower = address.toLowerCase();
    const cached = TOKEN_CACHE.get(lower);
    return cached?.symbol || null;
  }

  private async refreshTokens(): Promise<void> {
    try {
      const response = await fetch("https://api.coingecko.com/api/v3/coins/list?include_platform=true");
      if (!response.ok) return;

      const data: any[] = await response.json();
      for (const token of data) {
        const baseAddress = token.platforms?.["base"];
        if (baseAddress) {
          const info: TokenInfo = {
            symbol: token.symbol.toUpperCase(),
            address: baseAddress,
            decimals: 18,
            name: token.name,
          };
          TOKEN_CACHE.set(info.symbol, info);
          TOKEN_CACHE.set(baseAddress.toLowerCase(), info);
        }
      }
      lastFetch = Date.now();
    } catch (error) {
      console.warn("CoinGecko fetch failed:", error);
    }
  }
}

export const tokenRegistry = TokenRegistry.getInstance();
