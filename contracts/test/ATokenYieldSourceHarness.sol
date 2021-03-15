// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.6.0 <0.7.0;

import "../yield-source/ATokenYieldSource.sol";

/* solium-disable security/no-block-members */
contract ATokenYieldSourceHarness is ATokenYieldSource {
  function tokenToShares(uint256 amount, address to) external view returns (uint256) {
    return _tokenToShares(amount, to);
  }
  function sharesToToken(uint256 amount, address to) external view returns (uint256) {
    return _sharesToToken(amount, to);
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
