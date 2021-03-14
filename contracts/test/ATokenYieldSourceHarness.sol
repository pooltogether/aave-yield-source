// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.6.0 <0.7.0;

import "../yield-source/ATokenYieldSource.sol";

/* solium-disable security/no-block-members */
contract ATokenYieldSourceHarness is ATokenYieldSource {
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
