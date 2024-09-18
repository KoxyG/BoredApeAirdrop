// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

import "./IERC20.sol";


contract MerkleAirdrop {
     
    bytes32 public merkleRoot;
    mapping(address => bool) public hasClaimed;
    address public owner;
    address public requiredNFT = ""

    // errors 
    error AlreadyClaimed();
    error NotInMerkle();
    error NotOwner();
    error NotEnoughBalance();
    

    // events
    event Claim(address indexed to, uint256 amount);
    event OwnerWithdraw(address indexed to, uint256 amount);
    event RootUpdated(address indexed owner, bytes32 newRoot);

    
    IERC20 public rewardToken;




    constructor(address _rewardToken, bytes32 _merkleRoot) {
        merkleRoot = _merkleRoot;
        owner = msg.sender;
        rewardToken = IERC20(_rewardToken);
    }



    function claim(uint256 _amount, address _claimer, bytes32[] calldata proof) external returns (bool success) {
        
        if (hasClaimed[_claimer]) revert AlreadyClaimed();

        // generate leaf
        bytes32 leaf = keccak256(abi.encodePacked(_claimer, _amount));
        // Verify merkle proof, or revert if not in tree
        bool isValidLeaf = MerkleProof.verify(proof, merkleRoot, leaf);

        if (!isValidLeaf) revert NotInMerkle();

        hasClaimed[_claimer] = true;
        rewardToken.transfer(_claimer, _amount);

        // Emit claim event
        emit Claim(_claimer, _amount);

        return true;
    }


    function withdraw(uint256 amount) external {
        if (msg.sender != owner) revert NotOwner();

        // Ensure the contract has enough tokens to withdraw
        uint256 contractBalance = rewardToken.balanceOf(address(this));    
        if (contractBalance <= amount) revert NotEnoughBalance();

        // Transfer the tokens to the owner
        rewardToken.transfer(msg.sender, amount);

        // Emit withdraw event
        emit OwnerWithdraw(msg.sender, amount);
    }


    function updateMerkleRoot(bytes32 _merkleRoot) external returns (bool success) {
        if (msg.sender != owner) revert NotOwner();
        
        merkleRoot = _merkleRoot;
        emit RootUpdated(msg.sender, _merkleRoot);
        return true;
    }


    function getContractBalance() external view returns(uint) {
       return rewardToken.balanceOf(address(this));
    }

}