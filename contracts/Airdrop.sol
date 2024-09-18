// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "./Interface/IERC20.sol";
import "./Interface/IERC721.sol";
import "hardhat/console.sol";

contract MerkleAirdrop {
    bytes32 public merkleRoot;
    mapping(address => bool) public hasClaimed;
    address public owner;
    IERC20 public rewardToken;
    IERC721 public requiredNFT;
   

    // errors
    error AlreadyClaimed();
    error NotInMerkle();
    error NotOwner();
    error NotEnoughBalance();
    error DontOwnRequiredNFT();
    error TransferFailed();

    // 0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D

    // events
    event Claim(address indexed to, uint256 amount);
    event OwnerWithdraw(address indexed to, uint256 amount);
    event RootUpdated(address indexed owner, bytes32 newRoot);
    event RequiredNFTUpdated(address indexed newNFTAddress);

    

    constructor(address _rewardToken, bytes32 _merkleRoot, address _nftAddress) {
        merkleRoot = _merkleRoot;
        owner = msg.sender;
        rewardToken = IERC20(_rewardToken);
        requiredNFT = IERC721(_nftAddress);
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    // function claim(uint256 _amount, bytes32[] calldata proof) external returns (bool success) {
    //     if (hasClaimed[msg.sender]) revert AlreadyClaimed();
    //     if (IERC721(requiredNFT).balanceOf(msg.sender) == 0) revert DontOwnRequiredNFT();

    //     // Generate leaf (using both address and amount)
    //     bytes32 leaf = keccak256(abi.encodePacked(msg.sender, _amount));

    //     // Verify merkle proof
    //     bool isValidLeaf = MerkleProof.verify(proof, merkleRoot, leaf);
    //     if (!isValidLeaf) revert NotInMerkle();

    //     // Update state and transfer tokens
    //     hasClaimed[msg.sender] = true;
    //     bool transferSuccess = rewardToken.transfer(msg.sender, _amount);
    //     if (!transferSuccess) revert TransferFailed();

    //     // Emit claim event
    //     emit Claim(msg.sender, _amount);
    //     return true;
    // }

    function claim(uint256 _amount, bytes32[] calldata proof) external {
        if (hasClaimed[msg.sender]) revert AlreadyClaimed();
        
        if (requiredNFT.balanceOf(msg.sender) == 0) revert DontOwnRequiredNFT();
        
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender, _amount));
        
        bool isValidLeaf = MerkleProof.verify(proof, merkleRoot, leaf);
        if (!isValidLeaf) revert NotInMerkle();
        
        hasClaimed[msg.sender] = true;
        bool transferSuccess = rewardToken.transfer(msg.sender, _amount);
        if (!transferSuccess) revert TransferFailed();
        
        emit Claim(msg.sender, _amount);
       
    }

    function withdraw(uint256 amount) external onlyOwner returns (bool) {
        // Ensure the contract has enough tokens to withdraw
        uint256 contractBalance = rewardToken.balanceOf(address(this));
        if (contractBalance < amount) revert NotEnoughBalance();

        // Transfer the tokens to the owner
        bool transferSuccess = rewardToken.transfer(msg.sender, amount);
        if (!transferSuccess) revert TransferFailed();

        // Emit withdraw event
        emit OwnerWithdraw(msg.sender, amount);
        return true;
    }

    function updateMerkleRoot(bytes32 _merkleRoot) external onlyOwner returns (bool success) {
        merkleRoot = _merkleRoot;
        emit RootUpdated(msg.sender, _merkleRoot);
        return true;
    }

    function getContractBalance() external view returns(uint) {
        return rewardToken.balanceOf(address(this));
    }

    // function setRequiredNFT(address _nnewNFTAddress) external onlyOwner {
    //     requiredNFT = _nnewNFTAddress;
    //     emit RequiredNFTUpdated(_nnewNFTAddress);
    // }
}