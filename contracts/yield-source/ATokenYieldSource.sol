// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.6.0 <0.7.0;

import "@aave/protocol-v2/contracts/interfaces/ILendingPool.sol";
import "@aave/protocol-v2/contracts/interfaces/ILendingPoolAddressesProvider.sol";
import "@aave/protocol-v2/contracts/interfaces/ILendingPoolAddressesProviderRegistry.sol";
import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

import "../access/AssetManager.sol";
import "../external/aave/ATokenInterface.sol";
import "../interfaces/IProtocolYieldSource.sol";
import "../interfaces/IReserve.sol";

/// @title Defines the functions used to interact with a yield source. The Prize Pool inherits this contract.
/// @notice Prize Pools subclasses need to implement this interface so that yield can be generated.
contract ATokenYieldSource is IProtocolYieldSource, Initializable, AssetManager {
  using SafeMathUpgradeable for uint256;

  event ATokenYieldSourceInitialized(
    address indexed aToken,
    address lendingPoolAddressesProviderRegistry,
    address indexed reserve,
    address indexed owner
  );

  mapping(address => uint256) public balances;

  /// @notice Interface for the Yield-bearing aToken by Aave
  ATokenInterface public aToken;

  /// @notice Interface for Aave lendingPoolAddressesProviderRegistry
  ILendingPoolAddressesProviderRegistry public lendingPoolAddressesProviderRegistry;

  /// @notice Yield Source Reserve
  IReserve public override reserve;

  /// @notice Initializes the Yield Source with Aave aToken
  /// @param _aToken Aave aToken address
  /// @param _lendingPoolAddressesProviderRegistry Aave lendingPoolAddressesProviderRegistry
  /// @param _reserve Yield Source Reserve
  function initialize(
    ATokenInterface _aToken,
    ILendingPoolAddressesProviderRegistry _lendingPoolAddressesProviderRegistry,
    IReserve _reserve,
    address _owner
  )
    public
    initializer
  {
    aToken = _aToken;
    lendingPoolAddressesProviderRegistry = _lendingPoolAddressesProviderRegistry;
    reserve = _reserve;

    __Ownable_init();

    emit ATokenYieldSourceInitialized (
      address(aToken),
      address(lendingPoolAddressesProviderRegistry),
      address(reserve),
      address(_owner)
    );
  }

  /// @notice Returns the ERC20 asset token used for deposits
  /// @return The ERC20 asset token
  function token() public override view returns (IERC20Upgradeable) {
    return IERC20Upgradeable(_tokenAddress());
  }

  /// @dev Gets the underlying asset token address
  /// @return Underlying asset token address
  function _tokenAddress() internal view returns (address) {
    return aToken.UNDERLYING_ASSET_ADDRESS();
  }

  /// @notice Returns the total balance (in asset tokens). This includes the deposits and interest.
  /// @param addr Address to get balance from
  /// @return The underlying balance of asset tokens
  function balanceOf(address addr) external override returns (uint256) {
    return aToken.balanceOf(address(addr));
  }

  /// @notice Supplies asset tokens to Aave
  /// @param mintAmount The amount of asset tokens to be supplied
  /// @param to The user whose balance will receive the tokens
  function _depositToAave(uint256 mintAmount, address to) internal {
    token().approve(address(_lendingPool()), mintAmount);
    _lendingPool().deposit(address(_tokenAddress()), mintAmount, to, uint16(188));
  }

  /// @notice Supplies asset tokens to the yield source
  /// @param mintAmount The amount of asset tokens to be supplied
  /// @param to The user whose balance will receive the tokens
  function supplyTo(uint256 mintAmount, address to) external override {
    _depositToAave(mintAmount, to);
  }

  /// Track user balance / share calculation
  /// @notice Redeems asset tokens from the yield source
  /// @param redeemAmount The amount of yield-bearing tokens to be redeemed
  /// @return The actual amount of tokens that were redeemed
  function redeem(uint256 redeemAmount) external override returns (uint256) {
    _lendingPool().withdraw(address(_tokenAddress()), redeemAmount, address(this));
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

  /// @notice Sets the Reserve strategy on this contract
  /// @dev This function is callable by the owner
  /// @param _reserve The new reserve strategy that this yield source should use
  function setReserve(IReserve _reserve) external override onlyOwner {
    reserve = _reserve;
  }

  /// @notice Transfers tokens from the reserve to the given address.  The tokens should be the same tokens as the token() function
  /// @dev This function is callable by the owner or asset manager.
  /// @param to The address to transfer reserve tokens to.
  function transferReserve(address to) external override onlyOwner onlyAssetManager {
    reserve.withdrawReserve(address(this), to);
  }

  /// @notice Allows the owner to transfer ERC20 tokens held by this contract to the target address.
  /// @dev This function is callable by the owner or asset manager.
  /// This function should not be able to transfer any tokens that represent user deposits.
  /// @param erc20Token The ERC20 token to transfer
  /// @param to The recipient of the tokens
  /// @param amount The amount of tokens to transfer
  function transferERC20(address erc20Token, address to, uint256 amount) external override onlyOwner onlyAssetManager {
    require(address(erc20Token) != address(aToken), "ATokenYieldSource/aToken-transfer-not-allowed");
    IERC20Upgradeable(erc20Token).transferFrom(address(this), to, amount);
  }

  /// @notice Allows someone to deposit into the yield source without receiving any shares.  The deposited token will be the same as token()
  /// This allows anyone to distribute tokens among the share holders.
  function sponsor(uint256 amount) external override {
    _depositToAave(amount, address(this));
  }
}
