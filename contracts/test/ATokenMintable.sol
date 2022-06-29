// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.6;

import "./ERC20Mintable.sol";

contract ATokenMintable is ERC20Mintable {
  address public immutable underlyingAssetAddress;

  constructor(
    address _underlyingAssetAddress,
    string memory _name,
    string memory _symbol,
    uint8 decimals_
  ) ERC20Mintable(_name, _symbol, decimals_) {
    underlyingAssetAddress = _underlyingAssetAddress;
  }

  /* solhint-disable func-name-mixedcase */
  function UNDERLYING_ASSET_ADDRESS() external view returns (address) {
    return underlyingAssetAddress;
  }
}
