import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import fs from "fs";

const values: [string, string][] = [
  ["0xbB05F71952B30786d0aC7c7A8fA045724B8d2D69", "16000000000000000000"],
  ["0xEee899B6521DB73E94F4B9224Cdf3db0010Fa334", "7000000000000000000"],
  ["0xF3c8A1BaF3D533D300D02798169991D2aAFab019", "30000000000000000000"],
  ["0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65", "180000000000000000000"],
  ["0xe785aAfD96E23510A7995E16b49C22D15f219B85", "57000000000000000000"],
];

const tree = StandardMerkleTree.of(values, ["address", "uint256"]);

console.log("Merkle Root:", tree.root);

fs.writeFileSync("scripts/Data/merkletree.json", JSON.stringify(tree.dump(), null, 2), "utf8");
console.log("JSON file created: merkletree.json");