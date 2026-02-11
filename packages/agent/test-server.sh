#!/bin/bash

# Simple test to verify the Agent API is working
# This script starts the server, makes a test request, and stops the server

echo "Starting Agent API server..."
cd "$(dirname "$0")"
pnpm start > /dev/null 2>&1 &
SERVER_PID=$!

# Wait for server to start
sleep 3

echo "Testing health endpoint..."
HEALTH=$(curl -s http://localhost:3001/health)
if echo "$HEALTH" | grep -q "ok"; then
    echo "✅ Health check passed"
else
    echo "❌ Health check failed"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

echo "Testing simulate endpoint..."
RESPONSE=$(curl -s -X POST http://localhost:3001/api/agent/simulate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: bluepilot_test_key_12345" \
  -d '{
    "command": "swap 0.1 ETH for USDC",
    "userAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "chainId": 84532
  }')

if echo "$RESPONSE" | grep -q "intent"; then
    echo "✅ Simulate endpoint working"
    echo "Response: $RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
else
    echo "❌ Simulate endpoint failed"
    echo "Response: $RESPONSE"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

echo "Stopping server..."
kill $SERVER_PID 2>/dev/null
echo "✅ All tests passed!"
