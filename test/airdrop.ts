import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre , {network} from "hardhat";
import merkleTree, { MerkleTree } from "merkletreejs";

const helpers = require("@nomicfoundation/hardhat-network-helpers");
const keccak256 = require("keccak256");

describe("Airdrop", function () {
  async function deployToken() {
    const [owner] = await hre.ethers.getSigners();

    const Lock = await hre.ethers.getContractFactory("Token");
    const Token = await Lock.deploy();

    return { Token, owner };
  }

  // async function impersonateAndFund(account: any) {
  //   await network.provider.request({
  //     method: "hardhat_impersonateAccount",
  //     params: [account],
  //   });
    
  //   const [deployer] = await hre.ethers.getSigners();
  
  
  //   await deployer.sendTransaction({
  //     to: account,
  //     value: hre.ethers.parseEther("1.0")
  //   });
  // }

  async function getTree() {
    

  const claimAddress = [
    { address: "0xe7b3d473411dd530D7889805e148b738F2236E6d", amount: "16" },
    { address: "0xEee899B6521DB73E94F4B9224Cdf3db0010Fa334", amount: "7" },
    { address: "0xF3c8A1BaF3D533D300D02798169991D2aAFab019", amount: "18" },
    { address: "0xe785aAfD96E23510A7995E16b49C22D15f219B85", amount: "57" }
  ];


  
  let leaves = claimAddress.map(({ address, amount }) => {
    return keccak256(
      hre.ethers.solidityPacked(
        ['address', 'uint256'],
        [address, amount]
      )
    );
  });


  let tree = new MerkleTree(leaves, keccak256, {hashLeaves: true, sortPairs: true});
  

  const merkleRoot = tree.getHexRoot();
 
  return {merkleRoot, tree, claimAddress }
  }

  


  async function deployMerkleAirdrop() {

    const { merkleRoot } = await loadFixture(getTree);
    const { Token, owner } = await loadFixture(deployToken);

    const BoredApeYachtClub = "0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d";

    const Lock = await hre.ethers.getContractFactory("MerkleAirdrop");
    const MerkleAirdrop = await Lock.deploy(Token, merkleRoot, BoredApeYachtClub);

    await Token.transfer(
      MerkleAirdrop.getAddress(),
      hre.ethers.parseUnits("10000", 18)
    );

    return { MerkleAirdrop, Token, owner, BoredApeYachtClub, merkleRoot };
  }

  describe("Deployment", function () {
    it("Should check if owner is correct", async function () {
      const { MerkleAirdrop, owner } = await loadFixture(deployMerkleAirdrop);

      expect(await MerkleAirdrop.owner()).to.equal(owner);
    });

    it("Deployment should assign the total supply of tokens to the owner", async function () {
      const [owner] = await hre.ethers.getSigners();

      const { Token } = await loadFixture(deployToken);

      const ownerBalance = await Token.balanceOf(owner.address);
      expect(await Token.totalSupply()).to.equal(ownerBalance);
    });

    it("Deployment should Transfer the total supply from the owner to the contract", async function () {
      const [owner] = await hre.ethers.getSigners();

      const { Token } = await loadFixture(deployToken);
      const { MerkleAirdrop } = await loadFixture(deployMerkleAirdrop);

      const ownerBalance = await Token.balanceOf(owner.address);
      const merkleBalance = await MerkleAirdrop.getContractBalance();

      expect(merkleBalance).to.equal(hre.ethers.parseUnits("10000", 18));
    });

    it("Should check if the merkle root is correct", async function () {
      const { merkleRoot } = await loadFixture(getTree);
      const { MerkleAirdrop, owner } = await loadFixture(deployMerkleAirdrop);

      expect(await MerkleAirdrop.merkleRoot()).to.equal(merkleRoot);
    });

    it("Allow whitelisted address to claim if they hold BoredApeNFT", async function () {
      const { MerkleAirdrop, Token, BoredApeYachtClub } = await deployMerkleAirdrop();
      const { tree, claimAddress } = await getTree();
      
      

      
      const NFT_HOLDER = "0xe7b3d473411dd530D7889805e148b738F2236E6d";
      const impersonatedSigner = await hre.ethers.getSigner(NFT_HOLDER);
     
    

    
      const claimInfo = claimAddress.find(data => data.address.toLowerCase() === NFT_HOLDER.toLowerCase());
      if (!claimInfo) {
        throw new Error("Test address not found in claim data");
      }

      const amount = hre.ethers.parseUnits(claimInfo.amount, 18);
      const leaf = keccak256(
        hre.ethers.solidityPacked(
          ['address', 'uint256'],
          [impersonatedSigner, amount]
        )
      );
    
      const proof = tree.getHexProof(leaf);

      


     
      
      const tx = await MerkleAirdrop.connect(impersonatedSigner).claim(amount, proof);
      console.log("Transaction hash:", tx.hash);
        
    
      const receipt = await tx.wait();
        

      
      

      // Check final balance
      const finalBalance = await Token.balanceOf(impersonatedSigner);
      console.log(`Final Token Balance: ${finalBalance}`);

      expect(finalBalance).to.equal(amount);
    });
    
  
  });
});
