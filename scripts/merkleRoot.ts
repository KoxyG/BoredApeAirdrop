import MerkleTree from "merkletreejs";
const  keccak256 = require("keccak256");
import csv from "csv-parser";
import * as fs from "fs";
// import { utils } from "ethers";
import path from "path";



export interface AddressProof {
  leaf: string;
  proof: string[];
}

export interface Data {
  amount?: any;
  address: string;
}

const csvfile = path.join(__dirname, "Data/csvFile.csv");

// generate merkle tree
async function generateMerkleRoot(csvFilePath: string): Promise<void> {
  const data: Data[] = [];

  // Read the CSV file and store the data in an array
  await new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on("data", (row: Data) => {
        data.push(row);
      })
      .on("end", resolve)
      .on("error", reject);
  });

 
  // convert to a leaves array
  const leaves = data.map((row) => {
    const combinedData = `${row.address}:${row.amount}`; // Adjust this based on your CSV structure
    return keccak256(combinedData); // Hash the combined data using keccak256
  });
  

 

  // Create the Merkle root
  const tree = new MerkleTree(leaves, keccak256, { hashLeaves: true, sortPairs: true });
  const  root = tree.getHexRoot();
  console.log("Merkle root:", root);

  // Convert tree structure to JSON
  const treeJson = {
    root,
    leaves: leaves.map((leaf) => leaf.toString('hex')),
  };

  // Save the tree JSON to a file
  const outputPath = path.join(__dirname, "tree.json");
  fs.writeFileSync(outputPath, JSON.stringify(treeJson, null, 2));

  console.log("Merkle tree saved to tree.json");



}


generateMerkleRoot(csvfile).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});