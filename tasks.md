


# Implementation Plan: BluePilot — Hands-Free DeFi Trading

[!IMPORTANT]
**BluePilot: Anti-loss AI + Hands-free trading**

Set your rules once—trade automatically and safely within them. BluePilot combines anti-loss AI, secure smart contracts, and a mobile-first experience for effortless, policy-driven DeFi trading.

## Overview

This plan breaks down BluePilot into actionable tasks for hands-free, rule-based DeFi trading. Each component—smart contracts, agent, and mobile app—supports automation, policy enforcement, and a mobile-first experience. Accessibility and code quality are prioritized throughout. Code/config examples and alt text are included for clarity.

## Tasks

- [ ] 1. Set up project structure and development environment
  - Create monorepo structure with separate packages for contracts, agent, and mobile app
  - Initialize Hardhat project for smart contracts with TypeScript support
  - Initialize Node.js/Express project for OpenClaw agent API
  - Initialize React Native + Expo project for mobile app
  - Configure TypeScript, ESLint, and Prettier for all packages
  - Set up Hardhat config for Base Mainnet (8453) and Base Sepolia (84532)
  - Install dependencies: OpenZeppelin contracts, ethers.js, fast-check, WalletConnect, Expo
  - _Requirements: 12.1, 12.2, 12.3_

- [ ] 2. Implement PolicyGuard smart contract
  - [ ] 2.1 Create PolicyGuard.sol with validation functions
    - Implement checkTradeSize(uint256 tradeSize, uint256 maxTradeSize) pure function
    - Implement checkSlippage(uint256 slippageBps, uint256 maxSlippageBps) pure function
    - Implement checkCooldown(uint32 lastTradeTimestamp, uint32 cooldownSeconds) view function
    - Implement checkTokenAllowlist(address token, address[] memory allowlist) pure function
    - Implement validateTrade() function that calls all check functions
    - Define custom errors: TradeSizeExceeded, SlippageExceeded, CooldownNotElapsed, TokenNotAllowed
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 10.5_
  
  - [ ]* 2.2 Write property test for trade size validation
    - **Property 11: Trade size validation**
    - **Validates: Requirements 4.1**
  
  - [ ]* 2.3 Write property test for slippage validation
    - **Property 12: Slippage validation**
    - **Validates: Requirements 4.2**
  
  - [ ]* 2.4 Write property test for cooldown validation
    - **Property 13: Cooldown validation**
    - **Validates: Requirements 4.3**
  
  - [ ]* 2.5 Write property test for token allowlist validation
    - **Property 14: Token allowlist validation**
    - **Validates: Requirements 4.4**
  
  - [ ]* 2.6 Write property test for valid trades passing all checks
    - **Property 15: Valid trades pass all policy checks**
    - **Validates: Requirements 4.6**
  
  - [ ]* 2.7 Write unit tests for policy violation error messages
    - Test each custom error is thrown with correct parameters
    - _Requirements: 4.5_

- [ ] 3. Implement TradeExecutor smart contract
  - [ ] 3.1 Create TradeExecutor.sol with Uniswap V2 integration
    - Import IUniswapV2Router02 interface
    - Set immutable uniswapRouter address (0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24)
    - Inherit from ReentrancyGuard
    - Implement swapETHForTokens() function with nonReentrant modifier
    - Implement swapTokensForETH() function with nonReentrant modifier
    - Implement swapTokensForTokens() function with nonReentrant modifier
    - Implement getAmountOut() view function for simulation
    - Define TradeExecuted event with indexed user, tokenIn, tokenOut, amounts, timestamp
    - Define custom errors: SwapFailed, InsufficientOutputAmount, InvalidPath
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 10.4_
  
  - [ ]* 3.2 Write property test for swap minimum output enforcement
    - **Property 8: Swap enforces minimum output amount**
    - **Validates: Requirements 3.4**
  
  - [ ]* 3.3 Write property test for trade event emission
    - **Property 9: Trade events are emitted**
    - **Validates: Requirements 3.5**
  
  - [ ]* 3.4 Write property test for invalid trade reverts
    - **Property 10: Invalid trades revert with errors**
    - **Validates: Requirements 3.6**
  
  - [ ]* 3.5 Write unit tests for Uniswap router integration
    - Test swapETHForTokens calls correct router function
    - Test swapTokensForETH calls correct router function
    - Use Hardhat mainnet fork for realistic testing
    - _Requirements: 3.2, 3.3_

- [ ] 4. Implement VaultRouter smart contract
  - [ ] 4.1 Create VaultRouter.sol with vault and policy management
    - Define Policy struct with packed variables (uint16 maxSlippageBps, uint256 maxTradeSize, uint32 cooldownSeconds, uint32 lastTradeTimestamp, address[] tokenAllowlist)
    - Define vaultBalances mapping (address => mapping(address => uint256))
    - Define userPolicies mapping (address => Policy)
    - Inherit from Ownable and ReentrancyGuard
    - Import SafeERC20 library
    - Implement deposit(address token, uint256 amount) with nonReentrant modifier
    - Implement withdraw(address token, uint256 amount) with nonReentrant modifier
    - Implement setPolicy() function with input validation
    - Implement executeTrade() function that calls PolicyGuard and TradeExecutor
    - Define events: Deposit, Withdrawal, PolicyUpdated, TradeInitiated
    - Define custom errors: InsufficientVaultBalance, InvalidSlippage, InvalidTradeSize, ZeroAddress, ZeroAmount
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 10.1, 10.2, 10.3, 11.1, 11.2, 11.3, 11.4, 11.5_
  
  - [ ]* 4.2 Write property test for deposit increases vault balance
    - **Property 1: Deposit increases vault balance**
    - **Validates: Requirements 1.1**
  
  - [ ]* 4.3 Write property test for withdrawal decreases vault balance
    - **Property 2: Withdrawal decreases vault balance and increases wallet balance**
    - **Validates: Requirements 1.2**
  
  - [ ]* 4.4 Write property test for insufficient balance withdrawals
    - **Property 3: Insufficient balance withdrawals revert**
    - **Validates: Requirements 1.3**
  
  - [ ]* 4.5 Write property test for deposit/withdrawal event emission
    - **Property 4: Deposit and withdrawal events are emitted**
    - **Validates: Requirements 1.4**
  
  - [ ]* 4.6 Write property test for policy round-trip consistency
    - **Property 5: Policy round-trip consistency**
    - **Validates: Requirements 2.1, 2.2**
  
  - [ ]* 4.7 Write property test for policy update event emission
    - **Property 6: Policy update events are emitted**
    - **Validates: Requirements 2.3**
  
  - [ ]* 4.8 Write unit tests for SafeERC20 usage
    - Test deposit/withdraw with non-standard ERC20 tokens
    - _Requirements: 1.5_
  
  - [ ]* 4.9 Write unit tests for policy validation edge cases
    - Test slippage = 0, slippage = 10000, slippage > 10000
    - Test maxTradeSize = 0, maxTradeSize > 0
    - Test empty token allowlist
    - _Requirements: 2.4, 2.5_

- [ ] 5. Deploy and verify smart contracts
  - [ ] 5.1 Create deployment scripts for Base Sepolia testnet
    - Write Hardhat deployment script that deploys PolicyGuard, TradeExecutor, VaultRouter in order
    - Pass Uniswap V2 Router address to TradeExecutor constructor
    - Pass PolicyGuard and TradeExecutor addresses to VaultRouter constructor
    - Save deployed addresses to JSON file
    - _Requirements: 12.3_
  
  - [ ] 5.2 Create deployment scripts for Base Mainnet
    - Copy testnet deployment script and update network config
    - Add deployment verification step
    - _Requirements: 12.1, 12.2_
  
  - [ ]* 5.3 Write deployment tests
    - Test contracts deploy successfully
    - Test contract addresses are saved correctly
    - Test contracts are linked correctly (VaultRouter can call PolicyGuard and TradeExecutor)

- [ ] 6. Checkpoint - Ensure all smart contract tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Implement OpenClaw Agent API
  - [ ] 7.1 Set up Express server with Gateway Protocol middleware
    - Create Express app with TypeScript
    - Implement Gateway Protocol authentication middleware
    - Set up CORS and body parsing
    - Create ethers.js provider for Base RPC
    - Load contract ABIs and create contract instances
    - _Requirements: 6.5_
  
  - [ ] 7.2 Implement /api/agent/simulate endpoint
    - Parse natural language command to extract tokenIn, tokenOut, amountIn
    - Call TradeExecutor.getAmountOut() to estimate output
    - Call PolicyGuard.validateTrade() to check policy compliance
    - Estimate gas using eth_estimateGas
    - Return SimulationResult with all required fields
    - Handle errors and return user-friendly messages
    - _Requirements: 6.1, 7.1_
  
  - [ ]* 7.3 Write property test for simulate command
    - **Property 17: Simulate command returns simulation results**
    - **Validates: Requirements 6.1**
  
  - [ ] 7.4 Implement /api/agent/execute endpoint
    - Parse natural language command to extract trade parameters
    - Validate policy using PolicyGuard
    - Generate unsigned transaction data for VaultRouter.executeTrade()
    - Return transaction object with to, data, value, gasLimit
    - Handle errors and return user-friendly messages
    - _Requirements: 6.2_
  
  - [ ]* 7.5 Write property test for execute command
    - **Property 18: Execute command returns unsigned transaction**
    - **Validates: Requirements 6.2**
  
  - [ ] 7.6 Implement /api/agent/policy endpoint
    - GET: Call VaultRouter.getUserPolicy() and return formatted policy
    - POST: Parse policy parameters and generate setPolicy() transaction
    - _Requirements: 6.3_
  
  - [ ] 7.7 Implement /api/agent/history endpoint
    - Query VaultRouter events (Deposit, Withdrawal, PolicyUpdated, TradeInitiated)
    - Query TradeExecutor events (TradeExecuted)
    - Combine and sort events by timestamp
    - Return formatted transaction history array
    - _Requirements: 6.4, 8.3_
  
  - [ ]* 7.8 Write property test for history command
    - **Property 19: History command returns transaction data**
    - **Validates: Requirements 6.4**
  
  - [ ]* 7.9 Write unit tests for command parsing
    - Test parsing of various command formats
    - Test error handling for malformed commands
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 8. Implement mobile app contract integration layer
  - [ ] 8.1 Create contract wrapper classes
    - Create contracts/VaultRouterContract.ts with ethers.js integration
    - Implement deposit(), withdraw(), setPolicy(), getUserPolicy(), getVaultBalance() methods
    - Create contracts/TradeExecutorContract.ts with ethers.js integration
    - Implement swapETHForTokens(), swapTokensForETH(), getAmountOut() methods
    - Create contracts/PolicyGuardContract.ts with ethers.js integration
    - Implement validateTrade() method
    - Load ABIs from JSON files
    - _Requirements: 7.1_
  
  - [ ] 8.2 Create network configuration
    - Define NETWORKS constant with Base Mainnet and Base Sepolia configs
    - Include chainId, rpcUrl, blockExplorer, uniswapV2Router for each network
    - _Requirements: 12.1, 12.2, 12.3_
  
  - [ ] 8.3 Create error handler utility
    - Implement ErrorHandler.getUserFriendlyMessage() to map contract errors to user-friendly messages
    - Implement ErrorHandler.shouldRetry() to determine if error is retryable
    - Handle all custom contract errors (TradeSizeExceeded, SlippageExceeded, etc.)
    - Handle wallet errors (user rejection, insufficient funds)
    - Handle network errors (connection failures, timeouts)
    - _Requirements: 13.1, 13.3_
  
  - [ ]* 8.4 Write property test for error message mapping
    - **Property 28: Transaction failures display error messages**
    - **Validates: Requirements 13.1**
  
  - [ ] 8.5 Create retry utility
    - Implement executeWithRetry() function with exponential backoff
    - Use ErrorHandler.shouldRetry() to determine retry eligibility
    - _Requirements: 13.4_
  
  - [ ] 8.6 Create offline queue utility
    - Implement OfflineQueue class to queue actions when offline
    - Listen to online/offline events
    - Process queue when connection restored
    - _Requirements: 13.5_

- [ ] 9. Implement mobile app wallet integration
  - [ ] 9.1 Create WalletContext for state management
    - Define WalletState interface (address, chainId, connected, provider, signer)
    - Create React Context with wallet state and actions
    - Implement connect() action using WalletConnect v2
    - Implement disconnect() action
    - Implement switchNetwork() action
    - Store wallet state in AsyncStorage for persistence
    - _Requirements: 5.6_
  
  - [ ] 9.2 Create WalletConnectButton component
    - Display "Connect Wallet" when disconnected
    - Display truncated address when connected
    - Handle connect/disconnect button presses
    - Show loading state during connection
    - _Requirements: 5.6_
  
  - [ ]* 9.3 Write unit tests for wallet connection flow
    - Test connect action updates state correctly
    - Test disconnect action clears state
    - Test wallet state persistence
    - _Requirements: 5.6_

- [ ] 10. Implement mobile app design system
  - [ ] 10.1 Create design system constants
    - Define COLORS constant with Base brand colors (#0052FF, #0A0B0D, #1A1B1F, #FFFFFF, #A0A0AB)
    - Define TYPOGRAPHY constant with Inter Bold, Inter Regular, Roboto Mono
    - Define SPACING constant with button height (48px), bottom nav height (64px), border radius values
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_
  
  - [ ] 10.2 Create reusable UI components
    - Create Button component with primary/secondary variants, 48px height, 12px border radius, min 44x44px touch target
    - Create Card component with 16px border radius, surface background color
    - Create Input component with dark theme styling
    - Create LoadingIndicator component
    - Create ErrorMessage component
    - _Requirements: 14.3, 14.4, 14.6_
  
  - [ ]* 10.3 Write property test for touch target sizes
    - **Property 31: Interactive elements meet minimum touch target size**
    - **Validates: Requirements 14.6**
  
  - [ ]* 10.4 Write unit tests for design system components
    - Test Button renders with correct styles
    - Test Card renders with correct border radius
    - Test color constants are applied correctly
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [ ] 11. Implement Home screen
  - [ ] 11.1 Create HomeScreen component
    - Display portfolio value (sum of vault balances converted to USD)
    - Display recent trades list (last 5 transactions from history)
    - Add quick action buttons (Deposit, Trade)
    - Display network indicator showing current chain (Base Mainnet/Sepolia)
    - Fetch vault balances using VaultRouterContract.getVaultBalance()
    - Fetch recent trades from TradeExecutor events
    - _Requirements: 5.2_
  
  - [ ]* 11.2 Write unit tests for Home screen
    - Test portfolio value calculation
    - Test recent trades display
    - Test quick action buttons navigate correctly
    - _Requirements: 5.2_

- [ ] 12. Implement Trade screen
  - [ ] 12.1 Create TradeScreen component
    - Add token selector dropdown (populated from user's token allowlist)
    - Add amount input with "Max" button
    - Add swap direction toggle (ETH ↔ Token)
    - Add slippage tolerance slider (0-10%)
    - Add "Simulate" button
    - Add "Execute" button (disabled until simulation succeeds)
    - Display simulation results (estimated output, slippage, gas estimate, policy violations)
    - _Requirements: 5.3, 7.2_
  
  - [ ] 12.2 Create TradeSimulator component
    - Call TradeExecutorContract.getAmountOut() to estimate output
    - Call PolicyGuardContract.validateTrade() to check policy compliance
    - Estimate gas using provider.estimateGas()
    - Return SimulationResult with all required fields
    - Display policy violations if any
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [ ]* 12.3 Write property test for trade simulation
    - **Property 20: Trade simulation calls view functions**
    - **Validates: Requirements 7.1**
  
  - [ ]* 12.4 Write property test for simulation result structure
    - **Property 21: Simulation displays required fields**
    - **Validates: Requirements 7.2**
  
  - [ ]* 12.5 Write property test for policy violation indication
    - **Property 22: Simulation indicates policy violations**
    - **Validates: Requirements 7.3**
  
  - [ ]* 12.6 Write property test for simulation error messages
    - **Property 23: Simulation errors display user-friendly messages**
    - **Validates: Requirements 7.5**
  
  - [ ] 12.7 Implement trade execution flow
    - On "Execute" button press, call VaultRouterContract.executeTrade()
    - Show transaction signing modal
    - Wait for user to sign transaction in wallet
    - Submit signed transaction to network
    - Show pending state with loading indicator
    - Navigate to History screen on confirmation
    - Display error message if transaction fails
    - _Requirements: 3.1, 13.1, 13.2, 13.4_
  
  - [ ]* 12.8 Write unit tests for Trade screen
    - Test token selector populates from allowlist
    - Test amount input validation
    - Test simulate button triggers simulation
    - Test execute button is disabled until simulation succeeds
    - _Requirements: 5.3, 7.2_

- [ ] 13. Implement Policy screen
  - [ ] 13.1 Create PolicyScreen component
    - Add max slippage input (percentage, 0-100)
    - Add max trade size input (ETH or USD)
    - Add cooldown period input (seconds)
    - Add token allowlist manager (list with add/remove buttons)
    - Add "Save" button
    - Fetch current policy using VaultRouterContract.getUserPolicy()
    - Pre-populate form with current policy values
    - _Requirements: 5.4_
  
  - [ ] 13.2 Implement policy save flow
    - Validate input values (slippage 0-100, trade size > 0)
    - Call VaultRouterContract.setPolicy() with new values
    - Show transaction signing modal
    - Wait for user to sign transaction
    - Submit signed transaction to network
    - Show success message on confirmation
    - Display error message if transaction fails
    - _Requirements: 2.1, 2.2, 2.3, 13.1_
  
  - [ ]* 13.3 Write unit tests for Policy screen
    - Test form pre-populates with current policy
    - Test input validation
    - Test save button triggers setPolicy transaction
    - _Requirements: 5.4, 2.1, 2.2_

- [ ] 14. Implement History screen
  - [ ] 14.1 Create HistoryScreen component
    - Fetch transaction history from VaultRouter and TradeExecutor events
    - Display transaction list with infinite scroll
    - Add filter dropdown (all/pending/confirmed/failed)
    - Add pull-to-refresh functionality
    - Display empty state when no transactions
    - _Requirements: 5.5, 8.3, 8.5_
  
  - [ ] 14.2 Create TransactionCard component
    - Display transaction hash (truncated to first 10 chars)
    - Display timestamp (formatted as relative time)
    - Display token pair (e.g., "ETH → USDC")
    - Display amounts (formatted with token symbols)
    - Display status indicator (icon or badge for pending/confirmed/failed)
    - Handle tap to open Basescan link
    - _Requirements: 8.1, 8.2, 8.4_
  
  - [ ]* 14.3 Write property test for transaction history display
    - **Property 24: Transaction history displays required fields**
    - **Validates: Requirements 8.1**
  
  - [ ]* 14.4 Write property test for Basescan link
    - **Property 25: Transaction tap opens correct Basescan link**
    - **Validates: Requirements 8.2**
  
  - [ ]* 14.5 Write property test for event fetching
    - **Property 26: History fetches events from both contracts**
    - **Validates: Requirements 8.3**
  
  - [ ]* 14.6 Write unit tests for History screen
    - Test transaction list renders correctly
    - Test filter dropdown filters transactions
    - Test pull-to-refresh updates history
    - Test empty state displays when no transactions
    - _Requirements: 5.5, 8.3, 8.5_

- [ ] 15. Implement network detection and switching
  - [ ] 15.1 Create NetworkGuard component
    - Detect current chain ID from wallet
    - Compare with expected chain ID (8453 for mainnet, 84532 for testnet)
    - Display modal prompt when wrong network detected
    - Provide "Switch Network" button that calls wallet.switchNetwork()
    - Block app functionality until correct network is selected
    - _Requirements: 12.4, 12.5_
  
  - [ ]* 15.2 Write property test for network detection
    - **Property 27: Wrong network triggers switch prompt**
    - **Validates: Requirements 12.5**
  
  - [ ]* 15.3 Write unit tests for NetworkGuard
    - Test modal appears when wrong network detected
    - Test switch button calls wallet.switchNetwork()
    - Test app is blocked until correct network
    - _Requirements: 12.4, 12.5_

- [ ] 16. Implement transaction state management
  - [ ] 16.1 Create TransactionContext for pending transactions
    - Define TransactionState interface (hash, status, timestamp, etc.)
    - Create React Context with transaction state and actions
    - Implement addTransaction() action
    - Implement updateTransactionStatus() action
    - Poll for transaction receipts and update status
    - Store pending transactions in AsyncStorage
    - _Requirements: 13.2_
  
  - [ ]* 16.2 Write property test for pending transaction indicator
    - **Property 29: Pending transactions show loading indicator**
    - **Validates: Requirements 13.2**
  
  - [ ]* 16.3 Write property test for failed transaction retry button
    - **Property 30: Failed transactions show retry button**
    - **Validates: Requirements 13.4**
  
  - [ ]* 16.4 Write unit tests for transaction state management
    - Test addTransaction adds to state
    - Test updateTransactionStatus updates correctly
    - Test transaction polling works
    - _Requirements: 13.2, 13.4_

- [ ] 17. Implement bottom navigation
  - [ ] 17.1 Create bottom tab navigator
    - Use React Navigation Bottom Tabs
    - Add 4 tabs: Home, Trade, Policy, History
    - Set tab bar height to 64px
    - Use Base brand colors for active/inactive states
    - Add icons for each tab
    - _Requirements: 5.1_
  
  - [ ]* 17.2 Write unit tests for navigation
    - Test all 4 tabs are present
    - Test tapping tabs navigates to correct screen
    - _Requirements: 5.1_

- [ ] 18. Checkpoint - Ensure all mobile app tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 19. Implement PWA and TWA build configuration
  - [ ] 19.1 Configure PWA build
    - Create manifest.json with app name, icons, theme colors, display mode "standalone"
    - Create service worker for caching essential assets
    - Add offline fallback page
    - Configure Expo web build to generate PWA
    - _Requirements: 9.1, 9.5_
  
  - [ ] 19.2 Configure TWA build with Bubblewrap
    - Install Bubblewrap CLI
    - Initialize TWA project with manifest URL
    - Configure assetlinks.json for domain verification
    - Set display mode to "fullscreen"
    - Build APK using Bubblewrap
    - _Requirements: 9.2, 9.3, 9.4_
  
  - [ ]* 19.3 Write unit tests for PWA configuration
    - Test manifest.json has required fields
    - Test service worker caches assets
    - Test offline fallback works
    - _Requirements: 9.1, 9.5_
  
  - [ ]* 19.4 Write unit tests for TWA configuration
    - Test assetlinks.json format is correct
    - Test manifest display mode is fullscreen
    - _Requirements: 9.3, 9.4_

- [ ] 20. Integration testing and final wiring
  - [ ] 20.1 Test end-to-end flow on Base Sepolia testnet
    - Deploy contracts to Base Sepolia
    - Configure agent API to use Sepolia contracts
    - Configure mobile app to use Sepolia network
    - Test complete flow: connect wallet → deposit → set policy → simulate trade → execute trade → view history
    - Verify all transactions on Basescan Sepolia
    - _Requirements: 12.3_
  
  - [ ]* 20.2 Write integration tests
    - Test agent API integrates with deployed contracts
    - Test mobile app integrates with agent API
    - Test mobile app integrates with contracts directly
    - Test wallet connection and transaction signing
  
  - [ ] 20.3 Prepare for mainnet deployment
    - Review all contract code for security issues
    - Run gas optimization analysis
    - Generate deployment checklist
    - Document contract addresses and ABIs
    - _Requirements: 10.6, 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 21. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at major milestones
- Property tests validate universal correctness properties with minimum 100 iterations
- Unit tests validate specific examples, edge cases, and integration points
- Smart contracts should be deployed to Base Sepolia testnet first for testing before mainnet deployment
- All contract interactions should use error handling with user-friendly messages
- Mobile app should work offline with queued actions that execute when connection restored
