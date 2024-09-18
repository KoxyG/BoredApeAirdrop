import * as fs from 'fs';
import { ethers } from 'ethers';



const claimAddress = [
    "0xbB05F71952B30786d0aC7c7A8fA045724B8d2D69",
    "0xEee899B6521DB73E94F4B9224Cdf3db0010Fa334",
    "0xF3c8A1BaF3D533D300D02798169991D2aAFab019",
    "0xe785aAfD96E23510A7995E16b49C22D15f219B85"
];


// Generate data for each address in claimAddress
function generateData(): { address: string, amount: number }[] {
    const data: { address: string, amount: number }[] = [];
    
    claimAddress.forEach((address, index) => {
        const bal = Math.ceil(Math.random() * (index + 1) * 17);
        data.push({ address, amount: bal });
    });
    
    return data;
}



// Function to convert data to CSV format
function convertToCSV(data: { address: string, amount: number }[]): string {
    let csv = 'address,amount\n';
    data.forEach(item => {
        csv += `${item.address},${item.amount}\n`;
    });
    return csv;
}

// Write data to a CSV file
function writeCSV(data: string): void {
    fs.writeFile('scripts/Data/csvFile.csv', data, (err) => {
        if (err) {
            console.error('Error writing to CSV:', err);
        } else {
            console.log('CSV file generated successfully.');
        }
    });
}

// Main function to generate data and write to CSV
function main() {
    const data = generateData();
    const csvData = convertToCSV(data);
    writeCSV(csvData);
}

// Run the main function
main();