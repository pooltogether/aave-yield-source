// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.6.0 <0.7.0;

import "../yield-source/ATokenYieldSource.sol";

/* solium-disable security/no-block-members */
contract ATokenYieldSourceHarness is ATokenYieldSource {
  function depositToAave(uint256 mintAmount, address to) external {
    return _depositToAave(mintAmount, to);
  }

  function tokenAddress() external view returns (address) {
    return _tokenAddress();
  }

  function provider() external view returns (ILendingPoolAddressesProvider) {
    return _provider();
  }

  function lendingPool() external view returns (ILendingPool) {
    return _lendingPool();
  }
}
