// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.6.0 <0.7.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";

/**
 * @dev Contract module based on Ownable which provides a basic access control mechanism, where
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

    event AssetManagerTransferred(address indexed previousAssetManager, address indexed newAssetManager);

    /**
     * @dev Returns the address of the current asset manager.
     */
    function assetManager() public view virtual returns (address) {
        return _assetManager;
    }

    /**
     * @dev Throws if called by any account other than the asset manager.
     */
    modifier OwnerOrAssetManager() {
        require(assetManager() == _msgSender() || owner() == _msgSender(), "OwnerOrAssetManager: caller is not owner or asset manager");
        _;
    }

    /**
     * @dev Throws if called by any account other than the owner.
     * @notice Set the initial asset manager
     */
    function setAssetManager(address newAssetManager) public virtual onlyOwner {
        emit AssetManagerTransferred(address(0), newAssetManager);
        _assetManager = newAssetManager;
    }
}
