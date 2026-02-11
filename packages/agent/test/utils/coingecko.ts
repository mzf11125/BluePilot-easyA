interface BaseToken {
  id: string;
  symbol: string;
  name: string;
  address: string;
  decimals: number;
}

interface TokenPrice {
  usd: number;
  usd_24h_change: number;
}

const TOKEN_CACHE: Map<string, BaseToken[]> = new Map();
const PRICE_CACHE: Map<string, { price: TokenPrice; timestamp: number }> = new Map();
const CACHE_TTL = 300000; // 5 minutes

export async function getBaseTokens(): Promise<BaseToken[]> {
  const cached = TOKEN_CACHE.get("base");
  if (cached) return cached;

  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=base-ecosystem&order=market_cap_desc&per_page=10&page=1"
    );
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();
    
    const tokens: BaseToken[] = data.map((token: any) => ({
      id: token.id,
      symbol: token.symbol.toUpperCase(),
      name: token.name,
      address: getKnownAddress(token.symbol.toUpperCase()),
      decimals: 18,
    }));

    TOKEN_CACHE.set("base", tokens);
    return tokens;
  } catch (error) {
    console.warn("Failed to fetch from CoinGecko, using fallback tokens:", error);
    return getFallbackTokens();
  }
}

export async function getTokenPrice(tokenId: string): Promise<TokenPrice | null> {
  const cached = PRICE_CACHE.get(tokenId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.price;
  }

  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${tokenId}&vs_currencies=usd&include_24hr_change=true`
    );

    if (!response.ok) return null;

    const data = await response.json();
    const price = {
      usd: data[tokenId]?.usd || 0,
      usd_24h_change: data[tokenId]?.usd_24h_change || 0,
    };

    PRICE_CACHE.set(tokenId, { price, timestamp: Date.now() });
    return price;
  } catch (error) {
    console.warn(`Failed to fetch price for ${tokenId}:`, error);
    return null;
  }
}

function getKnownAddress(symbol: string): string {
  const addresses: Record<string, string> = {
    ETH: "0x0000000000000000000000000000000000000000",
    WETH: "0x4200000000000000000000000000000000000006",
    USDC: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
    DAI: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
    USDT: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2",
  };
  return addresses[symbol] || "0x0000000000000000000000000000000000000000";
}

function getFallbackTokens(): BaseToken[] {
  return [
    {
      id: "ethereum",
      symbol: "ETH",
      name: "Ethereum",
      address: "0x0000000000000000000000000000000000000000",
      decimals: 18,
    },
    {
      id: "wrapped-ether",
      symbol: "WETH",
      name: "Wrapped Ether",
      address: "0x4200000000000000000000000000000000000006",
      decimals: 18,
    },
    {
      id: "usd-coin",
      symbol: "USDC",
      name: "USD Coin",
      address: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
      decimals: 6,
    },
  ];
}
