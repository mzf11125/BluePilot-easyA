
# Percolator DeFi Trading Copilot

Percolator is a mobile-first DeFi trading copilot that combines secure smart contracts, an AI-powered agent, and a modern mobile app to make DeFi trading safe, accessible, and conversational.

## Architecture

```mermaid
graph TD
	A[Mobile App (React Native/Expo)] -- WalletConnect, Policy, Trade, History --> B[OpenClaw Agent]
	B -- Gateway Protocol --> C[Smart Contracts (Base L2)]
	C -- VaultRouter, TradeExecutor, PolicyGuard --> D[DEX (Uniswap V2 on Base)]
	C -- Events --> A
```

## Features
- **Conversational Trading:** Use natural language to simulate and execute trades.
- **On-Chain Risk Management:** Enforce slippage, trade size, cooldown, and allowlist policies on-chain.
- **Mobile-First:** Intuitive app with wallet connection, dark mode, and responsive design.
- **Auditability:** All actions are on-chain and verifiable via Basescan.
- **Security:** User-controlled keys, contract-based enforcement, and best practices.

## Packages
- `packages/agent`: OpenClaw AI agent for chat-based trading and policy management.
- `packages/contracts`: Solidity smart contracts for vaults, trading, and policy enforcement.
- `packages/mobile`: React Native app for user interface and wallet integration.

## Quick Start

### Prerequisites
- Node.js >= 18, pnpm, Android Studio (for TWA), and a supported wallet app.

### Install
```sh
pnpm install
```

### Build & Test
- Agent: `pnpm --filter agent build && pnpm --filter agent test`
- Contracts: `pnpm --filter contracts build && pnpm --filter contracts test`
- Mobile: `pnpm --filter mobile start`

### Deploy Contracts
```sh
cd packages/contracts && pnpm deploy
```

## Security & Audit
See [SECURITY.md](SECURITY.md) for details on contract security, responsible disclosure, and audit status.

## Contributing
See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License
MIT

# Start development server
npm run dev

# Run tests
npm test
```

### Mobile App

```bash
cd packages/mobile

# Start Expo dev server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run tests
npm test
```

## Smart Contract Addresses

| Contract | Base Mainnet | Base Sepolia |
|----------|--------------|--------------|
| VaultRouter | TBD | TBD |
| TradeExecutor | TBD | TBD |

## Environment Variables

Copy `.env.example` to `.env` and fill in the required values:

```bash
cp .env.example .env
```

### Key Variables

- `BASE_RPC_URL` - Base Mainnet RPC
- `BASE_SEPOLIA_RPC_URL` - Base Sepolia RPC
- `PRIVATE_KEY` - Deployment private key
- `WALLETCONNECT_PROJECT_ID` - WalletConnect project ID

## License

MIT
