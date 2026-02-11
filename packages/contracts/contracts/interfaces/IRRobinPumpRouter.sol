// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/**
 * @title IRRobinPumpRouter
 * @notice Interface for RobinPump router (pump.fun-style token launch platform on Base)
 * @dev Provides functions for buying/selling tokens on the bonding curve DEX
 */
interface IRRobinPumpRouter {
    /*//////////////////////////////////////////////////////////////
                                STRUCTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Launch information for a token
    struct Launch {
        address token;           // Token address
        address creator;         // Creator address
        string name;             // Token name
        string symbol;           // Token symbol
        string image;            // Token image URI
        string description;      // Token description
        uint256 createdAt;       // Creation timestamp
        uint256 raisedAmount;    // Total ETH raised
        uint256 marketCap;       // Current market cap
        bool graduated;          // Whether token graduated to DEX
        bool bondingCurve;       // Whether still on bonding curve
    }

    /// @notice Bonding curve parameters
    struct BondingCurve {
        uint256 totalSupply;     // Total tokens minted
        uint256 raisedAmount;    // Total ETH raised
        uint256 graduationPoint; // ETH amount needed to graduate
        uint256 progress;        // Progress towards graduation (basis points)
    }

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Emitted when a token is launched
    event TokenLaunched(
        address indexed token,
        address indexed creator,
        string name,
        string symbol,
        uint256 timestamp
    );

    /// @notice Emitted when a user buys tokens
    event TokensBought(
        address indexed token,
        address indexed buyer,
        uint256 ethAmount,
        uint256 tokenAmount,
        uint256 timestamp
    );

    /// @notice Emitted when a user sells tokens
    event TokensSold(
        address indexed token,
        address indexed seller,
        uint256 tokenAmount,
        uint256 ethAmount,
        uint256 timestamp
    );

    /// @notice Emitted when a token graduates to DEX
    event TokenGraduated(
        address indexed token,
        uint256 liquidityETH,
        uint256 liquidityTokens,
        uint256 timestamp
    );

    /*//////////////////////////////////////////////////////////////
                            VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Get launch information for a token
    /// @param token The token address
    /// @return launch The launch information
    function getLaunch(address token) external view returns (Launch memory launch);

    /// @notice Check if a token is a RobinPump token
    /// @param token The token address to check
    /// @return isToken True if the token is on RobinPump
    function isRobinPumpToken(address token) external view returns (bool isToken);

    /// @notice Get the current bonding curve state
    /// @param token The token address
    /// @return curve The bonding curve state
    function getBondingCurve(address token) external view returns (BondingCurve memory curve);

    /// @notice Calculate tokens received for a given ETH amount
    /// @param token The token address
    /// @param ethAmount The amount of ETH to spend
    /// @return tokenAmount The amount of tokens to receive
    function getBuyPrice(address token, uint256 ethAmount)
        external
        view
        returns (uint256 tokenAmount);

    /// @notice Calculate ETH received for a given token amount
    /// @param token The token address
    /// @param tokenAmount The amount of tokens to sell
    /// @return ethAmount The amount of ETH to receive
    function getSellPrice(address token, uint256 tokenAmount)
        external
        view
        returns (uint256 ethAmount);

    /// @notice Get all active launches
    /// @return launches Array of active launches
    function getActiveLaunches() external view returns (Launch[] memory launches);

    /// @notice Get trending launches (by volume raised in last period)
    /// @param limit Maximum number of returns
    /// @return launches Array of trending launches
    function getTrendingLaunches(uint256 limit)
        external
        view
        returns (Launch[] memory launches);

    /// @notice Get launches by a creator
    /// @param creator The creator address
    /// @return launches Array of launches by the creator
    function getLaunchesByCreator(address creator)
        external
        view
        returns (Launch[] memory launches);

    /*//////////////////////////////////////////////////////////////
                            CORE FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Buy tokens on the bonding curve with ETH
    /// @param token The token address to buy
    /// @param minAmountOut Minimum tokens to receive (slippage protection)
    /// @return tokenAmount Actual amount of tokens received
    function buy(address token, uint256 minAmountOut)
        external
        payable
        returns (uint256 tokenAmount);

    /// @notice Sell tokens on the bonding curve for ETH
    /// @param token The token address to sell
    /// @param tokenAmount Amount of tokens to sell
    /// @param minAmountOut Minimum ETH to receive (slippage protection)
    /// @return ethAmount Actual amount of ETH received
    function sell(address token, uint256 tokenAmount, uint256 minAmountOut)
        external
        returns (uint256 ethAmount);

    /// @notice Create a new token launch
    /// @param name Token name
    /// @param symbol Token symbol
    /// @param image Token image URI
    /// @param description Token description
    /// @return token The address of the created token
    function createLaunch(
        string calldata name,
        string calldata symbol,
        string calldata image,
        string calldata description
    ) external returns (address token);

    /*//////////////////////////////////////////////////////////////
                            DEX FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Get the DEX address tokens graduate to
    /// @return dexAddress The DEX router address
    function graduatedDexAddress() external view returns (address dexAddress);

    /// @notice Get the minimum ETH required for graduation
    /// @return minAmount Minimum ETH amount
    function graduationThreshold() external view returns (uint256 minAmount);

    /// @notice Get the trading fee in basis points
    /// @return feeBps Fee in basis points
    function tradingFeeBps() external view returns (uint256 feeBps);

    /// @notice Get the platform fee in basis points
    /// @return feeBps Platform fee in basis points
    function platformFeeBps() external view returns (uint256 feeBps);
}

/**
 * @title IRRobinPumpFactory
 * @notice Interface for RobinPump factory contract
 */
interface IRRobinPumpFactory {
    /// @notice Check if an address is a valid RobinPump token
    /// @param token The token address
    /// @return isValid True if the token is a RobinPump token
    function isRobinPumpToken(address token) external view returns (bool isValid);

    /// @notice Get the router address
    /// @return router The router address
    function router() external view returns (address router);

    /// @notice Get all created tokens
    /// @return tokens Array of token addresses
    function getAllTokens() external view returns (address[] memory tokens);

    /// @notice Get tokens created by an address
    /// @param creator The creator address
    /// @return tokens Array of token addresses
    function getTokensByCreator(address creator)
        external
        view
        returns (address[] memory tokens);
}

/**
 * @title IRRobinPumpToken
 * @notice Interface for RobinPump token contract
 */
interface IRRobinPumpToken {
    /// @notice Get the launch information
    /// @return launch The launch struct
    function launch() external view returns (IRRobinPumpRouter.Launch memory launch);

    /// @notice Check if token has graduated to DEX
    /// @return graduated True if graduated
    function graduated() external view returns (bool graduated);

    /// @notice Get the router address
    /// @return router The router address
    function router() external view returns (address router);
}
