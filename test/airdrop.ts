import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";
import merkleTree from "merkletreejs";
const keccak256 = require("keccak256");

describe("Airdrop", function () {
  async function deployToken() {
    const [owner] = await hre.ethers.getSigners();

    const Lock = await hre.ethers.getContractFactory("Token");
    const Token = await Lock.deploy();

    return { Token, owner };
  }

  async function deployMerkleAirdrop() {
    const merkleRoot =
      "0xa8e8d9312ad45157efa957beb3b1b874d91b8eeca58cb768fe62deec62cf2f62";

    const { Token, owner } = await loadFixture(deployToken);

    const Lock = await hre.ethers.getContractFactory("MerkleAirdrop");
    const MerkleAirdrop = await Lock.deploy(Token, merkleRoot);

    await Token.transfer(
      MerkleAirdrop.getAddress(),
      hre.ethers.parseUnits("10000", 18)
    );

    return { MerkleAirdrop, Token, owner };
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
      const merkleRoot =
        "0xa8e8d9312ad45157efa957beb3b1b874d91b8eeca58cb768fe62deec62cf2f62";
      const { MerkleAirdrop, owner } = await loadFixture(deployMerkleAirdrop);

      expect(await MerkleAirdrop.merkleRoot()).to.equal(merkleRoot);
    });
  });
});
