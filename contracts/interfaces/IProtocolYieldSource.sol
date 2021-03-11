// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.6.0 <0.7.0;

import "./IYieldSource.sol";
import "./IReserve.sol";

/// @title The interface used for all Yield Sources for the PoolTogether protocol
/// @dev There are two privileged roles: the owner and the asset manager.  The owner can configure the asset managers.
interface ProtocolYieldSource is IYieldSource {
  /// @notice Sets the Reserve strategy on this contract
  /// @dev This function is callable by the owner
  /// @param _reserve The new reserve strategy that this yield source should use
  function setReserve(IReserve _reserve) external;

  /// @notice Returns the reserve strategy
  /// @return The current reserve strategy for this contract
  function reserve() external view returns (IReserve);

  /// @notice Transfers tokens from the reserve to the given address.  The tokens should be the same tokens as the token() function
  /// @dev This function is callable by the owner or asset manager.
  /// @param to The address to transfer reserve tokens to.
  function transferReserve(address to) external;

  /// @notice Allows the owner to transfer ERC20 tokens held by this contract to the target address.
  /// @dev This function is callable by the owner or asset manager.
  /// This function should not be able to transfer any tokens that represent user deposits.
  /// @param token The ERC20 token to transfer
  /// @param to The recipient of the tokens
  /// @param amount The amount of tokens to transfer
  function transferERC20(address token, address to, uint256 amount) external;

  /// @notice Transfer ERC721 tokens held by this contract to the target address
  /// @dev This function is callable by the owner or asset manager.
  /// @param token The ERC721 to transfer
  /// @param to The recipient of the token
  /// @param tokenId The ERC721 token id to transfer
  function transferERC721(address token, address to, uint256 tokenId) external;

  /// @notice Allows someone to deposit into the yield source without receiving any shares.  The deposited token will be the same as token()
  /// This allows anyone to distribute tokens among the share holders.
  function sponsor(uint256 amount) external;
}
