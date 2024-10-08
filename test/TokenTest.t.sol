// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/Token.sol";

contract TokenTest is Test {
    Token public token;
    address public owner;
    address public user;
    uint256 public constant INITIAL_SUPPLY = 1000000 * 10 ** 18;
    uint256 public constant CAP = 2000000 * 10 ** 18;

    function setUp() public {
        owner = address(this);
        user = address(0x1);
        token = new Token(INITIAL_SUPPLY, CAP, owner);
    }

    function testInitialSupplyAndCap() public view {
        assertEq(token.totalSupply(), INITIAL_SUPPLY);
        assertEq(token.cap(), CAP);
    }

    function testMint() public {
        uint256 amount = 1000 * 10 ** 18;
        token.mint(user, amount);
        assertEq(token.balanceOf(user), amount);
    }

    function testMintExceedingCap() public {
        uint256 amount = CAP - INITIAL_SUPPLY + 1;
        vm.expectRevert("Cap exceeded");
        token.mint(user, amount);
    }

    function testBurn() public {
        uint256 amount = 1000 * 10 ** 18;
        token.mint(owner, amount);
        token.burn(amount);
        assertEq(token.balanceOf(owner), INITIAL_SUPPLY);
    }

    function testPauseAndUnpause() public {
        token.pause();
        vm.expectRevert("Token transfer while paused");
        token.transfer(user, 100);

        token.unpause();
        assertTrue(token.transfer(user, 100));
    }

    function testTransfer() public {
        uint256 amount = 1000 * 10 ** 18;
        assertTrue(token.transfer(user, amount));
        assertEq(token.balanceOf(user), amount);
    }

    function testTransferFrom() public {
        uint256 amount = 1000 * 10 ** 18;
        token.approve(user, amount);
        vm.prank(user);
        assertTrue(token.transferFrom(owner, user, amount));
        assertEq(token.balanceOf(user), amount);
    }

    function testRollupState() public {
        bytes32 state1 = token.rollupState();
        token.mint(user, 1000 * 10 ** 18);
        bytes32 state2 = token.rollupState();
        assertFalse(state1 == state2);
    }

    function testOnlyOwnerFunctions() public {
        vm.prank(user);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", user));
        token.mint(user, 1000 * 10 ** 18);

        vm.prank(user);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", user));
        token.burn(1000 * 10 ** 18);

        vm.prank(user);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", user));
        token.pause();

        vm.prank(user);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", user));
        token.unpause();
    }
}
