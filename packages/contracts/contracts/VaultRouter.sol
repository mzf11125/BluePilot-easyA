// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {PolicyGuard} from "./PolicyGuard.sol";
import {IUniswapV2Router02} from "./interfaces/IUniswapV2Router02.sol";
import {IRRobinPumpRouter} from "./interfaces/IRRobinPumpRouter.sol";

/**
 * @title VaultRouter
 * @notice Vault system for managing user deposits and executing policy-enforced trades
 * @dev Users can deposit assets, configure trading policies, and execute trades through this contract
 * @dev Supports multi-DEX routing through Uniswap V2 and RobinPump
 */
contract VaultRouter is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /*//////////////////////////////////////////////////////////////
                            STRUCTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Policy configuration for a user
    /// @param maxSlippageBps Maximum slippage in basis points (100 = 1%)
    /// @param maxTradeSize Maximum trade size in wei
    /// @param cooldownSeconds Minimum seconds between trades
    /// @param lastTradeTimestamp Timestamp of the last trade
    /// @param tokenAllowlist List of allowed token addresses (empty = all tokens allowed)
    struct Policy {
        uint16 maxSlippageBps;
        uint256 maxTradeSize;
        uint32 cooldownSeconds;
        uint32 lastTradeTimestamp;
        address[] tokenAllowlist;
    }

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

    /// @notice Emitted when a user deposits tokens
    /// @param user User address
    /// @param token Token address (address(0) for ETH)
    /// @param amount Amount deposited
    event Deposited(address indexed user, address indexed token, uint256 amount);

    /// @notice Emitted when a user withdraws tokens
    /// @param user User address
    /// @param token Token address (address(0) for ETH)
    /// @param amount Amount withdrawn
    event Withdrawn(address indexed user, address indexed token, uint256 amount);

    /// @notice Emitted when a user's policy is updated
    /// @param user User address
    /// @param maxSlippageBps Maximum slippage in basis points
    /// @param maxTradeSize Maximum trade size
    /// @param cooldownSeconds Cooldown period
    event PolicyUpdated(
        address indexed user,
        uint16 maxSlippageBps,
        uint256 maxTradeSize,
        uint32 cooldownSeconds
    );

    /// @notice Emitted when a user's extended policy is updated
    /// @param user User address
    /// @param maxNewTokenTradeSize Maximum trade size for new tokens
    /// @param enableRobinPump Whether RobinPump trading is enabled
    /// @param forceUniswap Whether to force Uniswap routing
    event ExtendedPolicyUpdated(
        address indexed user,
        uint256 maxNewTokenTradeSize,
        bool enableRobinPump,
        bool forceUniswap
    );

    /// @notice Emitted when a trade is executed through the vault
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

    /// @notice Emitted when the TradeExecutor contract is updated
    /// @param oldExecutor Old executor address
    /// @param newExecutor New executor address
    event TradeExecutorUpdated(address indexed oldExecutor, address indexed newExecutor);

    /// @notice Emitted when protocol fees are collected
    /// @param token Token address
    /// @param amount Fee amount collected
    event FeesCollected(address indexed token, uint256 amount);

    /// @notice Emitted when a trade is routed through a specific DEX
    /// @param user User address
    /// @param router The DEX router used
    /// @param tokenIn Input token address
    /// @param tokenOut Output token address
    event DexRouted(
        address indexed user,
        DexRouter indexed router,
        address indexed tokenIn,
        address tokenOut,
        uint256 amountIn
    );

    /*//////////////////////////////////////////////////////////////
                            ERRORS
    //////////////////////////////////////////////////////////////*/

    /// @notice Thrown when user has insufficient balance
    error InsufficientBalance(uint256 available, uint256 required);

    /// @notice Thrown when withdrawal amount exceeds available balance
    error InsufficientVaultBalance(uint256 available, uint256 requested);

    /// @notice Thrown when trade execution fails
    error TradeExecutionFailed();

    /// @notice Thrown when invalid token address is provided
    error InvalidTokenAddress();

    /// @notice Thrown when trade size exceeds vault balance
    error TradeExceedsBalance(uint256 tradeSize, uint256 balance);

    /// @notice Thrown when caller is not the user
    error UnauthorizedCaller(address caller, address expectedUser);

    /*//////////////////////////////////////////////////////////////
                          STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    /// @notice Vault balances for each user and token
    /// @dev user => token => balance
    mapping(address => mapping(address => uint256)) public vaultBalances;

    /// @notice Trading policies for each user
    mapping(address => Policy) public userPolicies;

    /// @notice Extended trading policies for each user (DEX routing preferences)
    mapping(address => ExtendedPolicy) public extendedPolicies;

    /// @notice TradeExecutor contract reference
    address public tradeExecutor;

    /// @notice Uniswap V2 Router
    IUniswapV2Router02 public immutable uniswapRouter;

    /// @notice RobinPump Router
    IRRobinPumpRouter public robinPumpRouter;

    /// @notice Wrapped ETH token address
    address public immutable WETH;

    /// @notice Protocol fee in basis points (max 100 = 1%)
    uint16 public protocolFeeBps;

    /// @notice Fee recipient address
    address public feeRecipient;

    /// @notice Total deposited amounts across all users
    mapping(address => uint256) public totalDeposits;

    /// @notice Maximum protocol fee (100 bps = 1%)
    uint16 public constant MAX_PROTOCOL_FEE_BPS = 100;

    /*//////////////////////////////////////////////////////////////
                          STRUCTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Extended policy configuration for DEX routing
    /// @param maxNewTokenTradeSize Maximum trade size for new/unverified tokens
    /// @param enableRobinPump Whether RobinPump trading is enabled
    /// @param forceUniswap Whether to force Uniswap routing for all trades
    /// @param minLiquidityThreshold Minimum liquidity threshold for using RobinPump
    struct ExtendedPolicy {
        uint256 maxNewTokenTradeSize;
        bool enableRobinPump;
        bool forceUniswap;
        uint256 minLiquidityThreshold;
    }

    /*//////////////////////////////////////////////////////////////
                          CONSTANTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Default maximum slippage (300 bps = 3%)
    uint16 public constant DEFAULT_MAX_SLIPPAGE_BPS = 300;

    /// @notice Default maximum trade size (10 ETH)
    uint256 public constant DEFAULT_MAX_TRADE_SIZE = 10 ether;

    /// @notice Default cooldown period (60 seconds)
    uint32 public constant DEFAULT_COOLDOWN_SECONDS = 60;

    /*//////////////////////////////////////////////////////////////
                            MODIFIERS
    //////////////////////////////////////////////////////////////*/

    /// @notice Ensures the caller is the owner of the vault
    modifier onlyVaultUser(address user) {
        if (msg.sender != user) {
            revert UnauthorizedCaller(msg.sender, user);
        }
        _;
    }

    /*//////////////////////////////////////////////////////////////
                          CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /// @notice Initializes the VaultRouter contract
    /// @param _uniswapRouter Uniswap V2 Router address
    /// @param _weth Wrapped ETH token address
    /// @param _tradeExecutor TradeExecutor contract address
    /// @param _feeRecipient Fee recipient address
    /// @param _protocolFeeBps Initial protocol fee in basis points
    /// @param _owner Initial owner address
    /// @param _robinPumpRouter RobinPump Router address (optional)
    constructor(
        address _uniswapRouter,
        address _weth,
        address _tradeExecutor,
        address _feeRecipient,
        uint16 _protocolFeeBps,
        address _owner,
        address _robinPumpRouter
    ) Ownable(_owner) {
        if (_uniswapRouter == address(0) || _weth == address(0) || _tradeExecutor == address(0)) {
            revert InvalidTokenAddress();
        }

        uniswapRouter = IUniswapV2Router02(_uniswapRouter);
        robinPumpRouter = IRRobinPumpRouter(_robinPumpRouter);
        WETH = _weth;
        tradeExecutor = _tradeExecutor;
        feeRecipient = _feeRecipient;
        protocolFeeBps = _protocolFeeBps;

        if (_protocolFeeBps > MAX_PROTOCOL_FEE_BPS) {
            _protocolFeeBps = MAX_PROTOCOL_FEE_BPS;
            protocolFeeBps = MAX_PROTOCOL_FEE_BPS;
        }
    }

    /*//////////////////////////////////////////////////////////////
                        DEPOSIT / WITHDRAW
    //////////////////////////////////////////////////////////////*/

    /// @notice Deposits ETH into the vault
    /// @return amount Amount of ETH deposited
    function depositETH() external payable nonReentrant returns (uint256 amount) {
        amount = msg.value;
        if (amount == 0) revert InsufficientBalance(0, 1);

        vaultBalances[msg.sender][address(0)] += amount;
        totalDeposits[address(0)] += amount;

        emit Deposited(msg.sender, address(0), amount);
        return amount;
    }

    /// @notice Deposits ERC20 tokens into the vault
    /// @param token Token address
    /// @param amount Amount to deposit
    /// @return depositedAmount Amount of tokens deposited
    function depositToken(address token, uint256 amount)
        external
        nonReentrant
        returns (uint256 depositedAmount)
    {
        if (token == address(0)) revert InvalidTokenAddress();
        if (amount == 0) revert InsufficientBalance(0, 1);

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        vaultBalances[msg.sender][token] += amount;
        totalDeposits[token] += amount;

        emit Deposited(msg.sender, token, amount);
        return amount;
    }

    /// @notice Withdraws ETH from the vault
    /// @param amount Amount to withdraw
    /// @return withdrawnAmount Amount of ETH withdrawn
    function withdrawETH(uint256 amount) external nonReentrant returns (uint256 withdrawnAmount) {
        if (amount == 0) revert InsufficientBalance(0, 1);

        uint256 balance = vaultBalances[msg.sender][address(0)];
        if (balance < amount) revert InsufficientVaultBalance(balance, amount);

        vaultBalances[msg.sender][address(0)] -= amount;
        totalDeposits[address(0)] -= amount;

        (bool success, ) = msg.sender.call{value: amount}("");
        if (!success) revert TradeExecutionFailed();

        emit Withdrawn(msg.sender, address(0), amount);
        return amount;
    }

    /// @notice Withdraws ERC20 tokens from the vault
    /// @param token Token address
    /// @param amount Amount to withdraw
    /// @return withdrawnAmount Amount of tokens withdrawn
    function withdrawToken(
        address token,
        uint256 amount
    ) external nonReentrant returns (uint256 withdrawnAmount) {
        if (token == address(0)) revert InvalidTokenAddress();
        if (amount == 0) revert InsufficientBalance(0, 1);

        uint256 balance = vaultBalances[msg.sender][token];
        if (balance < amount) revert InsufficientVaultBalance(balance, amount);

        vaultBalances[msg.sender][token] -= amount;
        totalDeposits[token] -= amount;

        IERC20(token).safeTransfer(msg.sender, amount);

        emit Withdrawn(msg.sender, token, amount);
        return amount;
    }

    /// @notice Withdraws all ETH from the vault
    /// @return amount Amount withdrawn
    function withdrawAllETH() external nonReentrant returns (uint256 amount) {
        amount = vaultBalances[msg.sender][address(0)];
        if (amount == 0) return 0;

        vaultBalances[msg.sender][address(0)] = 0;
        totalDeposits[address(0)] -= amount;

        (bool success, ) = msg.sender.call{value: amount}("");
        if (!success) revert TradeExecutionFailed();

        emit Withdrawn(msg.sender, address(0), amount);
        return amount;
    }

    /// @notice Withdraws all tokens from the vault
    /// @param token Token address
    /// @return amount Amount withdrawn
    function withdrawAllToken(address token) external nonReentrant returns (uint256 amount) {
        if (token == address(0)) revert InvalidTokenAddress();

        amount = vaultBalances[msg.sender][token];
        if (amount == 0) return 0;

        vaultBalances[msg.sender][token] = 0;
        totalDeposits[token] -= amount;

        IERC20(token).safeTransfer(msg.sender, amount);

        emit Withdrawn(msg.sender, token, amount);
        return amount;
    }

    /*//////////////////////////////////////////////////////////////
                          POLICY MANAGEMENT
    //////////////////////////////////////////////////////////////*/

    /// @notice Sets or updates a user's trading policy
    /// @param user User address (must be msg.sender)
    /// @param maxSlippageBps Maximum slippage in basis points
    /// @param maxTradeSize Maximum trade size
    /// @param cooldownSeconds Cooldown period in seconds
    /// @param tokenAllowlist List of allowed tokens (empty = all allowed)
    function setPolicy(
        address user,
        uint16 maxSlippageBps,
        uint256 maxTradeSize,
        uint32 cooldownSeconds,
        address[] calldata tokenAllowlist
    ) external onlyVaultUser(user) {
        if (maxSlippageBps > 10000) maxSlippageBps = 10000; // Max 100%

        // Preserve existing lastTradeTimestamp
        Policy storage existingPolicy = userPolicies[user];
        uint32 existingTimestamp = existingPolicy.lastTradeTimestamp;

        userPolicies[user] = Policy({
            maxSlippageBps: maxSlippageBps,
            maxTradeSize: maxTradeSize,
            cooldownSeconds: cooldownSeconds,
            lastTradeTimestamp: existingTimestamp,
            tokenAllowlist: tokenAllowlist
        });

        emit PolicyUpdated(user, maxSlippageBps, maxTradeSize, cooldownSeconds);
    }

    /// @notice Sets a simplified policy for a user
    /// @param user User address (must be msg.sender)
    /// @param maxSlippageBps Maximum slippage in basis points
    /// @param maxTradeSize Maximum trade size
    function setSimplePolicy(
        address user,
        uint16 maxSlippageBps,
        uint256 maxTradeSize
    ) external onlyVaultUser(user) {
        if (maxSlippageBps > 10000) maxSlippageBps = 10000;

        // Preserve existing lastTradeTimestamp
        Policy storage existingPolicy = userPolicies[user];
        uint32 existingTimestamp = existingPolicy.lastTradeTimestamp;

        userPolicies[user] = Policy({
            maxSlippageBps: maxSlippageBps,
            maxTradeSize: maxTradeSize,
            cooldownSeconds: DEFAULT_COOLDOWN_SECONDS,
            lastTradeTimestamp: existingTimestamp,
            tokenAllowlist: new address[](0)
        });

        emit PolicyUpdated(user, maxSlippageBps, maxTradeSize, DEFAULT_COOLDOWN_SECONDS);
    }

    /// @notice Initializes a default policy for a new user
    /// @param user User address
    function initializeDefaultPolicy(address user) public {
        // Only owner or user themselves can initialize
        if (msg.sender != user && msg.sender != owner()) {
            revert UnauthorizedCaller(msg.sender, user);
        }

        // Check if policy already exists
        Policy storage existingPolicy = userPolicies[user];
        if (existingPolicy.maxTradeSize != 0) {
            return; // Already initialized
        }

        userPolicies[user] = Policy({
            maxSlippageBps: DEFAULT_MAX_SLIPPAGE_BPS,
            maxTradeSize: DEFAULT_MAX_TRADE_SIZE,
            cooldownSeconds: DEFAULT_COOLDOWN_SECONDS,
            lastTradeTimestamp: 0,
            tokenAllowlist: new address[](0)
        });

        emit PolicyUpdated(user, DEFAULT_MAX_SLIPPAGE_BPS, DEFAULT_MAX_TRADE_SIZE, DEFAULT_COOLDOWN_SECONDS);
    }

    /// @notice Sets or updates a user's extended trading policy (DEX routing)
    /// @param user User address (must be msg.sender)
    /// @param maxNewTokenTradeSize Maximum trade size for new/unverified tokens
    /// @param enableRobinPump Whether RobinPump trading is enabled
    /// @param forceUniswap Whether to force Uniswap routing for all trades
    /// @param minLiquidityThreshold Minimum liquidity threshold for using RobinPump
    function setExtendedPolicy(
        address user,
        uint256 maxNewTokenTradeSize,
        bool enableRobinPump,
        bool forceUniswap,
        uint256 minLiquidityThreshold
    ) external onlyVaultUser(user) {
        extendedPolicies[user] = ExtendedPolicy({
            maxNewTokenTradeSize: maxNewTokenTradeSize,
            enableRobinPump: enableRobinPump,
            forceUniswap: forceUniswap,
            minLiquidityThreshold: minLiquidityThreshold
        });

        emit ExtendedPolicyUpdated(user, maxNewTokenTradeSize, enableRobinPump, forceUniswap);
    }

    /// @notice Sets a simplified extended policy
    /// @param user User address (must be msg.sender)
    /// @param enableRobinPump Whether RobinPump trading is enabled
    function setSimpleExtendedPolicy(
        address user,
        bool enableRobinPump
    ) external onlyVaultUser(user) {
        extendedPolicies[user] = ExtendedPolicy({
            maxNewTokenTradeSize: 0.5 ether, // Default 0.5 ETH for new tokens
            enableRobinPump: enableRobinPump,
            forceUniswap: false,
            minLiquidityThreshold: 10 ether // Default 10 ETH threshold
        });

        emit ExtendedPolicyUpdated(user, 0.5 ether, enableRobinPump, false);
    }

    /*//////////////////////////////////////////////////////////////
                          TRADE EXECUTION
    //////////////////////////////////////////////////////////////*/

    /// @notice Executes a trade from the vault with DEX routing
    /// @param tokenIn Input token address (address(0) for ETH)
    /// @param tokenOut Output token address (address(0) for ETH)
    /// @param amountIn Amount to trade
    /// @param minAmountOut Minimum amount to receive
    /// @param preferredRouter Preferred DEX router (AUTO for automatic selection)
    /// @return amountOut Actual amount received
    function executeTradeWithRouter(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut,
        DexRouter preferredRouter
    ) public nonReentrant returns (uint256 amountOut) {
        // Get user's policy
        Policy storage policy = userPolicies[msg.sender];

        // Initialize default policy if not set
        if (policy.maxTradeSize == 0) {
            initializeDefaultPolicy(msg.sender);
            policy = userPolicies[msg.sender];
        }

        // Get extended policy
        ExtendedPolicy storage extPolicy = extendedPolicies[msg.sender];

        // Validate trade against policy
        PolicyGuard.checkTradeSize(amountIn, policy.maxTradeSize);
        PolicyGuard.checkCooldown(policy.lastTradeTimestamp, policy.cooldownSeconds);
        PolicyGuard.checkTokenAllowlist(tokenIn, policy.tokenAllowlist);
        PolicyGuard.checkTokenAllowlist(tokenOut, policy.tokenAllowlist);

        // Ensure sufficient vault balance
        uint256 vaultBalance = vaultBalances[msg.sender][tokenIn];
        if (vaultBalance < amountIn) {
            revert TradeExceedsBalance(amountIn, vaultBalance);
        }

        // Determine which DEX to use
        DexRouter selectedRouter = _selectDexRouter(
            tokenIn,
            tokenOut,
            amountIn,
            preferredRouter,
            extPolicy
        );

        // Emit routing event
        emit DexRouted(msg.sender, selectedRouter, tokenIn, tokenOut, amountIn);

        // Deduct from vault balance
        vaultBalances[msg.sender][tokenIn] -= amountIn;

        // Execute trade based on selected router
        if (selectedRouter == DexRouter.ROBINPUMP) {
            amountOut = _executeRobinPumpTrade(tokenIn, tokenOut, amountIn, minAmountOut);
        } else {
            // Execute through Uniswap V2
            if (tokenIn == address(0)) {
                amountOut = _executeETHTrade(tokenOut, amountIn, minAmountOut);
            } else {
                amountOut = _executeTokenTrade(tokenIn, tokenOut, amountIn, minAmountOut);
            }
        }

        // Add output to vault balance
        vaultBalances[msg.sender][tokenOut] += amountOut;

        // Update last trade timestamp
        policy.lastTradeTimestamp = uint32(block.timestamp);

        emit TradeExecuted(msg.sender, tokenIn, tokenOut, amountIn, amountOut, block.timestamp);

        return amountOut;
    }

    /// @notice Executes a trade from the vault (original function, defaults to AUTO routing)
    /// @param tokenIn Input token address (address(0) for ETH)
    /// @param tokenOut Output token address (address(0) for ETH)
    /// @param amountIn Amount to trade
    /// @param minAmountOut Minimum amount to receive
    /// @return amountOut Actual amount received
    function executeTrade(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut
    ) external nonReentrant returns (uint256 amountOut) {
        return executeTradeWithRouter(tokenIn, tokenOut, amountIn, minAmountOut, DexRouter.AUTO);
    }

    /*//////////////////////////////////////////////////////////////
                        DEX SELECTION FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Internal function to select the best DEX router
    /// @param tokenIn Input token address
    /// @param tokenOut Output token address
    /// @param amountIn Amount to trade
    /// @param preferredRouter User's preferred router
    /// @param extPolicy Extended policy configuration
    /// @return selectedRouter The selected DEX router
    function _selectDexRouter(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        DexRouter preferredRouter,
        ExtendedPolicy storage extPolicy
    ) internal view returns (DexRouter selectedRouter) {
        // If user forces Uniswap, always use Uniswap
        if (extPolicy.forceUniswap || preferredRouter == DexRouter.UNISWAP_V2) {
            return DexRouter.UNISWAP_V2;
        }

        // If user explicitly wants RobinPump
        if (preferredRouter == DexRouter.ROBINPUMP) {
            return DexRouter.ROBINPUMP;
        }

        // Check if RobinPump is available and enabled
        if (address(robinPumpRouter) == address(0) || !extPolicy.enableRobinPump) {
            return DexRouter.UNISWAP_V2;
        }

        // Check if either token is a RobinPump token
        bool isRobinPumpIn = _isRobinPumpToken(tokenIn);
        bool isRobinPumpOut = _isRobinPumpToken(tokenOut);

        // If both tokens are RobinPump tokens, use RobinPump
        if (isRobinPumpIn && isRobinPumpOut) {
            return DexRouter.ROBINPUMP;
        }

        // If one is RobinPump and we're trading with ETH
        if ((tokenIn == address(0) || tokenIn == WETH) && isRobinPumpOut) {
            // Check if trade size is within new token limit
            if (amountIn <= extPolicy.maxNewTokenTradeSize) {
                return DexRouter.ROBINPUMP;
            }
        }

        if ((tokenOut == address(0) || tokenOut == WETH) && isRobinPumpIn) {
            if (amountIn <= extPolicy.maxNewTokenTradeSize) {
                return DexRouter.ROBINPUMP;
            }
        }

        // Default to Uniswap V2
        return DexRouter.UNISWAP_V2;
    }

    /// @notice Check if a token is a RobinPump token
    /// @param token The token address to check
    /// @return isToken True if the token is on RobinPump
    function _isRobinPumpToken(address token) internal view returns (bool) {
        if (address(robinPumpRouter) == address(0)) return false;
        try robinPumpRouter.isRobinPumpToken(token) returns (bool isRP) {
            return isRP;
        } catch {
            return false;
        }
    }

    /*//////////////////////////////////////////////////////////////
                      ROBINPUMP TRADE FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Internal function to execute RobinPump trades
    /// @param tokenIn Input token address
    /// @param tokenOut Output token address
    /// @param amountIn Amount to trade
    /// @param minAmountOut Minimum amount to receive
    /// @return amountOut Actual amount received
    function _executeRobinPumpTrade(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut
    ) internal returns (uint256 amountOut) {
        if (tokenIn == address(0) || tokenIn == WETH) {
            // Buying token with ETH
            uint256 feeAmount = (amountIn * protocolFeeBps) / 10000;
            uint256 tradeAmount = amountIn - feeAmount;

            // Send fee to recipient
            if (feeAmount > 0) {
                (bool success, ) = feeRecipient.call{value: feeAmount}("");
                if (success) {
                    emit FeesCollected(address(0), feeAmount);
                }
            }

            // Execute buy through RobinPump
            try robinPumpRouter.buy{value: tradeAmount}(tokenOut, minAmountOut) returns (uint256 tokens) {
                return tokens;
            } catch {
                revert TradeExecutionFailed();
            }
        } else if (tokenOut == address(0) || tokenOut == WETH) {
            // Selling token for ETH
            IERC20(tokenIn).forceApprove(address(robinPumpRouter), amountIn);

            uint256 feeAmount = (amountIn * protocolFeeBps) / 10000;
            uint256 tradeAmount = amountIn - feeAmount;

            // Execute sell through RobinPump
            try robinPumpRouter.sell(tokenIn, tradeAmount, minAmountOut) returns (uint256 ethAmount) {
                IERC20(tokenIn).forceApprove(address(robinPumpRouter), 0);
                return ethAmount;
            } catch {
                IERC20(tokenIn).forceApprove(address(robinPumpRouter), 0);
                revert TradeExecutionFailed();
            }
        } else {
            revert TradeExecutionFailed();
        }
    }

    /*//////////////////////////////////////////////////////////////
                        UNISWAP TRADE EXECUTION
    //////////////////////////////////////////////////////////////*/

    /// @notice Internal function to execute ETH trades
    function _executeETHTrade(
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut
    ) internal returns (uint256 amountOut) {
        address[] memory path = new address[](2);
        path[0] = WETH;
        path[1] = tokenOut;

        uint256 deadline = block.timestamp + 300; // 5 minutes

        // Calculate protocol fee
        uint256 feeAmount = (amountIn * protocolFeeBps) / 10000;
        uint256 tradeAmount = amountIn - feeAmount;

        // Send fee to recipient
        if (feeAmount > 0) {
            (bool success, ) = feeRecipient.call{value: feeAmount}("");
            if (success) {
                emit FeesCollected(address(0), feeAmount);
            }
        }

        // Execute swap
        try uniswapRouter.swapExactETHForTokens{value: tradeAmount}(
            minAmountOut,
            path,
            address(this),
            deadline
        ) returns (uint256[] memory amounts) {
            return amounts[amounts.length - 1];
        } catch {
            revert TradeExecutionFailed();
        }
    }

    /// @notice Internal function to execute token trades
    function _executeTokenTrade(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut
    ) internal returns (uint256 amountOut) {
        address[] memory path;
        if (tokenOut == address(0)) {
            path = new address[](2);
            path[0] = tokenIn;
            path[1] = WETH;
        } else {
            path = new address[](2);
            path[0] = tokenIn;
            path[1] = tokenOut;
        }

        uint256 deadline = block.timestamp + 300;

        // Calculate protocol fee
        uint256 feeAmount = (amountIn * protocolFeeBps) / 10000;
        uint256 tradeAmount = amountIn - feeAmount;

        // Send fee to recipient
        if (feeAmount > 0 && tokenIn != WETH) {
            IERC20(tokenIn).safeTransfer(feeRecipient, feeAmount);
            emit FeesCollected(tokenIn, feeAmount);
        }

        // Approve router
        IERC20(tokenIn).forceApprove(address(uniswapRouter), tradeAmount);

        if (tokenOut == address(0)) {
            // Swap tokens for ETH
            try uniswapRouter.swapExactTokensForETH(tradeAmount, minAmountOut, path, address(this), deadline) returns (
                uint256[] memory amounts
            ) {
                IERC20(tokenIn).forceApprove(address(uniswapRouter), 0);
                return amounts[amounts.length - 1];
            } catch {
                IERC20(tokenIn).forceApprove(address(uniswapRouter), 0);
                revert TradeExecutionFailed();
            }
        } else {
            // Swap tokens for tokens
            try uniswapRouter.swapExactTokensForTokens(
                tradeAmount,
                minAmountOut,
                path,
                address(this),
                deadline
            ) returns (uint256[] memory amounts) {
                IERC20(tokenIn).forceApprove(address(uniswapRouter), 0);
                return amounts[amounts.length - 1];
            } catch {
                IERC20(tokenIn).forceApprove(address(uniswapRouter), 0);
                revert TradeExecutionFailed();
            }
        }
    }

    /*//////////////////////////////////////////////////////////////
                          VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Gets the vault balance for a user and token
    /// @param user User address
    /// @param token Token address (address(0) for ETH)
    /// @return balance The user's vault balance
    function getVaultBalance(address user, address token) external view returns (uint256 balance) {
        return vaultBalances[user][token];
    }

    /// @notice Gets multiple vault balances for a user
    /// @param user User address
    /// @param tokens List of token addresses
    /// @return balances List of balances
    function getVaultBalances(address user, address[] calldata tokens)
        external
        view
        returns (uint256[] memory balances)
    {
        balances = new uint256[](tokens.length);
        for (uint256 i = 0; i < tokens.length; i++) {
            balances[i] = vaultBalances[user][tokens[i]];
        }
        return balances;
    }

    /// @notice Gets a user's policy
    /// @param user User address
    /// @return maxSlippageBps Maximum slippage in basis points
    /// @return maxTradeSize Maximum trade size
    /// @return cooldownSeconds Cooldown period
    /// @return lastTradeTimestamp Timestamp of last trade
    /// @return tokenAllowlist List of allowed tokens
    function getPolicy(address user)
        external
        view
        returns (
            uint16 maxSlippageBps,
            uint256 maxTradeSize,
            uint32 cooldownSeconds,
            uint32 lastTradeTimestamp,
            address[] memory tokenAllowlist
        )
    {
        Policy memory policy = userPolicies[user];
        return (
            policy.maxSlippageBps,
            policy.maxTradeSize,
            policy.cooldownSeconds,
            policy.lastTradeTimestamp,
            policy.tokenAllowlist
        );
    }

    /// @notice Gets a user's extended policy
    /// @param user User address
    /// @return maxNewTokenTradeSize Maximum trade size for new tokens
    /// @return enableRobinPump Whether RobinPump is enabled
    /// @return forceUniswap Whether Uniswap is forced
    /// @return minLiquidityThreshold Minimum liquidity threshold
    function getExtendedPolicy(address user)
        external
        view
        returns (
            uint256 maxNewTokenTradeSize,
            bool enableRobinPump,
            bool forceUniswap,
            uint256 minLiquidityThreshold
        )
    {
        ExtendedPolicy memory policy = extendedPolicies[user];
        return (
            policy.maxNewTokenTradeSize,
            policy.enableRobinPump,
            policy.forceUniswap,
            policy.minLiquidityThreshold
        );
    }

    /// @notice Simulates a trade to get expected output
    /// @param tokenIn Input token address
    /// @param tokenOut Output token address
    /// @param amountIn Input amount
    /// @return amountOut Expected output amount
    function simulateTrade(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external view returns (uint256 amountOut) {
        address[] memory path;
        if (tokenIn == address(0)) {
            if (tokenOut == address(0)) revert InvalidTokenAddress();
            path = new address[](2);
            path[0] = WETH;
            path[1] = tokenOut;
        } else if (tokenOut == address(0)) {
            path = new address[](2);
            path[0] = tokenIn;
            path[1] = WETH;
        } else {
            path = new address[](2);
            path[0] = tokenIn;
            path[1] = tokenOut;
        }

        uint256[] memory amounts = uniswapRouter.getAmountsOut(amountIn, path);
        return amounts[amounts.length - 1];
    }

    /*//////////////////////////////////////////////////////////////
                        ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Updates the TradeExecutor contract address
    /// @param _tradeExecutor New TradeExecutor address
    function setTradeExecutor(address _tradeExecutor) external onlyOwner {
        if (_tradeExecutor == address(0)) revert InvalidTokenAddress();
        address oldExecutor = tradeExecutor;
        tradeExecutor = _tradeExecutor;
        emit TradeExecutorUpdated(oldExecutor, _tradeExecutor);
    }

    /// @notice Updates the protocol fee
    /// @param _protocolFeeBps New protocol fee in basis points
    function setProtocolFee(uint16 _protocolFeeBps) external onlyOwner {
        if (_protocolFeeBps > MAX_PROTOCOL_FEE_BPS) {
            _protocolFeeBps = MAX_PROTOCOL_FEE_BPS;
        }
        protocolFeeBps = _protocolFeeBps;
    }

    /// @notice Updates the fee recipient
    /// @param _feeRecipient New fee recipient address
    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        if (_feeRecipient == address(0)) revert InvalidTokenAddress();
        feeRecipient = _feeRecipient;
    }

    /// @notice Updates the RobinPump router address
    /// @param _robinPumpRouter New RobinPump router address
    function setRobinPumpRouter(address _robinPumpRouter) external onlyOwner {
        address oldRouter = address(robinPumpRouter);
        robinPumpRouter = IRRobinPumpRouter(_robinPumpRouter);
        emit TradeExecutorUpdated(oldRouter, _robinPumpRouter);
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
        if (recipient == address(0)) revert InvalidTokenAddress();

        if (token == address(0)) {
            (bool success, ) = recipient.call{value: amount}("");
            if (!success) revert TradeExecutionFailed();
        } else {
            IERC20(token).safeTransfer(recipient, amount);
        }
    }

    /// @notice Receives ETH
    receive() external payable {}
}
