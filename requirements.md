

# Requirements Document: BluePilot — Hands-Free DeFi Trading

[!IMPORTANT]
**BluePilot: Anti-loss AI + Hands-free trading**

Set your rules once—trade automatically and safely within them. BluePilot combines anti-loss AI, secure smart contracts, and a mobile-first experience for effortless, policy-driven DeFi trading.

## Introduction

BluePilot is a mobile-first, hands-free DeFi trading platform. Users set their trading rules once—trade size, slippage, cooldowns, and allowed tokens—and BluePilot executes trades automatically within those safe, on-chain limits. The system combines smart contracts on Base L2, a conversational AI agent for intent processing, and a React Native mobile interface. All trades are executed within user-defined, on-chain policies, with full user control and security.


## Glossary

- **BluePilot**: The complete hands-free DeFi trading system
- **Base_L2**: Ethereum Layer 2 network (Chain ID: 8453) where smart contracts are deployed
- **VaultRouter**: Smart contract managing user deposits, withdrawals, and rule configuration
- **TradeExecutor**: Smart contract executing DEX trades with slippage protection
- **PolicyGuard**: Smart contract validating trades against user-defined rules
- **BluePilot_Agent**: AI agent processing natural language trading intents via Gateway Protocol
- **Mobile_App**: React Native + Expo frontend application
- **TWA**: Trusted Web Activity - Android app wrapper for web content
- **User_Rules**: Configuration defining max slippage, trade size limits, cooldown periods, and token allowlist
- **DEX**: Decentralized Exchange (Uniswap V2 on Base)
- **Gateway_Protocol**: BluePilot's secure agent-user interaction protocol

## Requirements

### Requirement 1: Vault Management

**User Story:** As a trader, I want to deposit and withdraw funds from a secure vault, so that I can manage my trading capital on-chain.

#### Acceptance Criteria

1. WHEN a user deposits ETH or ERC20 tokens, THE VaultRouter SHALL record the deposit amount and update the user's vault balance
2. WHEN a user requests withdrawal, THE VaultRouter SHALL transfer the requested amount to the user's wallet address
3. WHEN a withdrawal is requested, THE VaultRouter SHALL verify sufficient vault balance before executing the transfer
4. THE VaultRouter SHALL emit events for all deposit and withdrawal operations with user address, token address, and amount
5. WHEN handling ERC20 tokens, THE VaultRouter SHALL use SafeERC20 to prevent transfer failures

### Requirement 2: Policy Configuration

**User Story:** As a trader, I want to configure risk management policies, so that I can control my trading exposure and prevent excessive losses.

#### Acceptance Criteria

1. WHEN a user sets a policy, THE VaultRouter SHALL store max slippage percentage, max trade size, cooldown period, and token allowlist
2. WHEN a user updates their policy, THE VaultRouter SHALL overwrite the previous configuration with new values
3. THE VaultRouter SHALL emit a PolicyUpdated event containing the user address and new policy parameters
4. WHEN storing policy configuration, THE VaultRouter SHALL validate that slippage percentage is between 0 and 100
5. WHEN storing policy configuration, THE VaultRouter SHALL validate that max trade size is greater than zero

### Requirement 3: Trade Execution

**User Story:** As a trader, I want to execute token swaps through DEX integration, so that I can trade assets while enforcing my risk policies.

#### Acceptance Criteria

1. WHEN executing a trade, THE TradeExecutor SHALL swap tokens via Uniswap V2 Router on Base (0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24)
2. WHEN swapping ETH for tokens, THE TradeExecutor SHALL call the Router's swapExactETHForTokens function
3. WHEN swapping tokens for ETH, THE TradeExecutor SHALL call the Router's swapExactTokensForETH function
4. WHEN executing a swap, THE TradeExecutor SHALL enforce the minimum output amount based on slippage tolerance
5. THE TradeExecutor SHALL emit a TradeExecuted event with input token, output token, amounts, and timestamp
6. WHEN a trade fails, THE TradeExecutor SHALL revert with a descriptive error message

### Requirement 4: Policy Enforcement

**User Story:** As a trader, I want my trades to be validated against my risk policies, so that I cannot accidentally violate my own trading rules.

#### Acceptance Criteria

1. WHEN validating a trade, THE PolicyGuard SHALL check if the trade size exceeds the user's max trade size limit
2. WHEN validating a trade, THE PolicyGuard SHALL check if the slippage percentage exceeds the user's max slippage limit
3. WHEN validating a trade, THE PolicyGuard SHALL check if the cooldown period has elapsed since the last trade
4. WHEN validating a trade, THE PolicyGuard SHALL check if the token is in the user's allowlist
5. IF any policy check fails, THEN THE PolicyGuard SHALL revert with a specific error indicating which policy was violated
6. WHEN all policy checks pass, THE PolicyGuard SHALL return true to allow trade execution

### Requirement 5: Mobile Application Interface

**User Story:** As a trader, I want a mobile-first interface with wallet connection, so that I can manage my portfolio and execute trades from my phone.

#### Acceptance Criteria

1. THE Mobile_App SHALL display a bottom navigation with Home, Trade, Policy, and History tabs
2. WHEN the Home screen loads, THE Mobile_App SHALL display portfolio value and recent trades
3. WHEN the Trade screen loads, THE Mobile_App SHALL provide token selector, amount input, and simulate/execute buttons
4. WHEN the Policy screen loads, THE Mobile_App SHALL display editable fields for max slippage, max trade size, cooldown, and token allowlist
5. WHEN the History screen loads, THE Mobile_App SHALL display transaction log with links to Basescan
6. THE Mobile_App SHALL support wallet connection via WalletConnect or Coinbase Wallet SDK
7. THE Mobile_App SHALL use dark mode by default with Base brand colors (primary #0052FF, background #0A0B0D)
8. THE Mobile_App SHALL be responsive for mobile screen sizes with minimum 320px width support

### Requirement 6: OpenClaw Agent Integration

**User Story:** As a trader, I want to interact with the system using natural language commands, so that I can execute trades conversationally without navigating complex UIs.

#### Acceptance Criteria

1. WHEN a user sends "/simulate" command, THE OpenClaw_Agent SHALL parse the intent, call contract view functions, and return simulated trade results
2. WHEN a user sends "/execute" command, THE OpenClaw_Agent SHALL validate policy, generate transaction data, and return unsigned transaction for user signing
3. WHEN a user sends "/policy" command, THE OpenClaw_Agent SHALL return current policy configuration or update policy based on user input
4. WHEN a user sends "/history" command, THE OpenClaw_Agent SHALL query blockchain events and return formatted transaction history
5. THE OpenClaw_Agent SHALL use Gateway Protocol to ensure secure agent-user interaction
6. WHEN generating transactions, THE OpenClaw_Agent SHALL never access or store user private keys

### Requirement 7: Trade Simulation

**User Story:** As a trader, I want to simulate trades before execution, so that I can preview expected outcomes and verify policy compliance.

#### Acceptance Criteria

1. WHEN simulating a trade, THE Mobile_App SHALL call contract view functions to estimate output amounts
2. WHEN simulating a trade, THE Mobile_App SHALL display expected input amount, output amount, slippage percentage, and gas estimate
3. WHEN simulating a trade, THE Mobile_App SHALL indicate if the trade would violate any policy rules
4. THE Mobile_App SHALL allow users to adjust parameters and re-simulate before executing
5. WHEN simulation fails, THE Mobile_App SHALL display user-friendly error messages explaining the failure reason

### Requirement 8: Transaction History

**User Story:** As a trader, I want to view my transaction history with blockchain verification, so that I can audit my trading activity.

#### Acceptance Criteria

1. WHEN displaying history, THE Mobile_App SHALL show transaction hash, timestamp, token pair, amounts, and status
2. WHEN a user taps a transaction, THE Mobile_App SHALL open Basescan link (https://basescan.org/tx/{hash})
3. THE Mobile_App SHALL fetch transaction history from VaultRouter and TradeExecutor events
4. THE Mobile_App SHALL display pending, confirmed, and failed transaction states with appropriate visual indicators
5. THE Mobile_App SHALL support pull-to-refresh to update transaction history

### Requirement 9: Android TWA Deployment

**User Story:** As a user, I want to install the app as a native Android application, so that I can access it like any other mobile app.

#### Acceptance Criteria

1. THE Mobile_App SHALL generate a PWA with service worker and manifest.json
2. THE Mobile_App SHALL be convertible to Android TWA using Bubblewrap CLI
3. THE Mobile_App SHALL include assetlinks.json for domain verification
4. WHEN installed as TWA, THE Mobile_App SHALL launch in fullscreen without browser UI
5. THE Mobile_App SHALL cache essential assets for offline loading screen display

### Requirement 10: Smart Contract Security

**User Story:** As a trader, I want smart contracts to follow security best practices, so that my funds are protected from common vulnerabilities.

#### Acceptance Criteria

1. THE VaultRouter SHALL inherit from OpenZeppelin's ReentrancyGuard to prevent reentrancy attacks
2. THE VaultRouter SHALL inherit from OpenZeppelin's Ownable for access control
3. WHEN transferring ERC20 tokens, THE VaultRouter SHALL use OpenZeppelin's SafeERC20 library
4. THE TradeExecutor SHALL use ReentrancyGuard on all state-changing functions
5. THE PolicyGuard SHALL validate all input parameters before processing
6. WHEN contracts are deployed, THE contracts SHALL be verified on Basescan for transparency

### Requirement 11: Gas Optimization

**User Story:** As a trader, I want contracts to minimize gas costs, so that I can execute trades economically.

#### Acceptance Criteria

1. WHEN passing arrays to functions, THE contracts SHALL use calldata instead of memory where possible
2. THE contracts SHALL avoid unbounded loops that could cause out-of-gas errors
3. WHEN defining structs, THE contracts SHALL pack variables to minimize storage slots
4. THE contracts SHALL use custom errors instead of string revert messages for gas savings
5. WHEN reading state variables multiple times, THE contracts SHALL cache values in memory

### Requirement 12: Network Configuration

**User Story:** As a developer, I want proper network configuration for Base L2, so that the application connects to the correct blockchain.

#### Acceptance Criteria

1. THE Mobile_App SHALL use Base Mainnet RPC (https://mainnet.base.org) for production
2. THE Mobile_App SHALL use Chain ID 8453 for Base Mainnet
3. THE Mobile_App SHALL support Base Sepolia testnet (Chain ID 84532) for testing
4. THE Mobile_App SHALL display network name and chain ID in settings or debug info
5. WHEN wrong network is detected, THE Mobile_App SHALL prompt user to switch to Base network

### Requirement 13: Error Handling and User Feedback

**User Story:** As a trader, I want clear error messages and retry options, so that I can recover from failed transactions.

#### Acceptance Criteria

1. WHEN a transaction fails, THE Mobile_App SHALL display a user-friendly error message explaining the failure
2. WHEN a transaction is pending, THE Mobile_App SHALL show loading indicator with estimated confirmation time
3. WHEN a transaction fails due to insufficient gas, THE Mobile_App SHALL suggest increasing gas limit
4. THE Mobile_App SHALL provide a retry button for failed transactions
5. WHEN network connectivity is lost, THE Mobile_App SHALL display offline indicator and queue actions for retry

### Requirement 14: Design System Compliance

**User Story:** As a user, I want a consistent and professional interface, so that the app is easy to use and visually appealing.

#### Acceptance Criteria

1. THE Mobile_App SHALL use Inter Bold for headers and Inter Regular for body text
2. THE Mobile_App SHALL use Roboto Mono for displaying wallet addresses and transaction hashes
3. THE Mobile_App SHALL use 12px border radius for buttons and 16px for cards
4. THE Mobile_App SHALL use 48px height for buttons and 64px height for bottom navigation
5. THE Mobile_App SHALL use color palette: Primary #0052FF, Background #0A0B0D, Surface #1A1B1F, Text #FFFFFF/#A0A0AB
6. THE Mobile_App SHALL maintain minimum touch target size of 44x44px for accessibility
