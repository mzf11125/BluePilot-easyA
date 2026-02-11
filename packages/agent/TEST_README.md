# BluePilot Agent Testing Guide

This guide covers how to run and understand the test suites for the BluePilot Agent API.

## Prerequisites

1. **Environment Setup**: Ensure `.env` file is configured with:
   - `BASE_SEPOLIA_RPC_URL` - RPC endpoint for Base Sepolia
   - `VAULT_ROUTER_ADDRESS` - Deployed VaultRouter contract address
   - `TRADE_EXECUTOR_ADDRESS` - Deployed TradeExecutor contract address
   - `AGENT_API_KEY` - API key for authentication

2. **Build the Project**: 
   ```bash
   pnpm build
   ```

3. **Dependencies**: All dependencies should be installed:
   ```bash
   pnpm install
   ```

## Test Suites

### Unit Tests
Tests individual components in isolation (CommandParser, etc.)

```bash
pnpm test:unit
```

**What it tests:**
- Command parsing logic
- Token symbol to address conversion
- Amount conversions (wei ↔ human-readable)

### Integration Tests
Tests the full API server and contract interactions with real blockchain data.

```bash
pnpm test:integration
```

**What it tests:**
- `/api/agent/simulate` endpoint with various commands
- Contract read operations (balances, token info)
- Error handling for invalid inputs
- Real RPC calls to Base Sepolia

**Note**: Integration tests start a test server on port 3002 automatically.

### All Tests
Run both unit and integration tests:

```bash
pnpm test:all
```

### Watch Mode
Run tests in watch mode for development:

```bash
pnpm test:watch
```

## Test Data Sources

### CoinGecko API
Integration tests use the CoinGecko API to fetch real token data for Base network:
- Token addresses (WETH, USDC, DAI, etc.)
- Token metadata (symbol, decimals)
- Price data (optional)

**Fallback**: If CoinGecko API is unavailable, tests use hardcoded fallback tokens.

### Test Addresses
- **Test User**: `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb`
- **WETH**: `0x4200000000000000000000000000000000000006`
- **USDC**: `0x833589fcd6edb6e08f4c7c32d4f71b54bda02913`

## Test Structure

```
test/
├── unit/                    # Unit tests
│   └── CommandParser.test.ts
├── integration/             # Integration tests
│   ├── setup.ts            # Test server utilities
│   ├── simulate.test.ts    # Simulate endpoint tests
│   └── contracts.test.ts   # Contract interaction tests
└── utils/                   # Test utilities
    └── coingecko.ts        # CoinGecko API client
```

## Example Test Output

### Successful Run
```
PASS  test/integration/simulate.test.ts
  Agent Simulate Endpoint
    ✓ should return valid simulation for swap command (1234ms)
    ✓ should return error for invalid command (567ms)
    ✓ should handle insufficient balance error (890ms)
    ✓ should parse command parameters correctly (456ms)

PASS  test/integration/contracts.test.ts
  Contract Read Operations
    ✓ should get token info for WETH (2345ms)
    ✓ should get vault balance for user (1234ms)
    ✓ should simulate trade between WETH and USDC (3456ms)
    ✓ should throw error for invalid contract address (567ms)
    ✓ should get token info for USDC (1890ms)

Test Suites: 2 passed, 2 total
Tests:       9 passed, 9 total
```

## Troubleshooting

### Server Won't Start
**Issue**: Test server fails to start within timeout
**Solution**: 
- Check if port 3002 is already in use: `lsof -i :3002`
- Ensure the project is built: `pnpm build`
- Check `.env` configuration

### RPC Connection Errors
**Issue**: Tests fail with "connection refused" or timeout errors
**Solution**:
- Verify `BASE_SEPOLIA_RPC_URL` in `.env`
- Check if RPC endpoint is accessible
- Try a different RPC provider (Alchemy, Infura, etc.)

### Contract Call Failures
**Issue**: Contract read operations fail
**Solution**:
- Verify contract addresses in `.env` are correct
- Check contracts are deployed on Base Sepolia
- Verify RPC endpoint supports the chain ID (84532)

### CoinGecko Rate Limiting
**Issue**: Token fetch fails with 429 errors
**Solution**:
- Tests will automatically use fallback tokens
- Wait a few minutes before retrying
- Consider using CoinGecko API key (Pro plan)

### Test Timeout
**Issue**: Tests exceed 30-second timeout
**Solution**:
- Check network connectivity
- Verify RPC endpoint is responsive
- Increase timeout in test file if needed

## Running Individual Tests

Run a specific test file:
```bash
pnpm jest test/integration/simulate.test.ts
```

Run a specific test case:
```bash
pnpm jest -t "should return valid simulation"
```

## Continuous Integration

For CI/CD pipelines, use:
```bash
pnpm test:all --ci --coverage
```

This runs all tests with coverage reporting in CI mode.

## Manual Testing

To manually test the API:

1. Start the server:
   ```bash
   pnpm dev
   ```

2. Use curl to test endpoints:
   ```bash
   curl -X POST http://localhost:3001/api/agent/simulate \
     -H "Content-Type: application/json" \
     -H "X-API-Key: bluepilot_test_key_12345" \
     -d '{
       "command": "swap 0.1 ETH for USDC",
       "userAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
       "chainId": 84532
     }'
   ```

## Coverage Reports

Generate coverage reports:
```bash
pnpm test:coverage
```

View HTML coverage report:
```bash
open coverage/lcov-report/index.html
```

## Best Practices

1. **Always build before testing**: Run `pnpm build` after code changes
2. **Run unit tests first**: Faster feedback loop during development
3. **Run integration tests before commits**: Ensure full system works
4. **Check coverage**: Aim for >80% coverage on critical paths
5. **Update tests with code**: Keep tests in sync with implementation changes
