// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.6;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@pooltogether/fixed-point/contracts/FixedPoint.sol";
import "@pooltogether/owner-manager-contracts/contracts/Manageable.sol";

import "../external/aave/ILendingPool.sol";
import "../external/aave/ILendingPoolAddressesProvider.sol";
import "../external/aave/ILendingPoolAddressesProviderRegistry.sol";
import "../external/aave/ATokenInterface.sol";
import "../external/aave/IAaveIncentivesController.sol";
import "../external/aave/IProtocolYieldSource.sol";

/// @title Aave Yield Source integration contract, implementing PoolTogether's generic yield source interface
/// @dev This contract inherits from the ERC20 implementation to keep track of users deposits
/// @dev This contract inherits AssetManager which extends OwnableUpgradable
/// @notice Yield source for a PoolTogether prize pool that generates yield by depositing into Aave V2
contract ATokenYieldSource is ERC20, IProtocolYieldSource, Manageable, ReentrancyGuard {
  using SafeMath for uint256;
  using SafeERC20 for IERC20;

  /// @notice Emitted when the yield source is initialized
  event ATokenYieldSourceInitialized(
    IAToken indexed aToken,
    ILendingPoolAddressesProviderRegistry lendingPoolAddressesProviderRegistry,
    uint8 decimals,
    string name,
    string symbol,
    address owner
  );

  /// @notice Emitted when asset tokens are redeemed from the yield source
  event RedeemedToken(
    address indexed from,
    uint256 shares,
    uint256 amount
  );

  /// @notice Emitted when Aave rewards have been claimed
  event Claimed(
    address indexed user,
    address indexed to,
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
    IERC20 indexed token
  );

  /// @notice Interface for the yield-bearing Aave aToken
  ATokenInterface public aToken;

  /// @notice Interface for Aave incentivesController
  IAaveIncentivesController public incentivesController;

  /// @notice Interface for Aave lendingPoolAddressesProviderRegistry
  ILendingPoolAddressesProviderRegistry public lendingPoolAddressesProviderRegistry;

  uint8 internal __decimals;

  /// @dev Aave genesis market LendingPoolAddressesProvider's ID
  /// @dev This variable could evolve in the future if we decide to support other markets
  uint256 private constant ADDRESSES_PROVIDER_ID = uint256(0);

  /// @dev PoolTogether's Aave Referral Code
  uint16 private constant REFERRAL_CODE = uint16(188);

  /// @notice Initializes the yield source with Aave aToken
  /// @param _aToken Aave aToken address
  /// @param _incentivesController Aave incentivesController address
  /// @param _lendingPoolAddressesProviderRegistry Aave lendingPoolAddressesProviderRegistry address
  /// @param _decimals Number of decimals the shares (inhereted ERC20) will have. Set as same as underlying asset to ensure sane ExchangeRates
  /// @param _symbol Token symbol for the underlying shares ERC20
  /// @param _name Token name for the underlying shares ERC20
  constructor (
    ATokenInterface _aToken,
    IAaveIncentivesController _incentivesController,
    ILendingPoolAddressesProviderRegistry _lendingPoolAddressesProviderRegistry,
    uint8 _decimals,
    string memory _symbol,
    string memory _name,
    address _owner
  ) Ownable(_owner) ERC20(_name, _symbol) ReentrancyGuard()
  {
    require(address(_aToken) != address(0), "ATokenYieldSource/aToken-not-zero-address");
    aToken = _aToken;

    require(address(_incentivesController) != address(0), "ATokenYieldSource/incentivesController-not-zero-address");
    incentivesController = _incentivesController;

    require(address(_lendingPoolAddressesProviderRegistry) != address(0), "ATokenYieldSource/lendingPoolRegistry-not-zero-address");
    lendingPoolAddressesProviderRegistry = _lendingPoolAddressesProviderRegistry;

    require(_owner != address(0), "ATokenYieldSource/owner-not-zero-address");

    require(_decimals > 0, "ATokenYieldSource/decimals-gt-zero");
    __decimals = _decimals;

    // approve once for max amount
    IERC20(_tokenAddress()).safeApprove(address(_lendingPool()), type(uint256).max);

    emit ATokenYieldSourceInitialized (
      _aToken,
      _lendingPoolAddressesProviderRegistry,
      _decimals,
      _name,
      _symbol,
      _owner
    );
  }

  /// @notice Returns the number of decimals that the token repesenting yield source shares has
  /// @return The number of decimals
  function decimals() public override view returns (uint8) {
    return __decimals;
  }

  /// @notice Approve lending pool contract to spend max uint256 amount
  /// @dev Emergency function to re-approve max amount if approval amount dropped too low
  /// @return true if operation is successful
  function approveMaxAmount() external onlyOwner returns (bool) {
    address _lendingPoolAddress = address(_lendingPool());
    IERC20 _underlyingAsset = IERC20(_tokenAddress());
    uint256 _allowance = _underlyingAsset.allowance(address(this), _lendingPoolAddress);

    _underlyingAsset.safeIncreaseAllowance(_lendingPoolAddress, type(uint256).max.sub(_allowance));
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
  /// @param _tokens Amount of tokens
  /// @return Number of shares
  function _tokenToShares(uint256 _tokens) internal view returns (uint256) {
    uint256 _shares;
    uint256 _totalSupply = totalSupply();

    if (_totalSupply == 0) {
      _shares = _tokens;
    } else {
      // rate = tokens / shares
      // shares = tokens * (totalShares / yieldSourceTotalSupply)
      uint256 _exchangeMantissa = FixedPoint.calculateMantissa(_totalSupply, aToken.balanceOf(address(this)));
      _shares = FixedPoint.multiplyUintByMantissa(_tokens, _exchangeMantissa);
    }

    return _shares;
  }

  /// @notice Calculates the number of tokens a user has in the yield source
  /// @param _shares Amount of shares
  /// @return Number of tokens
  function _sharesToToken(uint256 _shares) internal view returns (uint256) {
    uint256 _tokens;
    uint256 _totalSupply = totalSupply();

    if (_totalSupply == 0) {
      _tokens = _shares;
    } else {
      // tokens = (shares * yieldSourceTotalSupply) / totalShares
      _tokens = _shares.mul(aToken.balanceOf(address(this))).div(_totalSupply);
    }

    return _tokens;
  }

  /// @notice Deposit asset tokens to Aave
  /// @param mintAmount The amount of asset tokens to be deposited
  function _depositToAave(uint256 mintAmount) internal {
    address _underlyingAssetAddress = _tokenAddress();
    ILendingPool __lendingPool = _lendingPool();
    IERC20 _depositToken = IERC20(_underlyingAssetAddress);

    _depositToken.safeTransferFrom(msg.sender, address(this), mintAmount);
    __lendingPool.deposit(_underlyingAssetAddress, mintAmount, address(this), REFERRAL_CODE);
  }

  /// @notice Supplies asset tokens to the yield source
  /// @dev Shares corresponding to the number of tokens supplied are mint to the user's balance
  /// @dev Asset tokens are supplied to the yield source, then deposited into Aave
  /// @param mintAmount The amount of asset tokens to be supplied
  /// @param to The user whose balance will receive the tokens
  function supplyTokenTo(uint256 mintAmount, address to) external override nonReentrant {
    uint256 shares = _tokenToShares(mintAmount);

    require(shares > 0, "ATokenYieldSource/shares-gt-zero");
    _depositToAave(mintAmount);
    _mint(to, shares);

    emit SuppliedTokenTo(msg.sender, shares, mintAmount, to);
  }

  /// @notice Redeems asset tokens from the yield source
  /// @dev Shares corresponding to the number of tokens withdrawn are burnt from the user's balance
  /// @dev Asset tokens are withdrawn from Aave, then transferred from the yield source to the user's wallet
  /// @param redeemAmount The amount of asset tokens to be redeemed
  /// @return The actual amount of asset tokens that were redeemed
  function redeemToken(uint256 redeemAmount) external override nonReentrant returns (uint256) {
    address _underlyingAssetAddress = _tokenAddress();
    IERC20 _depositToken = IERC20(_underlyingAssetAddress);

    uint256 shares = _tokenToShares(redeemAmount);
    _burn(msg.sender, shares);

    uint256 beforeBalance = _depositToken.balanceOf(address(this));
    _lendingPool().withdraw(_underlyingAssetAddress, redeemAmount, address(this));
    uint256 afterBalance = _depositToken.balanceOf(address(this));

    uint256 balanceDiff = afterBalance.sub(beforeBalance);
    _depositToken.safeTransfer(msg.sender, balanceDiff);

    emit RedeemedToken(msg.sender, shares, redeemAmount);
    return balanceDiff;
  }

  /// @notice Transfer ERC20 tokens other than the aTokens held by this contract to the recipient address
  /// @dev This function is only callable by the owner or asset manager
  /// @param erc20Token The ERC20 token to transfer
  /// @param to The recipient of the tokens
  /// @param amount The amount of tokens to transfer
  function transferERC20(IERC20 erc20Token, address to, uint256 amount) external override onlyManagerOrOwner {
    require(address(erc20Token) != address(aToken), "ATokenYieldSource/aToken-transfer-not-allowed");
    erc20Token.safeTransfer(to, amount);
    emit TransferredERC20(msg.sender, to, amount, erc20Token);
  }

  /// @notice Allows someone to deposit into the yield source without receiving any shares
  /// @dev This allows anyone to distribute tokens among the share holders
  /// @param amount The amount of tokens to deposit
  function sponsor(uint256 amount) external override nonReentrant {
    _depositToAave(amount);
    emit Sponsored(msg.sender, amount);
  }

  /// @notice Claims the accrued rewards for the aToken, accumulating any pending rewards.
  /// @param to Address where the claimed rewards will be sent.
  /// @return True if operation was successful.
  function claimRewards(address to) external onlyManagerOrOwner returns (bool) {
    require(to != address(0), "ATokenYieldSource/recipient-not-zero-address");

    IAaveIncentivesController _incentivesController = incentivesController;

    address[] memory _assets = new address[](1);
    _assets[0] = address(aToken);

    uint256 _amount = _incentivesController.getRewardsBalance(_assets, address(this));
    uint256 _amountClaimed = _incentivesController.claimRewards(_assets, _amount, to);

    emit Claimed(msg.sender, to, _amountClaimed);
    return true;
  }

  /// @notice Retrieves Aave LendingPoolAddressesProvider address
  /// @return A reference to LendingPoolAddressesProvider interface
  function _lendingPoolProvider() internal view returns (ILendingPoolAddressesProvider) {
    return ILendingPoolAddressesProvider(lendingPoolAddressesProviderRegistry.getAddressesProvidersList()[ADDRESSES_PROVIDER_ID]);
  }

  /// @notice Retrieves Aave LendingPool address
  /// @return A reference to LendingPool interface
  function _lendingPool() internal view returns (ILendingPool) {
    return ILendingPool(_lendingPoolProvider().getLendingPool());
  }
}
