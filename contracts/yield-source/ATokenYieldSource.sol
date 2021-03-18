// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.6.0 <0.7.0;

import "@aave/protocol-v2/contracts/interfaces/ILendingPool.sol";
import "@aave/protocol-v2/contracts/interfaces/ILendingPoolAddressesProvider.sol";
import "@aave/protocol-v2/contracts/interfaces/ILendingPoolAddressesProviderRegistry.sol";
import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

import "../access/AssetManager.sol";
import "../external/aave/ATokenInterface.sol";
import "../external/pooltogether/fixed-point/contracts/FixedPoint.sol";
import "../interfaces/IProtocolYieldSource.sol";
import "../interfaces/IReserve.sol";

/// @title Defines the functions used to interact with a yield source. The Prize Pool inherits this contract.
/// @notice Prize Pools subclasses need to implement this interface so that yield can be generated.
contract ATokenYieldSource is ERC20Upgradeable, IProtocolYieldSource, AssetManager {
  using SafeMathUpgradeable for uint256;

  event ATokenYieldSourceInitialized(
    address indexed aToken,
    address lendingPoolAddressesProviderRegistry,
    address indexed reserve
  );

  event Sponsored(
    address indexed user,
    uint256 amount
  );

  event ReserveChanged(
    address indexed reserve
  );

  event ReserveTransferred(
    address indexed to,
    uint256 amount
  );

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
    IReserve _reserve
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
      address(reserve)
    );
  }

  /// @notice Returns the ERC20 asset token used for deposits
  /// @return The ERC20 asset token
  function depositToken() public view override returns (address) {
    return _tokenAddress();
  }

  /// @dev Gets the underlying asset token address
  /// @return Underlying asset token address
  function _tokenAddress() internal view returns (address) {
    return aToken.UNDERLYING_ASSET_ADDRESS();
  }

  /// @notice Returns the total balance (in asset tokens).  This includes the deposits and interest.
  /// @param addr User address
  /// @return The underlying balance of asset tokens
  function balanceOfToken(address addr) public view returns (uint256) {
    return _sharesToToken(balanceOf(addr));
  }

  /// @notice Supplies asset tokens to Aave
  /// @param mintAmount The amount of asset tokens to be supplied
  /// @param to The user whose balance will receive the tokens
  function _depositToAave(uint256 mintAmount, address to) internal {
    IERC20Upgradeable(depositToken()).approve(address(_lendingPool()), mintAmount);
    _lendingPool().deposit(address(_tokenAddress()), mintAmount, to, uint16(188));
  }

  /// @param tokens Amount of tokens
  /// @return Number of shares
  function _tokenToShares(uint256 tokens) internal view returns (uint256) {
    // rate = tokens / shares
    // shares = tokens * (totalShares / yielSourceTotalSupply)
    return tokens.mul(totalSupply()).div(aToken.balanceOf(address(this)));
  }

  /// @param shares Amount of shares
  /// @return Number of tokens
  function _sharesToToken(uint256 shares) internal view returns (uint256) {
    // tokens = yielSourceTotalSupply * (shares / totalShares)
    return aToken.balanceOf(address(this)).mul(shares).div(totalSupply());
  }

  /// todo: create a token share and figure out the current price per share, exclude amount that is accrued in the reserve reserveAmount
  /// @notice Supplies asset tokens to the yield source
  /// @param mintAmount The amount of asset tokens to be supplied
  /// @param to The user whose balance will receive the tokens
  function supplyTokenTo(uint256 mintAmount, address to) external override {
    _depositToAave(mintAmount, address(this));
    uint256 shares = 0;
    if (totalSupply() == 0) {
      shares = mintAmount;
    } else {
      shares = _tokenToShares(mintAmount);
    }
    _mint(to, shares);
  }

  /// @notice Redeems asset tokens from the yield source
  /// @param redeemAmount The amount of yield-bearing tokens to be redeemed
  /// @return The actual amount of tokens that were redeemed
  function redeemToken(uint256 redeemAmount) external override returns (uint256) {
    require(balanceOf(msg.sender) != 0, "ATokenYieldSource/shares-not-zero");

    uint256 beforeBalance = aToken.balanceOf(address(this));
    _lendingPool().withdraw(address(_tokenAddress()), redeemAmount, address(this));
    uint256 afterBalance = aToken.balanceOf(address(this));
    uint256 balanceDiff = afterBalance.sub(beforeBalance);

    uint256 shares = _tokenToShares(redeemAmount);
    _burn(msg.sender, shares);

    return balanceDiff;
  }

  /// @return Returns ID of the Aave genesis market LendingPoolAddressesProvider
  function _getAddressesProviderId() internal pure returns (uint256) {
    return uint256(0);
  }

  /// @dev Retrieve Aave LendingPoolAddressesProvider address
  /// @return A reference to LendingPoolAddressesProvider interface
  function _lendingPoolProvider() internal view returns (ILendingPoolAddressesProvider) {
    uint256 addressesProviderId = _getAddressesProviderId();
    return ILendingPoolAddressesProvider(lendingPoolAddressesProviderRegistry.getAddressesProvidersList()[addressesProviderId]);
  }

  /// @dev Retrieve Aave LendingPool address
  /// @return A reference to LendingPool interface
  function _lendingPool() internal view returns (ILendingPool) {
    return ILendingPool(_lendingPoolProvider().getLendingPool());
  }

  /// @notice Sets the Reserve strategy on this contract
  /// @dev This function is callable by the owner
  /// @param _reserve The new reserve strategy that this yield source should use
  function setReserve(IReserve _reserve) external override onlyOwner {
    reserve = _reserve;
    emit ReserveChanged(address(reserve));
  }

  /// @notice Transfers tokens from the reserve to the given address.  The tokens should be the same tokens as the depositToken() function
  /// @dev This function is callable by the owner or asset manager.
  /// @param to The address to transfer reserve tokens to.
  function transferReserve(address to) external override onlyOwnerOrAssetManager {
    uint256 reserveRateMantissa = reserve.reserveRateMantissa(address(this));
    require(reserveRateMantissa != 0, "ATokenYieldSource/reserveRateMantissa-not-zero");
    uint256 amount = FixedPoint.multiplyUintByMantissa(totalSupply(), reserveRateMantissa);
    IERC20Upgradeable(depositToken()).transferFrom(address(this), to, amount);
    emit ReserveTransferred(to, amount);
  }

  /// @notice Allows the owner to transfer ERC20 tokens other than the aAtokens held by this contract to the target address.
  /// @dev This function is callable by the owner or asset manager.
  /// @param erc20Token The ERC20 token to transfer
  /// @param to The recipient of the tokens
  /// @param amount The amount of tokens to transfer
  function transferERC20(address erc20Token, address to, uint256 amount) external override onlyOwnerOrAssetManager {
    require(address(erc20Token) != address(aToken), "ATokenYieldSource/aToken-transfer-not-allowed");
    IERC20Upgradeable(erc20Token).transferFrom(address(this), to, amount);
  }

  /// @notice Allows someone to deposit into the yield source without receiving any shares.  The deposited token will be the same as depositToken()
  /// This allows anyone to distribute tokens among the share holders.
  function sponsor(uint256 amount) external override {
    _depositToAave(amount, address(this));
    emit Sponsored(msg.sender, amount);
  }
}
