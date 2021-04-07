// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.6.0 <0.7.0;

import "../yield-source/ATokenYieldSource.sol";
import "../external/aave/ATokenInterface.sol";
import "@aave/protocol-v2/contracts/interfaces/ILendingPoolAddressesProviderRegistry.sol";


/* solium-disable security/no-block-members */
contract ATokenYieldSourceHarness is ATokenYieldSource {
  // function initialize(
  //   ATokenInterface _aToken,
  //   ILendingPoolAddressesProviderRegistry _lendingPoolAddressesProviderRegistry,
  //   uint8 _decimals,
  //   string calldata _symbol,
  //   string calldata _name
  // )public returns (bool){
  //   super.initialize(_aToken, _lendingPoolAddressesProviderRegistry, _decimals, _symbol, _name);
  // }
  
  
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
