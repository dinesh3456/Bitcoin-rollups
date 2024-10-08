# Ethereum to Bitcoin Ordinal Rollup Project

This project demonstrates a basic implementation of rolling up an Ethereum smart contract state and inscribing it onto the Bitcoin testnet using Ordinals.

## Smart Contract

The smart contract is an ERC20 token implementation with additional features such as minting, burning, and pausing. It's written in Solidity and uses the Foundry development framework.

Key features of the smart contract:

- ERC20 functionality (transfer, approve, transferFrom)
- Minting and burning capabilities (owner only)
- Pausable transfers
- Supply cap
- `rollupState` function for state rollup

## Rollup Function

The `rollupState` function in the smart contract encapsulates the current state of the contract into a single hash:

```solidity
function rollupState() public view returns(bytes32) {
    return keccak256(abi.encodePacked(
        totalSupply(),
        _cap,
        balanceOf(msg.sender),
        owner(),
        block.number,
        block.timestamp
    ));
}
```

This function combines key contract state variables into a single hash, which can then be inscribed onto the Bitcoin blockchain.

## Simulation Process

The rollup and inscription process is simulated using two main scripts:

1. `fetchState.js`: This script interacts with the deployed ERC20 contract on the Ethereum network to fetch the current state using the `rollupState` function.

2. `simulateRollupAndInscribe.js`: This script takes the state fetched by `fetchState.js` and simulates the process of inscribing it onto the Bitcoin testnet using an OP_RETURN output.

The process involves:
a. Reading the state from a file
b. Creating a Bitcoin testnet transaction
c. Adding the state data as an OP_RETURN output
d. Broadcasting the transaction to the Bitcoin testnet

3.`generateTestnetKey`:The generateTestnetAddress.js script creates a new Bitcoin testnet address and private key for testing purposes.

**To run this script**:
`node script/generateTestnetAddress.js`

## After generating an address, you can get testnet bitcoins from these faucets:

1. https://coinfaucet.eu/en/btc-testnet/
2. https://testnet-faucet.mempool.co/
3. https://bitcoinfaucet.uo1.net/

## Environment Setup

Create a .env file in the project root with the following variables:

```
ETHEREUM_RPC_URL=<Your Ethereum RPC URL>
PRIVATE_KEY=<Your Ethereum Private Key>
CONTRACT_ADDRESS=<Deployed Token Contract Address>
BITCOIN_PRIVATE_KEY=<Your Bitcoin Testnet Private Key in WIF format>
```

## Challenges and Considerations

1. **API Reliability**: Initially, there were issues fetching raw transaction data from the BlockCypher API. This was resolved by switching to the Blockstream API for fetching raw transaction data.

2. **Transaction Fees**: Proper calculation of transaction fees is crucial to ensure the transaction is accepted by the network.

3. **Data Size Limitations**: The OP_RETURN output has a size limitation (typically 80 bytes). For larger state data, more complex solutions like using multiple transactions or data chunking might be necessary.

4. **Testnet vs Mainnet**: This implementation uses the Bitcoin testnet. Moving to mainnet would require careful consideration of costs and security implications.

5. **Verification**: Implementing a verification process to ensure the inscribed data matches the original state would enhance the reliability of the system.

##Deploying and Interacting with the Smart Contract

**Compile the contract**:
`forge build`

**Deploy the contract (replace <ARGS> with your constructor arguments)**:
`forge create src/Token.sol:Token --constructor-args <ARGS> --private-key <YOUR_PRIVATE_KEY>`

## Conclusion

This project demonstrates a basic implementation of rolling up an Ethereum smart contract state and inscribing it onto the Bitcoin testnet. While functional, it serves as a starting point for more complex and robust ordinal rollup systems.
