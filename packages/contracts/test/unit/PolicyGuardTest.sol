// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {PolicyGuard, Policy, TradeParams} from "../contracts/PolicyGuard.sol";

contract PolicyGuardTest {
    using PolicyGuard for Policy;
    using PolicyGuard for TradeParams;

    function testTradeSize(uint256 tradeSize, uint256 maxTradeSize) external pure {
        PolicyGuard.checkTradeSize(tradeSize, maxTradeSize);
    }

    function testSlippage(uint256 slippageBps, uint256 maxSlippageBps) external pure {
        PolicyGuard.checkSlippage(slippageBps, maxSlippageBps);
    }

    function testCooldown(uint32 lastTradeTimestamp, uint32 cooldownSeconds) external view returns (uint32) {
        return PolicyGuard.checkCooldown(lastTradeTimestamp, cooldownSeconds);
    }

    function getRemainingCooldown(uint32 lastTradeTimestamp, uint32 cooldownSeconds) external view returns (uint32) {
        return PolicyGuard.checkCooldown(lastTradeTimestamp, cooldownSeconds);
    }

    function testTokenAllowlist(address token, address[] memory allowlist) external pure {
        PolicyGuard.checkTokenAllowlist(token, allowlist);
    }

    function testCalculateMinAmountOut(uint256 amountIn, uint256 amountOutExpected, uint256 slippageBps) external pure returns (uint256) {
        return PolicyGuard.calculateMinAmountOut(amountIn, amountOutExpected, slippageBps);
    }

    function testCheckAmountOut(uint256 actualAmountOut, uint256 minAmountOut) external pure {
        PolicyGuard.checkAmountOut(actualAmountOut, minAmountOut);
    }

    function testValidateTrade(Policy memory policy, TradeParams memory params, uint32 lastTradeTimestamp) external view {
        policy.validateTrade(params, lastTradeTimestamp);
    }
}
