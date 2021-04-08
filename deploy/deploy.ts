import chalk from 'chalk';

import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction, DeployResult } from 'hardhat-deploy/types';
import { hardhatArguments } from 'hardhat';
import { Contract, ContractFactory } from 'ethers';

const displayLogs = !process.env.HIDE_DEPLOY_LOG;

function dim(logMessage: string) {
  if (displayLogs) {
    console.log(chalk.dim(logMessage));
  }
}

function cyan(logMessage: string) {
  if (displayLogs) {
    console.log(chalk.cyan(logMessage));
  }
}

function yellow(logMessage: string) {
  if (displayLogs) {
    console.log(chalk.yellow(logMessage));
  }
}

function green(logMessage: string) {
  if (displayLogs) {
    console.log(chalk.green(logMessage));
  }
}

function displayResult(name: string, result: DeployResult) {
  if (!result.newlyDeployed) {
    yellow(`Re-used existing ${name} at ${result.address}`);
  } else {
    green(`${name} deployed at ${result.address}`);
  }
}

const chainName = (chainId: number) => {
  switch (chainId) {
    case 1:
      return 'Mainnet';
    case 3:
      return 'Ropsten';
    case 4:
      return 'Rinkeby';
    case 5:
      return 'Goerli';
    case 42:
      return 'Kovan';
    case 77:
      return 'POA Sokol';
    case 99:
      return 'POA';
    case 100:
      return 'xDai';
    case 137:
      return 'Matic';
    case 31337:
      return 'HardhatEVM';
    case 80001:
      return 'Matic (Mumbai)';
    default:
      return 'Unknown';
  }
};

const deployFunction: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts, deployments, getChainId, ethers } = hre;
  const { deploy } = deployments;

  let { deployer, admin } = await getNamedAccounts();

  const chainId = parseInt(await getChainId());

  // 31337 is unit testing, 1337 is for coverage
  const isTestEnvironment = chainId === 31337 || chainId === 1337;

  const signer = ethers.provider.getSigner(deployer);

  dim('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
  dim('PoolTogether Aave Yield Source - Deploy Script');
  dim('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n');

  dim(`network: ${chainName(chainId)} (${isTestEnvironment ? 'local' : 'remote'})`);
  dim(`deployer: ${deployer}`);

  if (!admin) {
    admin = signer._address;
  }

  dim(`deployer: ${admin}`);

  cyan(`\nDeploying ATokenYieldSource...`);
  const aTokenYieldSourceResult = await deploy('ATokenYieldSource', {
    from: deployer,
  });
  
  displayResult('ATokenYieldSource', aTokenYieldSourceResult);

  let aTokenYieldSourceContract
  if(aTokenYieldSourceResult.address){
    aTokenYieldSourceContract = await ethers.getContractAt("ATokenYieldSource", aTokenYieldSourceResult.address)
    await aTokenYieldSourceContract.mockInitialize()
  }

  const genericProxyFactoryAbi = await hre.artifacts.readArtifact("GenericProxyFactory")
  let proxyFactoryContractFactory : ContractFactory
  let proxyFactoryContract : Contract

  if(isTestEnvironment){
    proxyFactoryContractFactory = await ethers.getContractFactory("GenericProxyFactory")
    proxyFactoryContract = await proxyFactoryContractFactory.deploy()

  }
  else { // real network!
    // import GenericProxyClone address (using namedAccounts) for specific network
    let { genericProxyFactoryAddress } = await getNamedAccounts()
    proxyFactoryContract = await ethers.getContractAt("GenericProxyFactory", genericProxyFactoryAddress)
  }
  
  // get array of aave markets we want to use and create these using the GenericProxyFactory
  // now deploy proxy contracts pointing at ATokenYieldSource
  // change to forEach for array of deployments
  if(aTokenYieldSourceContract){
    const createATokenYieldSourceResult = await proxyFactoryContract.create(aTokenYieldSourceContract.address, "0x") // we probably want to call ATokenYieldSource.initialize here
    console.log(createATokenYieldSourceResult)

    // now generate deployments JSON entry -- need: address, abi (of instance), txHash, receipt, constructor args, bytecode? , deployedBytecode?
    const receipt = await ethers.provider.getTransactionReceipt(createATokenYieldSourceResult.hash);
    const createdEvent = proxyFactoryContract.interface.parseLog(receipt.logs[0]);
    console.log("receipt is", receipt)
    console.log("event is ", createdEvent)

    // write to deployments/networkName/contractName.file
  }
  
};

export default deployFunction;
