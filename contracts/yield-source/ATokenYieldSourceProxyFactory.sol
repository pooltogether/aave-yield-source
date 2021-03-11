// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.6.0 <0.7.0;

import "@aave/protocol-v2/contracts/interfaces/IAToken.sol";
import "@aave/protocol-v2/contracts/interfaces/ILendingPoolAddressesProviderRegistry.sol";

import "./ATokenYieldSource.sol";
import "../external/openzeppelin/ProxyFactory.sol";

/// @title aToken Yield Source Proxy Factory
/// @notice Minimal proxy pattern for creating new aToken Yield Sources
contract ATokenYieldSourceProxyFactory is ProxyFactory {

  /// @notice Contract template for deploying proxied aToken Yield Sources
  ATokenYieldSource public instance;

  /// @notice Initializes the Factory with an instance of the aToken Yield Source
  constructor () public {
    instance = new ATokenYieldSource();
  }

  /// @notice Creates a new aToken Yield Sources as a proxy of the template instance
  /// @param _aToken Aave aToken address
  /// @param _lendingPoolAddressesProviderRegistry Aave lendingPoolAddressesProviderRegistry
  /// @param _reserveRate Yield source reserveRate
  /// @param _owner Yield source owner
  /// @return A reference to the new proxied aToken Yield Sources
  function create(
    IAToken _aToken,
    ILendingPoolAddressesProviderRegistry _lendingPoolAddressesProviderRegistry,
    uint256 _reserveRate,
    address _owner
  ) public returns (ATokenYieldSource) {
    ATokenYieldSource aTokenYieldSource = ATokenYieldSource(deployMinimal(address(instance), ""));

    aTokenYieldSource.initialize(_aToken, _lendingPoolAddressesProviderRegistry, _reserveRate, _owner);
    aTokenYieldSource.transferOwnership(_owner);

    return aTokenYieldSource;
  }
}
