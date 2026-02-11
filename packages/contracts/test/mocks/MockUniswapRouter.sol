// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MockUniswapRouter {
    address public immutable WETH;

    uint256 private constant PRICE_SCALE = 1e18;

    // Mock price data: token => price in WETH (scaled)
    mapping(address => uint256) public prices;

    constructor(address _weth) {
        WETH = _weth;
        // Set default price for WETH
        prices[WETH] = PRICE_SCALE;
    }

    function setPrice(address token, uint256 price) external {
        prices[token] = price;
    }

    function getAmountsOut(uint256 amountIn, address[] calldata path)
        external
        view
        returns (uint256[] memory amounts)
    {
        amounts = new uint256[](path.length);
        amounts[0] = amountIn;

        for (uint256 i = 0; i < path.length - 1; i++) {
            address tokenIn = path[i];
            address tokenOut = path[i + 1];

            uint256 priceIn = prices[tokenIn] == 0 ? PRICE_SCALE : prices[tokenIn];
            uint256 priceOut = prices[tokenOut] == 0 ? PRICE_SCALE : prices[tokenOut];

            // Calculate output amount based on price ratio
            amounts[i + 1] = (amounts[i] * priceIn) / priceOut;
        }

        return amounts;
    }

    function swapExactETHForTokens(
        uint256,
        address[] calldata path,
        address to,
        uint256
    ) external payable returns (uint256[] memory amounts) {
        amounts = getAmountsOut(msg.value, path);

        IERC20 lastToken = IERC20(path[path.length - 1]);
        uint256 amountOut = amounts[amounts.length - 1];

        // Mint tokens to recipient (for testing)
        if (path[path.length - 1] != WETH) {
            MockToken(path[path.length - 1]).mint(to, amountOut);
        } else {
            (bool success, ) = to.call{value: amountOut}("");
            require(success, "ETH transfer failed");
        }

        return amounts;
    }

    function swapExactTokensForETH(
        uint256 amountIn,
        uint256,
        address[] calldata path,
        address to,
        uint256
    ) external returns (uint256[] memory amounts) {
        amounts = getAmountsOut(amountIn, path);

        IERC20(path[0]).transferFrom(msg.sender, address(this), amountIn);

        uint256 amountOut = amounts[amounts.length - 1];
        (bool success, ) = to.call{value: amountOut}("");
        require(success, "ETH transfer failed");

        return amounts;
    }

    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256,
        address[] calldata path,
        address to,
        uint256
    ) external returns (uint256[] memory amounts) {
        amounts = getAmountsOut(amountIn, path);

        IERC20(path[0]).transferFrom(msg.sender, address(this), amountIn);

        uint256 amountOut = amounts[amounts.length - 1];
        IERC20(path[path.length - 1]).transfer(to, amountOut);

        return amounts;
    }

    function factory() external view returns (address) {
        return address(0x1);
    }

    receive() external payable {}
}

// Import MockToken for minting
interface MockToken {
    function mint(address to, uint256 amount) external;
}
