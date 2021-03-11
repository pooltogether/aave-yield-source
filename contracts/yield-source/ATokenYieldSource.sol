// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.6.0 <0.7.0;

import "@aave/protocol-v2/contracts/interfaces/IAToken.sol";
import "@aave/protocol-v2/contracts/interfaces/ILendingPool.sol";
import "@aave/protocol-v2/contracts/interfaces/ILendingPoolAddressesProvider.sol";
import "@aave/protocol-v2/contracts/interfaces/ILendingPoolAddressesProviderRegistry.sol";
import "@aave/protocol-v2/contracts/interfaces/ITokenConfiguration.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

import "../access/AssetManager.sol";
import "../interfaces/IYieldSource.sol";

/// @title Defines the functions used to interact with a yield source. The Prize Pool inherits this contract.
/// @notice Prize Pools subclasses need to implement this interface so that yield can be generated.
contract ATokenYieldSource is IYieldSource, Initializable, OwnableUpgradeable, AssetManager {
  using SafeMathUpgradeable for uint256;

  event ATokenYieldSourceInitialized(
    address indexed aToken,
    address indexed lendingPoolAddressesProviderRegistry,
    uint256 reserveRate,
    address indexed owner
  );

  mapping(address => uint256) public balances;

  /// @notice Interface for the Yield-bearing aToken by Aave
  IAToken public aToken;

  /// @notice Interface for Aave lendingPoolAddressesProviderRegistry
  ILendingPoolAddressesProviderRegistry public lendingPoolAddressesProviderRegistry;

  /// @notice Yield Source reserveRate
  uint256 public reserveRate;

  /// @notice Initializes the Yield Source with Aave aToken
  /// @param _aToken Aave aToken address
  /// @param _lendingPoolAddressesProviderRegistry Aave lendingPoolAddressesProviderRegistry
  /// @param _reserveRate Yield source reserveRate
  function initialize(
    IAToken _aToken,
    ILendingPoolAddressesProviderRegistry _lendingPoolAddressesProviderRegistry,
    uint256 _reserveRate,
    address _owner
  )
    public
    initializer
  {
    aToken = _aToken;
    lendingPoolAddressesProviderRegistry = _lendingPoolAddressesProviderRegistry;
    reserveRate = _reserveRate;

    __Ownable_init();

    emit ATokenYieldSourceInitialized (
      address(aToken),
      address(lendingPoolAddressesProviderRegistry),
      uint256(reserveRate),
      address(_owner)
    );
  }

  /// @notice Returns the ERC20 asset token used for deposits
  /// @return The ERC20 asset token
  function token() external override view returns (address) {
    return _tokenAddress();
  }

  /// @dev Gets the underlying asset token used by the Yield Service
  /// @return A reference to the interface of the underling asset token
  function _token() internal view returns (IERC20Upgradeable) {
    return IERC20Upgradeable(_tokenAddress());
  }

  /// @dev Gets the underlying asset token address
  /// @return Underlying asset token address
  function _tokenAddress() internal view returns (address) {
    return ITokenConfiguration(address(aToken)).UNDERLYING_ASSET_ADDRESS();
  }

  /// @notice Returns the total balance (in asset tokens). This includes the deposits and interest.
  /// @param addr Address to get balance from
  /// @return The underlying balance of asset tokens
  function balanceOf(address addr) external override returns (uint256) {
    return aToken.balanceOf(address(addr));
  }

  /// @notice Supplies asset tokens to the yield source
  /// @param mintAmount The amount of asset tokens to be supplied
  /// @param to The user whose balance will receive the tokens
  function supplyTo(uint256 mintAmount, address to) external override {
    _token().approve(_provider().getLendingPool(), mintAmount);
    _lendingPool().deposit(address(_tokenAddress()), mintAmount, to, uint16(188));
  }

  /// @notice Redeems asset tokens from the yield source
  /// @param redeemAmount The amount of yield-bearing tokens to be redeemed
  /// @return The actual amount of tokens that were redeemed
  function redeem(uint256 redeemAmount) external override returns (uint256) {
    _lendingPool().withdraw(address(_tokenAddress()), redeemAmount, msg.sender);
    return redeemAmount;
  }

  /// @dev Retrieve LendingPoolAddressesProvider address
  /// @return A reference to LendingPoolAddressesProvider interface
  function _provider() internal view returns (ILendingPoolAddressesProvider) {
    return ILendingPoolAddressesProvider(lendingPoolAddressesProviderRegistry.getAddressesProvidersList()[0]);
  }

  /// @dev Retrieve LendingPool address
  /// @return A reference to LendingPool interface
  function _lendingPool() internal view returns (ILendingPool) {
    return ILendingPool(_provider().getLendingPool());
  }
}
