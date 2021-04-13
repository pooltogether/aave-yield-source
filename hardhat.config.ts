import '@nomiclabs/hardhat-etherscan';
import '@nomiclabs/hardhat-waffle';
import '@typechain/hardhat';
import 'hardhat-abi-exporter';
import 'hardhat-deploy';
import 'hardhat-deploy-ethers';
import 'hardhat-gas-reporter';
import 'solidity-coverage';
import 'hardhat-dependency-compiler'

import { HardhatUserConfig } from 'hardhat/config';

import * as forkTasks from './scripts/fork';
import networks from './hardhat.network';

const optimizerEnabled = !process.env.OPTIMIZER_DISABLED;

const config: HardhatUserConfig = {
  abiExporter: {
    path: './abis',
    clear: true,
    flat: true,
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  gasReporter: {
    currency: 'USD',
    gasPrice: 100,
    enabled: process.env.REPORT_GAS ? true : false,
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    maxMethodDiff: 10,
  },
  mocha: {
    timeout: 30000,
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
    genericProxyFactory:{
      default: "0x14e09c3319244a84e7c1E7B52634f5220FA96623",
      4: "0x594069c560D260F90C21Be25fD2C8684efbb5628",
      42: "0x713edC7728C4F0BCc135D48fF96282444d77E604",
      80001: "0xd1797D46C3E825fce5215a0259D3426a5c49455C"
    },
    lendingPoolAddressesProviderRegistry:{
      default: "0x52D306e36E3B6B02c153d0266ff0f85d18BCD413",
      42: "0x1E40B561EC587036f9789aF83236f057D1ed2A90"
    }
  },
  networks,
  solidity: {
    version: '0.6.12',
    settings: {
      optimizer: {
        enabled: optimizerEnabled,
        runs: 200,
      },
      evmVersion: 'istanbul',
    },
  },
  typechain: {
    outDir: 'types',
    target: 'ethers-v5',
  },
  dependencyCompiler: {
    paths:['@pooltogether/pooltogether-proxy-factory/contracts/GenericProxyFactory.sol']
  }
};

forkTasks;

export default config;
