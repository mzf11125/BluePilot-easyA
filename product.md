
# Product Pitch: Percolator DeFi Trading Copilot

Percolator is a mobile-first DeFi trading copilot for Base L2, enabling secure, policy-driven token trading through a conversational AI agent and a modern mobile app. Users can trade, manage risk, and track their portfolio—all with on-chain enforcement and full control of their funds.

## Who is it for?
- DeFi traders seeking more control and safety
- Users who prefer mobile-first, intuitive interfaces
- Anyone wanting to automate and safeguard trading with customizable, enforceable policies

## Why Percolator?
- **Conversational Trading:** Trade using natural language via the OpenClaw agent
- **On-Chain Risk Management:** Policies enforced by smart contracts, not just the frontend
- **User-Centric Security:** You control your funds and keys; agent never accesses your wallet
- **Mobile-First Experience:** React Native app with wallet integration, real-time tracking, and TWA installability
- **Transparency:** All actions are on-chain and verifiable

## Architecture
```mermaid
graph TD
	A[Mobile App] -- WalletConnect, Policy, Trade, History --> B[OpenClaw Agent]
	B -- Gateway Protocol --> C[Smart Contracts (Base L2)]
	C -- VaultRouter, TradeExecutor, PolicyGuard --> D[DEX (Uniswap V2 on Base)]
	C -- Events --> A
```

## Differentiators
- Natural language trading and simulation
- On-chain, user-defined risk policies
- Full auditability and transparency
- Mobile-first, installable as native Android app (TWA)

---
For more, see [requirements.md](requirements.md), [design.md](design.md), and [structure.md](structure.md).
