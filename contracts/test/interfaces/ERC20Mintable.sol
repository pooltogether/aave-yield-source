pragma solidity ^0.6.12;

/**
 * @dev Extension of {ERC20} that adds a set of accounts with the {MinterRole},
 * which have permission to mint (create) new tokens as they see fit.
 *
 * At construction, the deployer of the contract is the only minter.
 */
interface ERC20Mintable {
    function mint(address account, uint256 amount) external returns (bool);
}
