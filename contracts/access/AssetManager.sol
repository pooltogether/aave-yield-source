// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.6.0 <0.7.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";

/**
*  @title Abstract ownable contract with additional assetManager role
 * @notice Contract module based on Ownable which provides a basic access control mechanism, where
 * there is an account (an asset manager) that can be granted exclusive access to
 * specific functions.
 *
 * The asset manager account needs to be set using {setAssetManager}.
 *
 * This module is used through inheritance. It will make available the modifier
 * `onlyAssetManager`, which can be applied to your functions to restrict their use to
 * the asset manager.
 */
abstract contract AssetManager is ContextUpgradeable, OwnableUpgradeable {
    address private _assetManager;

    /**
     * @dev Emitted when the _assetManager has been changed
     * @param previousAssetManager address of the former _assetManager
     * @param newAssetManager address of the new _assetManager
     */
    event AssetManagerTransferred(address indexed previousAssetManager, address indexed newAssetManager);

    /**
     * @notice Gets the current _assetManager
     * @dev Returns the address of the current asset manager.
     * @return The address of the current _assetManager
     */
    function assetManager() public view virtual returns (address) {
        return _assetManager;
    }

    /**
     * @dev Throws if called by any account other than the owner or asset manager.
     */
    modifier onlyOwnerOrAssetManager() {
        require(assetManager() == _msgSender() || owner() == _msgSender(), "onlyOwnerOrAssetManager: caller is not owner or asset manager");
        _;
    }

    /**
     * @notice Set the initial asset manager
     * @dev Throws if called by any account other than the owner.
     * @param newAssetManager The address of the desired new _assetManager
     * @return Boolean to indicate if the operation was successful or not
     */
    function setAssetManager(address newAssetManager) public virtual onlyOwner returns (bool) {
        _assetManager = newAssetManager;
        emit AssetManagerTransferred(address(0), newAssetManager);
        return true;
    }
}
