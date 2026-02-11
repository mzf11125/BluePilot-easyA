// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {IUniswapV2Router02} from "./interfaces/IUniswapV2Router02.sol";
import {IRRobinPumpRouter} from "./interfaces/IRRobinPumpRouter.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title TradeExecutor
 * @notice Executes trades through Uniswap V2 Router or RobinPump on Base L2
 * @dev Uses Uniswap V2 Router at 0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24
 * @dev Supports multi-DEX routing with intelligent DEX selection
 */
contract TradeExecutor is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /*//////////////////////////////////////////////////////////////
                            ENUMS
    //////////////////////////////////////////////////////////////*/

    /// @notice DEX Router options for trade execution
    enum DexRouter {
        UNISWAP_V2,  // Uniswap V2 Router (established tokens)
        ROBINPUMP,   // RobinPump Router (new token launches)
        AUTO         // Automatic selection based on token maturity
    }

    /*//////////////////////////////////////////////////////////////
                            EVENTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Emitted when a trade is executed
    /// @param user User address
    /// @param tokenIn Input token address
    /// @param tokenOut Output token address
    /// @param amountIn Amount of input tokens
    /// @param amountOut Amount of output tokens
    /// @param timestamp Trade timestamp
    event TradeExecuted(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        uint256 timestamp
    );

    /// @notice Emitted when a trade is routed through a specific DEX
    /// @param user User address
    /// @param router The DEX router used
    /// @param tokenIn Input token address
    /// @param tokenOut Output token address
    /// @param amountIn Amount of input tokens
    /// @param amountOut Amount of output tokens
    event DexRouted(
        address indexed user,
        DexRouter indexed router,
        address indexed tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );

    /// @notice Emitted when emergency withdraw is executed
    /// @param token Token address (address(0) for ETH)
    /// @param amount Amount withdrawn
    /// @param recipient Recipient address
    event EmergencyWithdraw(address indexed token, uint256 amount, address indexed recipient);

    /// @notice Emitted when a new router is set
    /// @param oldRouter Old router address
    /// @param newRouter New router address
    event RouterUpdated(address indexed oldRouter, address indexed newRouter);

    /// @notice Emitted when RobinPump router is updated
    /// @param oldRouter Old RobinPump router address
    /// @param newRouter New RobinPump router address
    event RobinPumpRouterUpdated(address indexed oldRouter, address indexed newRouter);

    /*//////////////////////////////////////////////////////////////
                          STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    /// @notice Uniswap V2 Router address on Base L2
    IUniswapV2Router02 public immutable uniswapRouter;

    /// @notice RobinPump Router address on Base L2
    IRRobinPumpRouter public robinPumpRouter;

    /// @notice Wrapped ETH token address (WETH on Base)
    address public immutable WETH;

    /// @notice Trading deadline buffer in seconds (default 5 minutes)
    uint256 public deadlineBuffer;

    /// @notice Minimum trade amount in wei (prevent dust trades)
    uint256 public minTradeAmount;

    /// @notice Maximum deadline buffer in seconds
    uint256 public constant MAX_DEADLINE_BUFFER = 1 hours;

    /// @notice Track verified tokens (use for maturity scoring)
    mapping(address => bool) public isVerifiedToken;

    /*//////////////////////////////////////////////////////////////
                            ERRORS
    //////////////////////////////////////////////////////////////*/

    /// @notice Thrown when trade amount is below minimum
    error AmountBelowMinimum(uint256 amount, uint256 minAmount);

    /// @notice Thrown when token transfer fails
    error TokenTransferFailed();

    /// @notice Thrown when trade execution fails
    error TradeFailed();

    /// @notice Thrown when deadline is invalid
    error InvalidDeadline();

    /// @notice Thrown when path is invalid
    error InvalidPath();

    /// @notice Thrown when ETH amount doesn't match msg.value
    error ETHAmountMismatch();

    /*//////////////////////////////////////////////////////////////
                            CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /// @notice Initializes the TradeExecutor contract
    /// @param _uniswapRouter Uniswap V2 Router address
    /// @param _weth Wrapped ETH token address
    /// @param _owner Initial owner address
    /// @param _robinPumpRouter RobinPump Router address (optional, set to address(0) initially)
    constructor(
        address _uniswapRouter,
        address _weth,
        address _owner,
        address _robinPumpRouter
    ) Ownable(_owner) {
        if (_uniswapRouter == address(0)) revert InvalidPath();
        if (_weth == address(0)) revert InvalidPath();

        uniswapRouter = IUniswapV2Router02(_uniswapRouter);
        robinPumpRouter = IRRobinPumpRouter(_robinPumpRouter);
        WETH = _weth;
        deadlineBuffer = 5 minutes;
        minTradeAmount = 1000; // 1000 wei minimum
    }

    /*//////////////////////////////////////////////////////////////
                          SWAP FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Swaps ETH for tokens
    /// @param tokenOut Output token address
    /// @param minAmountOut Minimum amount of tokens to receive
    /// @return amountOut Actual amount of tokens received
    function swapETHForTokens(
        address tokenOut,
        uint256 minAmountOut
    ) external payable nonReentrant returns (uint256 amountOut) {
        if (msg.value == 0) revert AmountBelowMinimum(0, minTradeAmount);
        if (msg.value < minTradeAmount) revert AmountBelowMinimum(msg.value, minTradeAmount);
        if (tokenOut == address(0) || tokenOut == WETH) revert InvalidPath();

        address[] memory path = new address[](2);
        path[0] = WETH;
        path[1] = tokenOut;

        uint256 deadline = block.timestamp + deadlineBuffer;

        try uniswapRouter.swapExactETHForTokens{value: msg.value}(
            minAmountOut,
            path,
            msg.sender,
            deadline
        ) returns (uint256[] memory amounts) {
            amountOut = amounts[amounts.length - 1];
            emit TradeExecuted(msg.sender, WETH, tokenOut, msg.value, amountOut, block.timestamp);
            return amountOut;
        } catch {
            revert TradeFailed();
        }
    }

    /// @notice Swaps tokens for ETH
    /// @param tokenIn Input token address
    /// @param amountIn Amount of tokens to swap
    /// @param minAmountOut Minimum ETH to receive
    /// @return amountOut Actual amount of ETH received
    function swapTokensForETH(
        address tokenIn,
        uint256 amountIn,
        uint256 minAmountOut
    ) external nonReentrant returns (uint256 amountOut) {
        if (tokenIn == address(0) || tokenIn == WETH) revert InvalidPath();
        if (amountIn < minTradeAmount) revert AmountBelowMinimum(amountIn, minTradeAmount);

        // Transfer tokens from caller
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);

        // Approve router
        IERC20(tokenIn).forceApprove(address(uniswapRouter), amountIn);

        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = WETH;

        uint256 deadline = block.timestamp + deadlineBuffer;

        try uniswapRouter.swapExactTokensForETH(amountIn, minAmountOut, path, msg.sender, deadline) returns (
            uint256[] memory amounts
        ) {
            amountOut = amounts[amounts.length - 1];
            emit TradeExecuted(msg.sender, tokenIn, WETH, amountIn, amountOut, block.timestamp);

            // Reset approval
            IERC20(tokenIn).forceApprove(address(uniswapRouter), 0);
            return amountOut;
        } catch {
            IERC20(tokenIn).forceApprove(address(uniswapRouter), 0);
            revert TradeFailed();
        }
    }

    /// @notice Swaps tokens for tokens
    /// @param tokenIn Input token address
    /// @param tokenOut Output token address
    /// @param amountIn Amount of input tokens
    /// @param minAmountOut Minimum amount of output tokens
    /// @return amountOut Actual amount of output tokens
    function swapTokensForTokens(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut
    ) external nonReentrant returns (uint256 amountOut) {
        if (tokenIn == address(0) || tokenOut == address(0)) revert InvalidPath();
        if (tokenIn == tokenOut) revert InvalidPath();
        if (amountIn < minTradeAmount) revert AmountBelowMinimum(amountIn, minTradeAmount);

        // Transfer tokens from caller
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);

        // Approve router
        IERC20(tokenIn).forceApprove(address(uniswapRouter), amountIn);

        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;

        uint256 deadline = block.timestamp + deadlineBuffer;

        try uniswapRouter.swapExactTokensForTokens(
            amountIn,
            minAmountOut,
            path,
            msg.sender,
            deadline
        ) returns (uint256[] memory amounts) {
            amountOut = amounts[amounts.length - 1];
            emit TradeExecuted(msg.sender, tokenIn, tokenOut, amountIn, amountOut, block.timestamp);

            // Reset approval
            IERC20(tokenIn).forceApprove(address(uniswapRouter), 0);
            return amountOut;
        } catch {
            IERC20(tokenIn).forceApprove(address(uniswapRouter), 0);
            revert TradeFailed();
        }
    }

    /// @notice Swaps ETH for tokens through multiple hops
    /// @param path Token path (should start with WETH)
    /// @param minAmountOut Minimum amount of final tokens to receive
    /// @return amountOut Actual amount of final tokens received
    function swapETHForTokensMultiHop(
        address[] calldata path,
        uint256 minAmountOut
    ) external payable nonReentrant returns (uint256 amountOut) {
        if (msg.value == 0) revert AmountBelowMinimum(0, minTradeAmount);
        if (msg.value < minTradeAmount) revert AmountBelowMinimum(msg.value, minTradeAmount);
        if (path.length < 2) revert InvalidPath();
        if (path[0] != WETH) revert InvalidPath();

        uint256 deadline = block.timestamp + deadlineBuffer;

        try uniswapRouter.swapExactETHForTokens{value: msg.value}(
            minAmountOut,
            path,
            msg.sender,
            deadline
        ) returns (uint256[] memory amounts) {
            amountOut = amounts[amounts.length - 1];
            emit TradeExecuted(msg.sender, WETH, path[path.length - 1], msg.value, amountOut, block.timestamp);
            return amountOut;
        } catch {
            revert TradeFailed();
        }
    }

    /// @notice Swaps tokens for tokens through multiple hops
    /// @param path Token path
    /// @param amountIn Amount of input tokens
    /// @param minAmountOut Minimum amount of final tokens to receive
    /// @return amountOut Actual amount of final tokens received
    function swapTokensForTokensMultiHop(
        address[] calldata path,
        uint256 amountIn,
        uint256 minAmountOut
    ) external nonReentrant returns (uint256 amountOut) {
        if (path.length < 2) revert InvalidPath();
        if (amountIn < minTradeAmount) revert AmountBelowMinimum(amountIn, minTradeAmount);

        address tokenIn = path[0];

        // Transfer tokens from caller
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);

        // Approve router
        IERC20(tokenIn).forceApprove(address(uniswapRouter), amountIn);

        uint256 deadline = block.timestamp + deadlineBuffer;

        try uniswapRouter.swapExactTokensForTokens(
            amountIn,
            minAmountOut,
            path,
            msg.sender,
            deadline
        ) returns (uint256[] memory amounts) {
            amountOut = amounts[amounts.length - 1];
            emit TradeExecuted(msg.sender, tokenIn, path[path.length - 1], amountIn, amountOut, block.timestamp);

            // Reset approval
            IERC20(tokenIn).forceApprove(address(uniswapRouter), 0);
            return amountOut;
        } catch {
            IERC20(tokenIn).forceApprove(address(uniswapRouter), 0);
            revert TradeFailed();
        }
    }

    /*//////////////////////////////////////////////////////////////
                          VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Gets the expected output amount for a given input
    /// @param amountIn Input amount
    /// @param path Token path
    /// @return amountOut Expected output amount
    function getAmountOut(uint256 amountIn, address[] calldata path)
        external
        view
        returns (uint256 amountOut)
    {
        uint256[] memory amounts = uniswapRouter.getAmountsOut(amountIn, path);
        return amounts[amounts.length - 1];
    }

    /// @notice Gets the price of a token pair in terms of tokenOut per tokenIn
    /// @param tokenIn Input token address
    /// @param tokenOut Output token address
    /// @param amountIn Amount of input tokens
    /// @return price Price as amountOut per tokenIn
    function getPrice(address tokenIn, address tokenOut, uint256 amountIn)
        external
        view
        returns (uint256 price)
    {
        if (tokenIn == tokenOut) return amountIn;

        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;

        uint256[] memory amounts = uniswapRouter.getAmountsOut(amountIn, path);
        return amounts[1];
    }

    /*//////////////////////////////////////////////////////////////
                        ROBINPUMP FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Buys tokens on RobinPump bonding curve
    /// @param token The token address to buy
    /// @param minAmountOut Minimum tokens to receive
    /// @return amountOut Actual amount of tokens received
    function buyRobinPump(
        address token,
        uint256 minAmountOut
    ) external payable nonReentrant returns (uint256 amountOut) {
        if (msg.value == 0) revert AmountBelowMinimum(0, minTradeAmount);
        if (msg.value < minTradeAmount) revert AmountBelowMinimum(msg.value, minTradeAmount);
        if (address(robinPumpRouter) == address(0)) revert TradeFailed();

        // Check if token is a RobinPump token
        try robinPumpRouter.isRobinPumpToken(token) returns (bool isRP) {
            if (!isRP) revert TradeFailed();
        } catch {
            revert TradeFailed();
        }

        // Execute buy through RobinPump
        try robinPumpRouter.buy{value: msg.value}(token, minAmountOut) returns (uint256 tokens) {
            amountOut = tokens;

            // Transfer tokens to caller
            IERC20(token).safeTransfer(msg.sender, amountOut);

            emit DexRouted(
                msg.sender,
                DexRouter.ROBINPUMP,
                WETH,
                token,
                msg.value,
                amountOut
            );
            emit TradeExecuted(msg.sender, WETH, token, msg.value, amountOut, block.timestamp);

            return amountOut;
        } catch {
            revert TradeFailed();
        }
    }

    /// @notice Sells tokens on RobinPump bonding curve
    /// @param token The token address to sell
    /// @param tokenAmount Amount of tokens to sell
    /// @param minAmountOut Minimum ETH to receive
    /// @return amountOut Actual amount of ETH received
    function sellRobinPump(
        address token,
        uint256 tokenAmount,
        uint256 minAmountOut
    ) external nonReentrant returns (uint256 amountOut) {
        if (tokenAmount < minTradeAmount) revert AmountBelowMinimum(tokenAmount, minTradeAmount);
        if (address(robinPumpRouter) == address(0)) revert TradeFailed();

        // Transfer tokens from caller
        IERC20(token).safeTransferFrom(msg.sender, address(this), tokenAmount);

        // Approve RobinPump router
        IERC20(token).forceApprove(address(robinPumpRouter), tokenAmount);

        // Execute sell through RobinPump
        try robinPumpRouter.sell(token, tokenAmount, minAmountOut) returns (uint256 ethAmount) {
            amountOut = ethAmount;

            // Reset approval
            IERC20(token).forceApprove(address(robinPumpRouter), 0);

            // Transfer ETH to caller
            (bool success, ) = msg.sender.call{value: amountOut}("");
            if (!success) revert TokenTransferFailed();

            emit DexRouted(
                msg.sender,
                DexRouter.ROBINPUMP,
                token,
                WETH,
                tokenAmount,
                amountOut
            );
            emit TradeExecuted(msg.sender, token, WETH, tokenAmount, amountOut, block.timestamp);

            return amountOut;
        } catch {
            IERC20(token).forceApprove(address(robinPumpRouter), 0);
            revert TradeFailed();
        }
    }

    /*//////////////////////////////////////////////////////////////
                        DEX ROUTING FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Selects the best DEX router for a trade based on token maturity
    /// @param tokenIn Input token address
    /// @param tokenOut Output token address
    /// @param amountIn Amount of input tokens
    /// @return router The selected DEX router
    /// @return amountOut Expected output amount
    function selectBestRouter(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external view returns (DexRouter router, uint256 amountOut) {
        // Check if either token is a RobinPump token
        bool isRobinPumpIn = _isRobinPumpToken(tokenIn);
        bool isRobinPumpOut = _isRobinPumpToken(tokenOut);

        // If both tokens are RobinPump tokens, use RobinPump
        if (isRobinPumpIn && isRobinPumpOut) {
            return (DexRouter.ROBINPUMP, _getRobinPumpPrice(tokenIn, tokenOut, amountIn));
        }

        // If one is RobinPump and we're buying/selling the new token
        if ((tokenIn == WETH && isRobinPumpOut) || (isRobinPumpIn && tokenOut == WETH)) {
            return (DexRouter.ROBINPUMP, _getRobinPumpPrice(tokenIn, tokenOut, amountIn));
        }

        // Otherwise use Uniswap V2
        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;

        uint256 uniswapOut;
        try uniswapRouter.getAmountsOut(amountIn, path) returns (uint256[] memory amounts) {
            uniswapOut = amounts[amounts.length - 1];
        } catch {
            uniswapOut = 0;
        }

        return (DexRouter.UNISWAP_V2, uniswapOut);
    }

    /// @notice Check if a token is a RobinPump token
    /// @param token The token address to check
    /// @return isToken True if the token is on RobinPump
    function isRobinPumpToken(address token) external view returns (bool isToken) {
        return _isRobinPumpToken(token);
    }

    /// @notice Get price quote from RobinPump
    /// @param tokenIn Input token address
    /// @param tokenOut Output token address
    /// @param amountIn Input amount
    /// @return amountOut Expected output amount
    function getRobinPumpPrice(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external view returns (uint256 amountOut) {
        return _getRobinPumpPrice(tokenIn, tokenOut, amountIn);
    }

    /*//////////////////////////////////////////////////////////////
                        INTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Internal function to check if token is RobinPump token
    function _isRobinPumpToken(address token) internal view returns (bool) {
        if (address(robinPumpRouter) == address(0)) return false;
        try robinPumpRouter.isRobinPumpToken(token) returns (bool isRP) {
            return isRP;
        } catch {
            return false;
        }
    }

    /// @notice Internal function to get RobinPump price
    function _getRobinPumpPrice(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) internal view returns (uint256) {
        if (address(robinPumpRouter) == address(0)) return 0;

        // If buying token with ETH
        if (tokenIn == WETH) {
            try robinPumpRouter.getBuyPrice(tokenOut, amountIn) returns (uint256 tokenAmount) {
                return tokenAmount;
            } catch {
                return 0;
            }
        }

        // If selling token for ETH
        if (tokenOut == WETH) {
            try robinPumpRouter.getSellPrice(tokenIn, amountIn) returns (uint256 ethAmount) {
                return ethAmount;
            } catch {
                return 0;
            }
        }

        return 0;
    }

    /*//////////////////////////////////////////////////////////////
                        ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Sets the RobinPump router address
    /// @param _robinPumpRouter New RobinPump router address
    function setRobinPumpRouter(address _robinPumpRouter) external onlyOwner {
        address oldRouter = address(robinPumpRouter);
        robinPumpRouter = IRRobinPumpRouter(_robinPumpRouter);
        emit RobinPumpRouterUpdated(oldRouter, _robinPumpRouter);
    }

    /// @notice Sets a token as verified (for maturity scoring)
    /// @param token The token address
    /// @param verified Whether the token is verified
    function setVerifiedToken(address token, bool verified) external onlyOwner {
        isVerifiedToken[token] = verified;
    }

    /// @notice Sets the deadline buffer for trades
    /// @param _deadlineBuffer New deadline buffer in seconds
    function setDeadlineBuffer(uint256 _deadlineBuffer) external onlyOwner {
        if (_deadlineBuffer > MAX_DEADLINE_BUFFER) revert InvalidDeadline();
        deadlineBuffer = _deadlineBuffer;
    }

    /// @notice Sets the minimum trade amount
    /// @param _minTradeAmount New minimum trade amount
    function setMinTradeAmount(uint256 _minTradeAmount) external onlyOwner {
        minTradeAmount = _minTradeAmount;
    }

    /// @notice Emergency withdraw of tokens or ETH
    /// @param token Token address (address(0) for ETH)
    /// @param amount Amount to withdraw
    /// @param recipient Recipient address
    function emergencyWithdraw(
        address token,
        uint256 amount,
        address recipient
    ) external onlyOwner {
        if (recipient == address(0)) revert InvalidPath();

        if (token == address(0)) {
            // Withdraw ETH
            (bool success, ) = recipient.call{value: amount}("");
            if (!success) revert TokenTransferFailed();
        } else {
            // Withdraw ERC20 tokens
            IERC20(token).safeTransfer(recipient, amount);
        }

        emit EmergencyWithdraw(token, amount, recipient);
    }

    /// @notice Receives ETH
    receive() external payable {}
}
