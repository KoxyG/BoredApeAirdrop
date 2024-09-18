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

    const  merkleRoot  = "0x17e049bd6b26c006067e2e7c59cf3120d64a097327e638a25c3184a483c1f3bd";
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
      const  merkleRoot  = "0x17e049bd6b26c006067e2e7c59cf3120d64a097327e638a25c3184a483c1f3bd";
      const { MerkleAirdrop, owner } = await loadFixture(deployMerkleAirdrop);

      expect(await MerkleAirdrop.merkleRoot()).to.equal(merkleRoot);
    });

    it("Allow whitelisted address to claim if they hold BoredApeNFT", async function () {
      const { MerkleAirdrop, Token, BoredApeYachtClub } = await deployMerkleAirdrop();
     
       
      const NFT_HOLDER = "0xbB05F71952B30786d0aC7c7A8fA045724B8d2D69";
      await helpers.setBalance(NFT_HOLDER, hre.ethers.parseEther("0.5"));
      await helpers.impersonateAccount(NFT_HOLDER);
      const impersonatedSigner = await hre.ethers.getSigner(NFT_HOLDER);
     
      

      const { proof } = generateProof(NFT_HOLDER);
      const amount = hre.ethers.parseUnits("16", 18);


      const tx = await MerkleAirdrop.connect(impersonatedSigner).claim(amount, proof);
      console.log("Transaction hash:", tx.hash);
      
    
      await tx.wait();
        
      // Check final balance
      const finalBalance = await Token.balanceOf(impersonatedSigner);
      console.log(`Final Token Balance: ${finalBalance}`);

      expect(finalBalance).to.equal(amount);
    });
    
  
  });
});