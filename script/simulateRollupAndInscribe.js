require("dotenv").config({ path: "../.env" });
const bitcoin = require("bitcoinjs-lib");
const axios = require("axios");
const fs = require("fs");
const crypto = require("crypto");
const wif = require("wif");
async function simulateRollupAndInscribe() {
  try {
    if (!fs.existsSync("./state.txt")) {
      throw new Error(
        "state.txt file not found. Please run fetchState.js first."
      );
    }

    const state = fs.readFileSync("./state.txt", "utf8");
    console.log("Read state:", state);

    const stateHash = crypto.createHash("sha256").update(state).digest("hex");
    console.log("State hash:", stateHash);

    const rolledUpData = Buffer.from(state, "utf8");

    const testnet = bitcoin.networks.testnet;

    if (!process.env.BITCOIN_PRIVATE_KEY) {
      throw new Error("BITCOIN_PRIVATE_KEY not set in .env file");
    }

    const decoded = wif.decode(process.env.BITCOIN_PRIVATE_KEY);
    const privateKeyBuffer = Buffer.from(decoded.privateKey);
    const keyPair = bitcoin.ECPair.fromPrivateKey(privateKeyBuffer, {
      network: testnet,
    });

    const { address } = bitcoin.payments.p2pkh({
      pubkey: keyPair.publicKey,
      network: testnet,
    });
    console.log("Bitcoin address:", address);

    const psbt = new bitcoin.Psbt({ network: testnet });

    const utxos = await getUtxos(address);
    if (utxos.length === 0) throw new Error("No UTXOs found for the address");

    const utxo = utxos[0];
    console.log("Using UTXO:", utxo);

    const rawTransactionHex = await getRawTransaction(utxo.txid);
    if (!rawTransactionHex) throw new Error("Unable to fetch raw transaction");

    psbt.addInput({
      hash: utxo.txid,
      index: utxo.vout,
      nonWitnessUtxo: Buffer.from(rawTransactionHex, "hex"),
    });

    const fee = 1000;
    const change = utxo.value - fee;

    psbt.addOutput({
      script: bitcoin.script.compile([bitcoin.opcodes.OP_RETURN, rolledUpData]),
      value: 0,
    });

    psbt.addOutput({
      address: address,
      value: change,
    });

    psbt.signInput(0, keyPair);
    psbt.finalizeAllInputs();

    const txHex = psbt.extractTransaction().toHex();
    console.log("Transaction hex:", txHex);

    const result = await broadcastTransaction(txHex);
    console.log("Broadcast result:", result);
  } catch (error) {
    console.error("Error:", error.message);
  }
}

async function getUtxos(address) {
  try {
    const response = await axios.get(
      `https://api.blockcypher.com/v1/btc/test3/addrs/${address}?unspentOnly=true`
    );
    return response.data.txrefs.map((utxo) => ({
      txid: utxo.tx_hash,
      vout: utxo.tx_output_n,
      value: utxo.value,
    }));
  } catch (error) {
    console.error("Error fetching UTXOs:", error.message);
    return [];
  }
}

async function getRawTransaction(txid) {
  try {
    const response = await axios.get(
      `https://blockstream.info/testnet/api/tx/${txid}/hex`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching raw transaction:", error.message);
    return null;
  }
}

async function broadcastTransaction(txHex) {
  try {
    const response = await axios.post(
      "https://api.blockcypher.com/v1/btc/test3/txs/push",
      {
        tx: txHex,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error broadcasting transaction:", error.message);
    return null;
  }
}

simulateRollupAndInscribe();
