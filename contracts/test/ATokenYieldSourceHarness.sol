// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.6;

import "../yield-source/ATokenYieldSource.sol";
import "../external/aave/ATokenInterface.sol";
import "../external/aave/ILendingPoolAddressesProviderRegistry.sol";

/* solium-disable security/no-block-members */
contract ATokenYieldSourceHarness is ATokenYieldSource {

  constructor (
    ATokenInterface _aToken,
    IAaveIncentivesController _incentivesController,
    ILendingPoolAddressesProviderRegistry _lendingPoolAddressesProviderRegistry,
    uint8 _decimals,
    string memory _symbol,
    string memory _name,
    address _owner
  ) ATokenYieldSource(_aToken, _incentivesController, _lendingPoolAddressesProviderRegistry, _decimals, _symbol, _name, _owner) {

  }

  function mint(address account, uint256 amount) public returns (bool) {
    _mint(account, amount);
    return true;
  }

  function tokenToShares(uint256 tokens) external view returns (uint256) {
    return _tokenToShares(tokens);
  }

  function sharesToToken(uint256 shares) external view returns (uint256) {
    return _sharesToToken(shares);
  }

  function tokenAddress() external view returns (address) {
    return _tokenAddress();
  }

  function lendingPoolProvider() external view returns (ILendingPoolAddressesProvider) {
    return _lendingPoolProvider();
  }

  function lendingPool() external view returns (ILendingPool) {
    return _lendingPool();
  }
}
