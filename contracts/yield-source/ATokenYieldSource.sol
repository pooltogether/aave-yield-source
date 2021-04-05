// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.6.0 <0.7.0;

import "@aave/protocol-v2/contracts/interfaces/ILendingPool.sol";
import "@aave/protocol-v2/contracts/interfaces/ILendingPoolAddressesProvider.sol";
import "@aave/protocol-v2/contracts/interfaces/ILendingPoolAddressesProviderRegistry.sol";
import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@pooltogether/fixed-point/contracts/FixedPoint.sol";

import "../access/AssetManager.sol";
import "../external/aave/ATokenInterface.sol";
import "../interfaces/IProtocolYieldSource.sol";

/// @title Aave Yield Source integration contract, implementing PoolTogether's generic yeild source interface
/// @dev This contract inherits from the ERC20 implementation to keep track of users deposits
/// @dev This contract inherits AssetManager which extends OwnableUpgradable
/// @notice Yield source for a PoolTogether prize pool that generates yield by depositing into Aave V2
contract ATokenYieldSource is ERC20Upgradeable, IProtocolYieldSource, AssetManager, ReentrancyGuardUpgradeable {
  using SafeMathUpgradeable for uint256;
  using SafeERC20Upgradeable for IERC20Upgradeable;

  /// @notice Emitted when the yield source is initialized
  event ATokenYieldSourceInitialized(
    IAToken indexed aToken,
    ILendingPoolAddressesProviderRegistry lendingPoolAddressesProviderRegistry
  );

  /// @notice Emitted when asset tokens are redeemed from the yield source
  event RedeemedToken(
    address indexed from,
    uint256 shares,
    uint256 amount
  );

  /// @notice Emitted when asset tokens are supplied to the yield source
  event SuppliedTokenTo(
    address indexed from,
    uint256 shares,
    uint256 amount,
    address indexed to
  );

  /// @notice Emitted when asset tokens are supplied to sponsor the yield source
  event Sponsored(
    address indexed from,
    uint256 amount
  );

  /// @notice Emitted when ERC20 tokens other than yield source's aToken are withdrawn from the yield source
  event TransferredERC20(
    address indexed from,
    address indexed to,
    uint256 amount,
    IERC20Upgradeable indexed token
  );

  /// @notice Interface for the yield-bearing Aave aToken
  ATokenInterface public aToken;

  /// @notice Interface for Aave lendingPoolAddressesProviderRegistry
  ILendingPoolAddressesProviderRegistry public lendingPoolAddressesProviderRegistry;

  /// @notice Initializes the yield source with Aave aToken
  /// @param _aToken Aave aToken address
  /// @param _lendingPoolAddressesProviderRegistry Aave lendingPoolAddressesProviderRegistry address
  function initialize(
    ATokenInterface _aToken,
    ILendingPoolAddressesProviderRegistry _lendingPoolAddressesProviderRegistry
  )
    public
    initializer
    returns (bool)
  {
    aToken = _aToken;
    lendingPoolAddressesProviderRegistry = _lendingPoolAddressesProviderRegistry;

    __Ownable_init();

    emit ATokenYieldSourceInitialized (
      aToken,
      lendingPoolAddressesProviderRegistry
    );

    return true;
  }

  /// @notice Returns the ERC20 asset token used for deposits
  /// @return The ERC20 asset token address
  function depositToken() public view override returns (address) {
    return _tokenAddress();
  }

  /// @notice Returns the underlying asset token address
  /// @return Underlying asset token address
  function _tokenAddress() internal view returns (address) {
    return aToken.UNDERLYING_ASSET_ADDRESS();
  }

  /// @notice Returns user total balance (in asset tokens). This includes the deposits and interest.
  /// @param addr User address
  /// @return The underlying balance of asset tokens
  function balanceOfToken(address addr) external override returns (uint256) {
    return _sharesToToken(balanceOf(addr));
  }

  /// @notice Calculates the number of shares that should be mint or burned when a user deposit or withdraw
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

  /// @notice Calculates the number of tokens a user has in the yield source
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

  /// @notice Deposit asset tokens to Aave
  /// @param mintAmount The amount of asset tokens to be deposited
  /// @return 0 if successful 
  function _depositToAave(uint256 mintAmount) internal returns (uint256) {
    IERC20Upgradeable _depositToken = IERC20Upgradeable(_tokenAddress());

    _depositToken.safeTransferFrom(msg.sender, address(this), mintAmount);
    _depositToken.safeApprove(address(_lendingPool()), mintAmount);
    _lendingPool().deposit(address(_tokenAddress()), mintAmount, address(this), _getRefferalCode());
    return 0;
  }

  /// @notice Supplies asset tokens to the yield source
  /// @dev Shares corresponding to the number of tokens supplied are mint to the user's balance
  /// @dev Asset tokens are supplied to the yield source, then deposited into Aave
  /// @param mintAmount The amount of asset tokens to be supplied
  /// @param to The user whose balance will receive the tokens
  function supplyTokenTo(uint256 mintAmount, address to) external override {
    uint256 shares = _tokenToShares(mintAmount);

    _mint(to, shares);
    _depositToAave(mintAmount);
    emit SuppliedTokenTo(msg.sender, shares, mintAmount, to);
  }

  /// @notice Redeems asset tokens from the yield source
  /// @dev Shares corresponding to the number of tokens withdrawn are burnt from the user's balance
  /// @dev Asset tokens are withdrawn from Aave, then transferred from the yield source to the user's wallet
  /// @param redeemAmount The amount of yield-bearing tokens to be redeemed
  /// @return The actual amount of tokens that were redeemed
  function redeemToken(uint256 redeemAmount) external override nonReentrant returns (uint256) {
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

  /// @notice Transfer ERC20 tokens other than the aAtokens held by this contract to the recipient address
  /// @dev This function is only callable by the owner or asset manager
  /// @param erc20Token The ERC20 token to transfer
  /// @param to The recipient of the tokens
  /// @param amount The amount of tokens to transfer
  function transferERC20(IERC20Upgradeable erc20Token, address to, uint256 amount) external override onlyOwnerOrAssetManager {
    require(address(erc20Token) != address(aToken), "ATokenYieldSource/aToken-transfer-not-allowed");
    IERC20Upgradeable(erc20Token).safeTransfer(to, amount);
    emit TransferredERC20(msg.sender, to, amount, erc20Token);
  }

  /// @notice Allows someone to deposit into the yield source without receiving any shares
  /// @dev This allows anyone to distribute tokens among the share holders
  /// @param amount The amount of tokens to deposit
  function sponsor(uint256 amount) external override {
    _depositToAave(amount);
    emit Sponsored(msg.sender, amount);
  }

  /// @notice Used to get Aave LendingPoolAddressesProvider's ID
  /// @dev This function could evolve in the future if we decide to support other markets
  /// @return Returns Aave genesis market LendingPoolAddressesProvider's ID
  function _getAddressesProviderId() internal pure returns (uint256) {
    return uint256(0);
  }

  /// @notice Used to get PoolTogthers Aave Referral Code used calling deposit on Aave
  /// @return Returns PoolTogether's Referral Code
  function _getRefferalCode() internal pure returns (uint16) {
    return uint16(188);
  }

  /// @notice Retrieves Aave LendingPoolAddressesProvider address
  /// @return A reference to LendingPoolAddressesProvider interface
  function _lendingPoolProvider() internal view returns (ILendingPoolAddressesProvider) {
    uint256 addressesProviderId = _getAddressesProviderId();
    return ILendingPoolAddressesProvider(lendingPoolAddressesProviderRegistry.getAddressesProvidersList()[addressesProviderId]);
  }

  /// @notice Retrieves Aave LendingPool address
  /// @return A reference to LendingPool interface
  function _lendingPool() internal view returns (ILendingPool) {
    return ILendingPool(_lendingPoolProvider().getLendingPool());
  }
}
