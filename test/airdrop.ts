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
import { generateProof } from "../scripts/merkleProof"

describe("Airdrop", function () {
  async function deployToken() {
    const [owner] = await hre.ethers.getSigners();

    const Lock = await hre.ethers.getContractFactory("Token");
    const Token = await Lock.deploy();

    return { Token, owner };
  }



  


  async function deployMerkleAirdrop() {

    const  merkleRoot  = "0x743400bd17b9e2f1765556ad5f489304aa962b5d162e77d8028c555ddb112deb";
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
      const  merkleRoot  = "0x743400bd17b9e2f1765556ad5f489304aa962b5d162e77d8028c555ddb112deb";
      const { MerkleAirdrop, owner } = await loadFixture(deployMerkleAirdrop);

      expect(await MerkleAirdrop.merkleRoot()).to.equal(merkleRoot);
    });

    it("Allow whitelisted address to claim if they hold BoredApeNFT", async function () {
      const { MerkleAirdrop, Token, BoredApeYachtClub } = await deployMerkleAirdrop();
     
       
      const NFT_HOLDER = "0xe7b3d473411dd530D7889805e148b738F2236E6d";
      const impersonatedSigner = await hre.ethers.getSigner(NFT_HOLDER);
     
      

      const { value, proof } = generateProof(NFT_HOLDER);
      const amount = hre.ethers.parseUnits("16", 18);


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