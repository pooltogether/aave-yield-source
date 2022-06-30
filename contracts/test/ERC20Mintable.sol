// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.6;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ERC20Mintable is ERC20 {
  uint8 internal __decimals;

  constructor(string memory _name, string memory _symbol, uint8 _decimals) ERC20(_name, _symbol) {
    __decimals = _decimals;
  }

  function decimals() public override view returns (uint8) {
    return __decimals;
  }

  function mint(address account, uint256 amount) public returns (bool) {
    _mint(account, amount);
    return true;
  }

  function burn(address account, uint256 amount) public returns (bool) {
    _burn(account, amount);
    return true;
  }
}
