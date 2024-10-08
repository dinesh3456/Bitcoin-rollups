// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Token is ERC20, Ownable {
    uint256 private immutable _cap;
    bool private _paused;

    constructor(uint256 initialSupply, uint256 capValue, address initialOwner)
        ERC20("Token", "TKN")
        Ownable(initialOwner)
    {
        require(capValue > 0, "Cap is 0");
        require(initialSupply <= capValue, "Initial supply exceeds cap");
        _cap = capValue;
        _mint(msg.sender, initialSupply);
    }

    modifier whenNotPaused() {
        require(!_paused, "Token transfer while paused");
        _;
    }

    function mint(address to, uint256 amount) public onlyOwner {
        require(totalSupply() + amount <= _cap, "Cap exceeded");
        _mint(to, amount);
    }

    function burn(uint256 amount) public onlyOwner {
        _burn(_msgSender(), amount);
    }

    function pause() public onlyOwner {
        _paused = true;
    }

    function unpause() public onlyOwner {
        _paused = false;
    }

    function cap() public view returns (uint256) {
        return _cap;
    }

    function transfer(address to, uint256 amount) public virtual override whenNotPaused returns (bool) {
        return super.transfer(to, amount);
    }

    function transferFrom(address from, address to, uint256 amount)
        public
        virtual
        override
        whenNotPaused
        returns (bool)
    {
        return super.transferFrom(from, to, amount);
    }

    function rollupState() public view returns (bytes32) {
        return keccak256(
            abi.encodePacked(totalSupply(), _cap, balanceOf(msg.sender), owner(), block.number, block.timestamp)
        );
    }
}
