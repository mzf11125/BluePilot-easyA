// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/**
 * @title PolicyGuard
 * @notice Library for validating trade policies and constraints
 * @dev Provides validation functions for trade size, slippage, cooldown, and token allowlist
 */
library PolicyGuard {
    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/

    /// @notice Thrown when trade size exceeds maximum allowed
    /// @param requested The requested trade size
    /// @param max The maximum allowed trade size
    error TradeSizeExceeded(uint256 requested, uint256 max);

    /// @notice Thrown when slippage exceeds maximum allowed
    /// @param requested The requested slippage in basis points
    /// @param max The maximum allowed slippage in basis points
    error SlippageExceeded(uint256 requested, uint256 max);

    /// @notice Thrown when cooldown period has not elapsed
    /// @param remainingSeconds The remaining seconds until cooldown expires
    error CooldownNotElapsed(uint32 remainingSeconds);

    /// @notice Thrown when token is not in the allowlist
    /// @param token The address of the non-allowed token
    error TokenNotAllowed(address token);

    /// @notice Thrown when trade amount is zero
    error ZeroTradeAmount();

    /// @notice Thrown when minimum amount out is zero
    error ZeroMinAmountOut();

    /*//////////////////////////////////////////////////////////////
                                STRUCTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Policy configuration for a user
    /// @param maxSlippageBps Maximum slippage in basis points (100 = 1%)
    /// @param maxTradeSize Maximum trade size in wei
    /// @param cooldownSeconds Minimum seconds between trades
    /// @param tokenAllowlist List of allowed token addresses (empty = all tokens allowed)
    struct Policy {
        uint16 maxSlippageBps;
        uint256 maxTradeSize;
        uint32 cooldownSeconds;
        address[] tokenAllowlist;
    }

    /// @notice Trade parameters for validation
    /// @param tradeSize Size of the trade in wei
    /// @param slippageBps Slippage tolerance in basis points
    /// @param minAmountOut Minimum amount to receive
    /// @param tokenIn Input token address (address(0) for ETH)
    /// @param tokenOut Output token address (address(0) for ETH)
    struct TradeParams {
        uint256 tradeSize;
        uint256 slippageBps;
        uint256 minAmountOut;
        address tokenIn;
        address tokenOut;
    }

    /*//////////////////////////////////////////////////////////////
                          VALIDATION FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Validates trade size against maximum
    /// @param tradeSize The size of the trade
    /// @param maxTradeSize The maximum allowed trade size
    function checkTradeSize(uint256 tradeSize, uint256 maxTradeSize) internal pure {
        if (tradeSize == 0) {
            revert ZeroTradeAmount();
        }
        if (tradeSize > maxTradeSize) {
            revert TradeSizeExceeded(tradeSize, maxTradeSize);
        }
    }

    /// @notice Validates slippage tolerance against maximum
    /// @param slippageBps The slippage tolerance in basis points (100 = 1%)
    /// @param maxSlippageBps The maximum allowed slippage in basis points
    function checkSlippage(uint256 slippageBps, uint256 maxSlippageBps) internal pure {
        // Max slippage of 100% (10000 bps)
        if (slippageBps > 10000) {
            revert SlippageExceeded(slippageBps, 10000);
        }
        if (slippageBps > maxSlippageBps) {
            revert SlippageExceeded(slippageBps, maxSlippageBps);
        }
    }

    /// @notice Validates cooldown period has elapsed
    /// @param lastTradeTimestamp Timestamp of the last trade
    /// @param cooldownSeconds Required cooldown period in seconds
    /// @return remainingSeconds Remaining seconds until cooldown expires (0 if elapsed)
    function checkCooldown(uint32 lastTradeTimestamp, uint32 cooldownSeconds)
        internal
        view
        returns (uint32 remainingSeconds)
    {
        if (cooldownSeconds == 0) {
            return 0;
        }

        uint32 currentTimestamp = uint32(block.timestamp);
        if (currentTimestamp < lastTradeTimestamp + cooldownSeconds) {
            remainingSeconds = (lastTradeTimestamp + cooldownSeconds) - currentTimestamp;
            revert CooldownNotElapsed(remainingSeconds);
        }
        return 0;
    }

    /// @notice Validates if token is in allowlist
    /// @param token The token address to check (address(0) for ETH)
    /// @param allowlist The list of allowed tokens
    /// @return allowed True if token is allowed
    function checkTokenAllowlist(address token, address[] memory allowlist)
        internal
        pure
        returns (bool allowed)
    {
        // Empty allowlist means all tokens are allowed
        if (allowlist.length == 0) {
            return true;
        }

        // ETH (address(0)) is always allowed if allowlist is not empty
        if (token == address(0)) {
            return true;
        }

        // Check if token is in allowlist
        for (uint256 i = 0; i < allowlist.length; i++) {
            if (allowlist[i] == token) {
                return true;
            }
        }

        revert TokenNotAllowed(token);
    }

    /// @notice Validates all trade parameters against a policy
    /// @param policy The policy to validate against
    /// @param params The trade parameters
    /// @param lastTradeTimestamp Timestamp of the last trade
    /// @return isValid True if all validations pass
    function validateTrade(
        Policy memory policy,
        TradeParams memory params,
        uint32 lastTradeTimestamp
    ) internal view returns (bool isValid) {
        // Check trade size
        checkTradeSize(params.tradeSize, policy.maxTradeSize);

        // Check slippage
        checkSlippage(params.slippageBps, policy.maxSlippageBps);

        // Check minimum amount out
        if (params.minAmountOut == 0) {
            revert ZeroMinAmountOut();
        }

        // Check cooldown
        checkCooldown(lastTradeTimestamp, policy.cooldownSeconds);

        // Check token allowlist for both input and output tokens
        checkTokenAllowlist(params.tokenIn, policy.tokenAllowlist);
        checkTokenAllowlist(params.tokenOut, policy.tokenAllowlist);

        return true;
    }

    /// @notice Calculates the minimum amount out based on slippage
    /// @param amountIn The input amount
    /// @param amountOutExpected The expected output amount
    /// @param slippageBps The slippage tolerance in basis points
    /// @return minAmountOut The minimum amount to receive
    function calculateMinAmountOut(
        uint256 amountIn,
        uint256 amountOutExpected,
        uint256 slippageBps
    ) internal pure returns (uint256 minAmountOut) {
        // minAmountOut = amountOutExpected * (10000 - slippageBps) / 10000
        uint256 numerator = amountOutExpected * (10000 - slippageBps);
        return numerator / 10000;
    }

    /// @notice Validates that the actual amount out meets the minimum requirement
    /// @param actualAmountOut The actual amount received
    /// @param minAmountOut The minimum required amount
    function checkAmountOut(uint256 actualAmountOut, uint256 minAmountOut)
        internal
        pure
    {
        if (actualAmountOut < minAmountOut) {
            revert SlippageExceeded(minAmountOut - actualAmountOut, minAmountOut);
        }
    }
}
