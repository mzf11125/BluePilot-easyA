# Technology Stack

## Smart Contracts

- **Language**: Solidity 0.8.x
- **Framework**: Hardhat with TypeScript
- **Libraries**: OpenZeppelin (ReentrancyGuard, Ownable, SafeERC20)
- **Network**: Base L2 (Chain ID: 8453 mainnet, 84532 testnet)
- **DEX Integration**: Uniswap V2 Router (0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24)
- **Testing**: Hardhat + ethers.js + fast-check (property-based testing)

### Contract Architecture

Three modular contracts:
- `VaultRouter.sol`: Vault management, policy configuration, trade orchestration
- `TradeExecutor.sol`: DEX integration and token swaps
- `PolicyGuard.sol`: Risk policy validation

## OpenClaw Agent

- **Runtime**: Node.js with Express
- **Language**: TypeScript
- **Web3 Library**: ethers.js v6
- **Protocol**: Gateway Protocol for secure agent-user interaction
- **Testing**: Jest + fast-check

### Agent API Endpoints

- `POST /api/agent/simulate`: Parse intent and simulate trade
- `POST /api/agent/execute`: Generate unsigned transaction
- `GET /api/agent/policy`: Fetch or update user policy
- `GET /api/agent/history`: Query transaction history from events

## Mobile Application

- **Framework**: React Native 0.73+ with Expo SDK 50+
- **Language**: TypeScript
- **Web3**: ethers.js v6 or viem
- **Wallet Integration**: WalletConnect v2 + Coinbase Wallet SDK
- **State Management**: React Context API + AsyncStorage
- **Navigation**: React Navigation v6 (Bottom Tabs)
- **Testing**: Jest + React Native Testing Library + fast-check

### Build Targets

- iOS and Android via Expo EAS Build
- Progressive Web App (PWA) with service worker
- Android Trusted Web Activity (TWA) via Bubblewrap CLI

## Design System

- **Typography**: Inter Bold (headers), Inter Regular (body), Roboto Mono (addresses/hashes)
- **Colors**: Base brand palette (Primary #0052FF, Background #0A0B0D, Surface #1A1B1F)
- **Spacing**: 48px button height, 64px bottom nav, 12px button radius, 16px card radius
- **Accessibility**: Minimum 44x44px touch targets

## Network Configuration

- **Base Mainnet**: https://mainnet.base.org (Chain ID 8453)
- **Base Sepolia**: https://sepolia.base.org (Chain ID 84532)
- **Block Explorer**: https://basescan.org

## Common Commands

### Smart Contracts

```bash
# Install dependencies
npm install

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Run property tests
npx hardhat test --grep "Property"

# Deploy to Base Sepolia
npx hardhat run scripts/deploy.ts --network base-sepolia

# Deploy to Base Mainnet
npx hardhat run scripts/deploy.ts --network base-mainnet

# Verify contracts on Basescan
npx hardhat verify --network base-mainnet <CONTRACT_ADDRESS>

# Gas report
REPORT_GAS=true npx hardhat test
```

### OpenClaw Agent

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test

# Run property tests
npm test -- --grep "Property"

# Build for production
npm run build

# Start production server
npm start
```

### Mobile App

```bash
# Install dependencies
npm install

# Start Expo development server
npx expo start

# Run on iOS simulator
npx expo start --ios

# Run on Android emulator
npx expo start --android

# Run tests
npm test

# Build for iOS (requires EAS account)
eas build --platform ios

# Build for Android
eas build --platform android

# Build PWA
npx expo export:web

# Build TWA (requires Bubblewrap)
bubblewrap init --manifest https://your-domain.com/manifest.json
bubblewrap build
```

## Testing Strategy

### Dual Testing Approach

- **Unit Tests**: Specific examples, edge cases, integration points
- **Property Tests**: Universal invariants across randomized inputs (minimum 100 iterations)

### Coverage Goals

- Smart Contracts: 100% line and branch coverage
- Agent API: 90%+ line coverage
- Mobile App: 80%+ line coverage

### Test Commands

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run property tests only
npm test -- --grep "Property"

# Run E2E tests (mobile)
detox test
```

## Gas Optimization Patterns

- Use `calldata` instead of `memory` for array parameters
- Pack struct variables to minimize storage slots
- Use custom errors instead of string revert messages
- Cache state variables in memory when reading multiple times
- Avoid unbounded loops
