#!/bin/bash

# BluePilot Agent - Quick Start Script
# This script demonstrates the complete workflow for testing the Agent API

set -e

echo "╔══════════════════════════════════════════════════════════╗"
echo "║                                                          ║"
echo "║   BluePilot Agent API - Quick Start                      ║"
echo "║                                                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Step 1: Build
echo "📦 Step 1: Building agent package..."
pnpm build
echo "✅ Build complete"
echo ""

# Step 2: Run unit tests
echo "🧪 Step 2: Running unit tests..."
pnpm test:unit
echo "✅ Unit tests complete"
echo ""

# Step 3: Start server in background
echo "🚀 Step 3: Starting Agent API server..."
pnpm start &
SERVER_PID=$!
echo "Server PID: $SERVER_PID"
sleep 3
echo "✅ Server started on port 3001"
echo ""

# Step 4: Health check
echo "🏥 Step 4: Health check..."
curl -s http://localhost:3001/health | jq '.'
echo "✅ Health check passed"
echo ""

# Step 5: Test simulate endpoint
echo "🔍 Step 5: Testing /api/agent/simulate endpoint..."
curl -s -X POST http://localhost:3001/api/agent/simulate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: bluepilot_test_key_12345" \
  -d '{
    "command": "swap 0.1 ETH for USDC",
    "userAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "chainId": 84532
  }' | jq '.'
echo "✅ Simulate endpoint test complete"
echo ""

# Cleanup
echo "🧹 Cleaning up..."
kill $SERVER_PID 2>/dev/null || true
echo "✅ Server stopped"
echo ""

echo "╔══════════════════════════════════════════════════════════╗"
echo "║                                                          ║"
echo "║   All tasks complete! ✨                                 ║"
echo "║                                                          ║"
echo "║   Next steps:                                            ║"
echo "║   - Run integration tests: pnpm test:integration         ║"
echo "║   - Start dev server: pnpm dev                           ║"
echo "║   - Read TEST_README.md for more info                    ║"
echo "║                                                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
