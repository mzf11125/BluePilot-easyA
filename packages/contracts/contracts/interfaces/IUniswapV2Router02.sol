// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

interface IUniswapV2Router02 {
    /// @notice Amount of tokens received for a given input amount
    /// @param amountIn The input amount
    /// @param path The token path (token0 -> token1 -> ...)
    /// @return amounts The output amounts for each swap step
    function getAmountsOut(uint256 amountIn, address[] calldata path)
        external
        view
        returns (uint256[] memory amounts);

    /// @notice Swaps exact ETH for tokens
    /// @param amountOutMin Minimum amount of tokens to receive
    /// @param path The token path (WETH -> token)
    /// @param to Recipient address
    /// @param deadline Transaction deadline
    function swapExactETHForTokens(
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external payable returns (uint256[] memory amounts);

    /// @notice Swaps exact tokens for ETH
    /// @param amountIn Amount of tokens to swap
    /// @param amountOutMin Minimum ETH to receive
    /// @param path The token path (token -> WETH)
    /// @param to Recipient address
    /// @param deadline Transaction deadline
    function swapExactTokensForETH(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);

    /// @notice Swaps exact tokens for tokens
    /// @param amountIn Amount of input tokens
    /// @param amountOutMin Minimum amount of output tokens
    /// @param path The token path
    /// @param to Recipient address
    /// @param deadline Transaction deadline
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);

    /// @notice Swaps tokens for exact tokens (output amount is fixed)
    /// @param amountOut Desired output amount
    /// @param amountInMax Maximum input amount
    /// @param path The token path
    /// @param to Recipient address
    /// @param deadline Transaction deadline
    /// @return amounts Array where amounts[0] is input amount used
    function swapTokensForExactTokens(
        uint256 amountOut,
        uint256 amountInMax,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);

    /// @notice Adds liquidity to a pool
    /// @param tokenA First token address
    /// @param tokenB Second token address
    /// @param amountADesired Desired amount of tokenA
    /// @param amountBDesired Desired amount of tokenB
    /// @param amountAMin Minimum amount of tokenA
    /// @param amountBMin Minimum amount of tokenB
    /// @param to Recipient address
    /// @param deadline Transaction deadline
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external returns (uint256 amountA, uint256 amountB, uint256 liquidity);

    /// @notice Removes liquidity from a pool
    /// @param tokenA First token address
    /// @param tokenB Second token address
    /// @param liquidity Amount of liquidity tokens to burn
    /// @param amountAMin Minimum amount of tokenA
    /// @param amountBMin Minimum amount of tokenB
    /// @param to Recipient address
    /// @param deadline Transaction deadline
    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external returns (uint256 amountA, uint256 amountB);

    /// @notice Factory address
    function factory() external view returns (address);

    /// @notice Wrapped ETH token address
    function WETH() external view returns (address);
}

interface IUniswapV2Factory {
    /// @notice Creates a new pair
    /// @param tokenA First token address
    /// @param tokenB Second token address
    /// @return pair The pair address
    function createPair(address tokenA, address tokenB) external returns (address pair);

    /// @notice Gets the pair address for two tokens
    /// @param tokenA First token address
    /// @param tokenB Second token address
    /// @return pair The pair address (zero if doesn't exist)
    function getPair(address tokenA, address tokenB) external view returns (address pair);
}
