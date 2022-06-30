// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.6;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import { ATokenMintable } from "./ATokenMintable.sol";

contract AaveLendingPool {
  IERC20 public immutable token;
  ATokenMintable public immutable aToken;

  constructor(
    IERC20 _token,
    ATokenMintable _aToken
  ) {
    token = _token;
    aToken = _aToken;
  }

  /* solhint-disable no-unused-vars */
  function deposit(
    address asset,
    uint256 amount,
    address onBehalfOf,
    uint16 referralCode
  ) external {
    IERC20(asset).transferFrom(msg.sender, address(this), amount);
    aToken.mint(onBehalfOf, amount);
  }

  function withdraw(
    address asset,
    uint256 amount,
    address to
  ) external returns (uint256) {
    aToken.burn(msg.sender, amount);
    IERC20(asset).transfer(to, amount);
    return amount;
  }
}
