const bitcoin = require("bitcoinjs-lib");
const ECPairFactory = require("ecpair").default;
const ecc = require("tiny-secp256k1");
const { randomBytes } = require("crypto");

const ECPair = ECPairFactory(ecc);

const testnet = bitcoin.networks.testnet;
const keyPair = ECPair.makeRandom({ network: testnet, rng: randomBytes });

const { address } = bitcoin.payments.p2pkh({
  pubkey: keyPair.publicKey,
  network: testnet,
});

const wif = keyPair.toWIF();

console.log("Address:", address);
console.log("Private Key (WIF):", wif);

//Sites to get the bitcoin faucets
// "1. https://coinfaucet.eu/en/btc-testnet/");
// ("2. https://testnet-faucet.mempool.co/");
// ("3. https://bitcoinfaucet.uo1.net/");
