import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import fs from "fs";

export function generateProof(address: string): { value: string[]; proof: string[] } {
  // Load the Merkle tree from a JSON file
  const tree = StandardMerkleTree.load(
    JSON.parse(fs.readFileSync("merkletree.json", "utf8"))
  );

  for (const [i, v] of tree.entries()) {
    if (v[0].toLowerCase() === address.toLowerCase()) {
      // Generate the proof for the given index
      const proof = tree.getProof(i);
      return {
        value: v,
        proof: proof,
      };
    }
  }

  
  throw new Error(`Address ${address} not found in the Merkle tree`);
}