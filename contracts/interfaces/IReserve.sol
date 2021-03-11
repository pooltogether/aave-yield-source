// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.6.0 <0.7.0;

interface IReserve {
  function reserveRateMantissa(address yieldSource) external view returns (uint256);
}
