// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.6.0 <0.7.0;

import "@aave/protocol-v2/contracts/interfaces/ILendingPool.sol";
import "@aave/protocol-v2/contracts/interfaces/ILendingPoolAddressesProvider.sol";
import "@aave/protocol-v2/contracts/interfaces/ILendingPoolAddressesProviderRegistry.sol";
import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/SafeERC20Upgradeable.sol";
import "@pooltogether/fixed-point/contracts/FixedPoint.sol";

import "../access/AssetManager.sol";
import "../external/aave/ATokenInterface.sol";
import "../interfaces/IProtocolYieldSource.sol";

/// @title Defines the functions used to interact with a yield source. The Prize Pool inherits this contract.
/// @notice Prize Pools subclasses need to implement this interface so that yield can be generated.
contract ATokenYieldSource is ERC20Upgradeable, IProtocolYieldSource, AssetManager {
  using SafeMathUpgradeable for uint256;
  using SafeERC20Upgradeable for IERC20Upgradeable;

  event ATokenYieldSourceInitialized(
    address indexed aToken,
    address lendingPoolAddressesProviderRegistry
  );

  event RedeemedToken(
    address indexed from,
    uint256 shares,
    uint256 amount
  );

  event SuppliedTokenTo(
    address indexed from,
    uint256 shares,
    uint256 amount,
    address indexed to
  );

  event Sponsored(
    address indexed from,
    uint256 amount
  );

  event TransferredERC20(
    address indexed from,
    address indexed token,
    uint256 amount,
    address indexed to
  );

  /// @notice Interface for the Yield-bearing aToken by Aave
  ATokenInterface public aToken;

  /// @notice Interface for Aave lendingPoolAddressesProviderRegistry
  ILendingPoolAddressesProviderRegistry public lendingPoolAddressesProviderRegistry;

  /// @notice Initializes the Yield Source with Aave aToken
  /// @param _aToken Aave aToken address
  /// @param _lendingPoolAddressesProviderRegistry Aave lendingPoolAddressesProviderRegistry
  function initialize(
    ATokenInterface _aToken,
    ILendingPoolAddressesProviderRegistry _lendingPoolAddressesProviderRegistry
  )
    public
    initializer
  {
    aToken = _aToken;
    lendingPoolAddressesProviderRegistry = _lendingPoolAddressesProviderRegistry;

    __Ownable_init();

    emit ATokenYieldSourceInitialized (
      address(aToken),
      address(lendingPoolAddressesProviderRegistry)
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
  function balanceOfToken(address addr) external override returns (uint256) {
    return _sharesToToken(balanceOf(addr));
  }

  /// @param tokens Amount of tokens
  /// @return Number of shares
  function _tokenToShares(uint256 tokens) internal view returns (uint256) {
    uint256 shares = 0;

    if (totalSupply() == 0) {
      shares = tokens;
    } else {
      // rate = tokens / shares
      // shares = tokens * (totalShares / yielSourceTotalSupply)
      uint256 exchangeMantissa = FixedPoint.calculateMantissa(totalSupply(), aToken.balanceOf(address(this)));
      shares = FixedPoint.multiplyUintByMantissa(tokens, exchangeMantissa);
    }

    require(shares != uint256(0), "ATokenYieldSource/shares-equal-zero");

    return shares;
  }

  /// @param shares Amount of shares
  /// @return Number of tokens
  function _sharesToToken(uint256 shares) internal view returns (uint256) {
    uint256 tokens = 0;

    if (totalSupply() == 0) {
      tokens = shares;
    } else {
      // tokens = shares * (yielSourceTotalSupply / totalShares)
      uint256 exchangeMantissa = FixedPoint.calculateMantissa(aToken.balanceOf(address(this)), totalSupply());
      tokens = FixedPoint.multiplyUintByMantissa(shares, exchangeMantissa);
    }

    return tokens;
  }

  /// @notice Supplies asset tokens to Aave
  /// @param mintAmount The amount of asset tokens to be supplied
  function _depositToAave(uint256 mintAmount) internal {
    IERC20Upgradeable _depositToken = IERC20Upgradeable(depositToken());

    _depositToken.safeTransferFrom(msg.sender, address(this), mintAmount);
    _depositToken.safeApprove(address(_lendingPool()), mintAmount);
    _lendingPool().deposit(address(_tokenAddress()), mintAmount, address(this), uint16(188));
  }

  /// @notice Supplies asset tokens to the yield source
  /// @param mintAmount The amount of asset tokens to be supplied
  /// @param to The user whose balance will receive the tokens
  function supplyTokenTo(uint256 mintAmount, address to) external override {
    uint256 shares = _tokenToShares(mintAmount);

    _mint(to, shares);
    _depositToAave(mintAmount);
    emit SuppliedTokenTo(msg.sender, shares, mintAmount, to);
  }

  /// @notice Redeems asset tokens from the yield source
  /// @param redeemAmount The amount of yield-bearing tokens to be redeemed
  /// @return The actual amount of tokens that were redeemed
  function redeemToken(uint256 redeemAmount) external override returns (uint256) {
    uint256 shares = _tokenToShares(redeemAmount);
    _burn(msg.sender, shares);

    uint256 beforeBalance = aToken.balanceOf(address(this));
    _lendingPool().withdraw(address(_tokenAddress()), redeemAmount, address(this));
    uint256 afterBalance = aToken.balanceOf(address(this));

    uint256 balanceDiff = beforeBalance.sub(afterBalance);
    IERC20Upgradeable(depositToken()).safeTransfer(msg.sender, balanceDiff);

    emit RedeemedToken(msg.sender, shares, redeemAmount);
    return balanceDiff;
  }

  /// @notice Allows the owner to transfer ERC20 tokens other than the aAtokens held by this contract to the target address.
  /// @dev This function is callable by the owner or asset manager.
  /// @param erc20Token The ERC20 token to transfer
  /// @param to The recipient of the tokens
  /// @param amount The amount of tokens to transfer
  function transferERC20(address erc20Token, address to, uint256 amount) external override onlyOwnerOrAssetManager {
    require(address(erc20Token) != address(aToken), "ATokenYieldSource/aToken-transfer-not-allowed");
    IERC20Upgradeable(erc20Token).safeTransfer(to, amount);
    emit TransferredERC20(msg.sender, erc20Token, amount, to);
  }

  /// @notice Allows someone to deposit into the yield source without receiving any shares.  The deposited token will be the same as depositToken()
  /// This allows anyone to distribute tokens among the share holders.
  function sponsor(uint256 amount) external override {
    _depositToAave(amount);
    emit Sponsored(msg.sender, amount);
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
}
