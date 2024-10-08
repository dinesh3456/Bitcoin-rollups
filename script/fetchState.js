const ethers = require("ethers");
require("dotenv").config({ path: "../.env" });
const fs = require("fs");

let abi;
try {
  abi = require("../contractABI.json");
  console.log("ABI loaded successfully");
} catch (error) {
  console.error("Error loading ABI:", error);
  process.exit(1);
}

async function fetchState() {
  if (!process.env.ETHEREUM_RPC_URL) {
    console.error("Error: ETHEREUM_RPC_URL is not set in the .env file");
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);

  if (!process.env.PRIVATE_KEY) {
    console.error("Error: PRIVATE_KEY is not set in the .env file");
    process.exit(1);
  }

  let wallet;
  try {
    wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    console.log("Wallet created successfully");
  } catch (error) {
    console.error("Error: Invalid PRIVATE_KEY in the .env file");
    console.error(
      "Make sure your PRIVATE_KEY is a valid 64-character hexadecimal string"
    );
    process.exit(1);
  }

  if (!process.env.CONTRACT_ADDRESS) {
    console.error("Error: CONTRACT_ADDRESS is not set in the .env file");
    process.exit(1);
  }

  const contractAddress = process.env.CONTRACT_ADDRESS;
  console.log("Contract Address:", contractAddress);

  if (!Array.isArray(abi)) {
    console.error(
      "Error: ABI is not in the expected format (should be an array)"
    );
    console.log("Actual ABI:", abi);
    process.exit(1);
  }

  try {
    const contract = new ethers.Contract(contractAddress, abi, wallet);
    console.log("Contract instance created successfully");

    console.log("Calling roll-ups");

    const code = await provider.getCode(contractAddress);
    if (code === "0x") {
      console.error("Error: No contract deployed at the specified address");
      process.exit(1);
    }

    if (contract.interface && contract.interface.fragments) {
      const functions = contract.interface.fragments.filter(
        (f) => f.type === "function"
      );
      console.log(
        "Available functions:",
        functions.map((f) => f.name)
      );
    } else {
      console.error("Error: Unable to retrieve contract functions");
    }

    if (contract.rollupState) {
      const stateHash = await contract.rollupState();
      console.log("stateHash: ", stateHash);
      const stateHex = stateHash.toString();

      fs.writeFileSync("./state.txt", stateHex, "utf8");
      console.log("State saved to state.txt:", stateHex);
    } else {
      console.error("Error: rollupState function not found in the contract");
    }
  } catch (error) {
    console.error("Error fetching state:", error);
    if (error.transaction) {
      console.error("Transaction data:", error.transaction);
    }
  }
}

fetchState();
