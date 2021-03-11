// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.6.0 <0.7.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";

/**
 * @dev Contract module based on Ownable which provides a basic access control mechanism, where
 * there is an account (an asset manager) that can be granted exclusive access to
 * specific functions.
 *
 * The asset manager account needs to be set using {setAssetManager}. This
 * can later be changed with {transferAssetManagerRole}.
 *
 * This module is used through inheritance. It will make available the modifier
 * `onlyAssetManager`, which can be applied to your functions to restrict their use to
 * the asset manager.
 */
abstract contract AssetManager is ContextUpgradeable, OwnableUpgradeable {
    address private _assetManager;

    event AssetManagerRoleTransferred(address indexed previousAssetManager, address indexed newAssetManager);

    /**
     * @dev Returns the address of the current asset manager.
     */
    function assetManager() public view virtual returns (address) {
        return _assetManager;
    }

    /**
     * @dev Throws if called by any account other than the asset manager.
     */
    modifier onlyAssetManager() {
        require(assetManager() == _msgSender(), "AssetManagerRole: caller is not the asset manager");
        _;
    }

    /**
     * @dev Throws if called by any account other than the owner.
     * @notice Set the initial asset manager
     */
    function setAssetManagerRole(address newAssetManager) public virtual onlyOwner {
        emit AssetManagerRoleTransferred(address(0), newAssetManager);
        _assetManager = newAssetManager;
    }

    /**
     * @dev Leaves the contract without asset manager. It will not be possible to call
     * `onlyAssetManager` functions anymore. Can only be called by the current asset manager.
     *
     * NOTE: Renouncing asset manager role will leave the contract without an asset manager,
     * thereby removing any functionality that is only available to the asset manager.
     */
    function renounceAssetManagerRole() public virtual onlyAssetManager {
        emit AssetManagerRoleTransferred(_assetManager, address(0));
        _assetManager = address(0);
    }

    /**
     * @dev Transfers asset manager of the contract to a new account (`newAssetManager`).
     * Can be called by the current asset manager and owner.
     */
    function transferAssetManagerRole(address newAssetManager) public virtual onlyAssetManager {
        require(newAssetManager != address(0), "AssetManagerRole: new asset manager is the zero address");
        emit AssetManagerRoleTransferred(_assetManager, newAssetManager);
        _assetManager = newAssetManager;
    }
}
