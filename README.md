# BluePilot DeFi Trading Copilot

A mobile-first DeFi trading copilot on Base L2 with smart contract vaults, AI-powered natural language trading interface, and comprehensive policy management.

## Project Structure

```
bluepilot-easya/
├── packages/
│   ├── contracts/    # Solidity smart contracts
│   ├── agent/         # OpenClaw Agent API
│   └── mobile/        # React Native mobile app
└── package.json       # Monorepo root
```

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Python 3 (for node-gyp)
- Java JDK 17 (for Android development)
- Android Studio (for mobile development)

### Installation

```bash
# Install dependencies
npm run install:all
```

## Development

### Smart Contracts

```bash
cd packages/contracts

# Compile contracts
npm run compile

# Run tests
npm run test

# Run tests with gas reporting
REPORT_GAS=true npm run test

# Deploy to Base Sepolia
npm run deploy:sepolia

# Verify contracts
npm run verify:sepolia
```

### Agent API

```bash
cd packages/agent

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
