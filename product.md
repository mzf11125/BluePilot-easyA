


# BluePilot — Hands-Free DeFi Trading on Base

[!IMPORTANT]
**BluePilot: Anti-loss AI + Hands-free trading**

Set your rules once—trade automatically and safely within them. BluePilot combines anti-loss AI, secure smart contracts, and a mobile-first experience for effortless, policy-driven DeFi trading.

BluePilot is a mobile-first, hands-free DeFi trading assistant for Base L2. Users set their trading rules once—trade size, slippage, cooldowns, and allowed tokens—and BluePilot executes trades automatically within those safe, on-chain limits.

No more watching charts, manual swaps, or emotional trades. Just set your rules and let BluePilot handle the rest.

## Who is it for?
- Everyday DeFi users who want to automate trading safely
- Anyone who prefers to set-and-forget their strategies
- Users who value security, transparency, and mobile-first convenience

## Why BluePilot?
- **Hands-Free Trading:** Tell BluePilot your intent in natural language. It prepares and executes trades within your rules.
- **Policy-Based Automation:** All limits are enforced by smart contracts, not just the UI.
- **Conversational Control:** Adjust strategies, simulate trades, and manage policies through chat commands.
- **Mobile-First Experience:** Fast, installable app with wallet connection and dark mode.
- **On-Chain Auditability:** Every action is transparent and verifiable via Basescan.
- **Security by Design:** You keep full custody. Transactions require your approval.

## Architecture
```mermaid
graph TD
	A[Mobile App] -- WalletConnect, Policy, Trade, History --> B[BluePilot Agent]
	B -- Gateway Protocol --> C[Smart Contracts (Base L2)]
	C -- VaultRouter, TradeExecutor, PolicyGuard --> D[DEX (Uniswap V2 on Base)]
	C -- Events --> A
```

## Differentiators
- Set your rules once. Trade automatically within them.
- On-chain, user-defined risk policies
- Full auditability and transparency
- Mobile-first, installable as native Android app (TWA)

---
For more, see [requirements.md](requirements.md), [design.md](design.md), and [structure.md](structure.md).
