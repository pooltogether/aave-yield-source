import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "hardhat-abi-exporter"

import { HardhatUserConfig } from "hardhat/config";

import networks from "./hardhat.network";

const optimizerEnabled = !process.env.OPTIMIZER_DISABLED;

const config: HardhatUserConfig = {
  networks,
  solidity: {
    version: "0.7.6",
    settings: {
      optimizer: {
        enabled: optimizerEnabled,
        runs: 200
      },
      evmVersion: "berlin"
    },
  },
  mocha: {
    timeout: 30000
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  },
  abiExporter: {
    path: './abis',
    clear: true,
    flat: true
  }
}

export default config;
