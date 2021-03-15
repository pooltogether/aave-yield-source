// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.6.0 <0.7.0;

import "@aave/protocol-v2/contracts/interfaces/ILendingPoolAddressesProviderRegistry.sol";

import "./ATokenYieldSourceHarness.sol";
import "../yield-source/ATokenYieldSourceProxyFactory.sol";
import "../external/aave/ATokenInterface.sol";
import "../external/openzeppelin/ProxyFactory.sol";

/// @title aToken Yield Source Proxy Factory
/// @notice Minimal proxy pattern for creating new aToken Yield Sources
contract ATokenYieldSourceProxyFactoryHarness is ProxyFactory {

  /// @notice Contract template for deploying proxied aToken Yield Sources
  ATokenYieldSourceHarness public instance;

  /// @notice Initializes the Factory with an instance of the aToken Yield Source
  constructor () public {
    instance = new ATokenYieldSourceHarness();
  }

  /// @notice Creates a new aToken Yield Sources as a proxy of the template instance
  /// @param _aToken Aave aToken address
  /// @param _lendingPoolAddressesProviderRegistry Aave lendingPoolAddressesProviderRegistry
  /// @param _reserve Yield Source Reserve
  /// @param _owner Yield Source owner
  /// @return A reference to the new proxied aToken Yield Sources
  function create(
    ATokenInterface _aToken,
    ILendingPoolAddressesProviderRegistry _lendingPoolAddressesProviderRegistry,
    IReserve _reserve,
    address _owner
  ) public returns (ATokenYieldSourceHarness) {
    ATokenYieldSourceHarness aTokenYieldSourceHarness = ATokenYieldSourceHarness(deployMinimal(address(instance), ""));

    aTokenYieldSourceHarness.initialize(_aToken, _lendingPoolAddressesProviderRegistry, _reserve);
    aTokenYieldSourceHarness.transferOwnership(_owner);

    return aTokenYieldSourceHarness;
  }
}
