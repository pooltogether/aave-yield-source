import chalk from 'chalk';

import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction, DeployResult } from 'hardhat-deploy/types';
import { Contract, ContractFactory } from 'ethers';
import { existsSync, readFileSync, writeFileSync } from "fs"
import { getChainByChainId } from "evm-chains"
import { yieldSourceTokenSymbols } from '../aave.config'


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

interface ProxyDeployment {
  address?: string
  abi?: any
  transactionHash?: string
  receipt?: any
  args?: any
  bytecode?: string
}

const deployFunction: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  dim('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
  dim('PoolTogether Aave Yield Source - Deploy Script');
  dim('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n');
  
  
  const { getNamedAccounts, deployments, getChainId, ethers } = hre;
  const { deploy } = deployments;

  let { deployer, multisig } = await getNamedAccounts();

  const chainId = parseInt(await getChainId());

  // 31337 is unit testing, 1337 is for coverage
  const isTestEnvironment = chainId === 31337 || chainId === 1337;

  dim(`network: ${chainName(chainId)} (${isTestEnvironment ? 'local' : 'remote'})`);
  dim(`deployer: ${deployer}`);

  if(!multisig){
    yellow(`multisig address not defined for network ${chainId}, falling back to deployer: ${deployer}`)
    multisig = deployer;
  } else {
    dim(`multisig ${multisig}`)
  }

  cyan(`\nDeploying ATokenYieldSource...`);
  const aTokenYieldSourceResult : DeployResult = await deploy('ATokenYieldSource', {
    from: deployer,
    skipIfAlreadyDeployed: true
  });
  
  displayResult('ATokenYieldSource', aTokenYieldSourceResult);

  let aTokenYieldSourceContract: Contract

  aTokenYieldSourceContract = await ethers.getContractAt("ATokenYieldSource", aTokenYieldSourceResult.address)
  if(aTokenYieldSourceResult.newlyDeployed){
    dim(`calling mockInitialize()`)
    await aTokenYieldSourceContract.freeze()
    green(`mockInitialize success`)
  }

  let proxyFactoryContractFactory : ContractFactory
  let proxyFactoryContract : Contract

  if(isTestEnvironment){
    dim(`TestEnvironment detected, deploying a local GenericProxyFactory`)
    proxyFactoryContractFactory = await ethers.getContractFactory("GenericProxyFactory")
    proxyFactoryContract = await proxyFactoryContractFactory.deploy()
    green(`Deployed a local GenericProxyFactory at ${proxyFactoryContract.address}`)
  }
  else { // real network
    let { genericProxyFactory } = await getNamedAccounts()     // import GenericProxyClone address (using namedAccounts) for specific network
    proxyFactoryContract = await ethers.getContractAt("GenericProxyFactory", genericProxyFactory)
  }

  if(!isTestEnvironment){
    dim(`GenericProxyFactory for ${getChainByChainId(chainId).network} at ${proxyFactoryContract.address}`)
  }
   
  // read in aave deployment lendingMarkets json file (https://docs.aave.com/developers/deployed-contracts/deployed-contracts)
  let aaveAddressesArray
  if(chainId === 1){
    dim(`loading Aave mainnet json`)
    aaveAddressesArray = (JSON.parse(readFileSync("./aave/aaveMainnet.json", {encoding: "utf-8"}))).proto
  }
  else if(chainId === 42){
    aaveAddressesArray = (JSON.parse(readFileSync("./aave/aaveKovan.json", {encoding: "utf-8"}))).proto
  }
  else if(chainId === 137){
    dim(`reading addresses for Polygon`)
    aaveAddressesArray = (JSON.parse(readFileSync("./aave/aavePolygon.json", {encoding: "utf-8"}))).proto
  }
  else if(chainId === 80001){
    aaveAddressesArray = (JSON.parse(readFileSync("./aave/aaveKovan.json", {encoding: "utf-8"}))).proto
  }
  else{
    dim(`TestEnvironment! No deployed ATokens. Using Kovan as mock.`)
    aaveAddressesArray = (JSON.parse(readFileSync("./aave/aaveKovan.json", {encoding: "utf-8"}))).proto
  }

  // we can filter here for aTokens that we want - by token symbol
  const aTokenFilter: string[] = yieldSourceTokenSymbols[chainId]

  aaveAddressesArray = aaveAddressesArray.filter((entry: any)=>{
    if(aTokenFilter.includes(entry.symbol)){
      return entry
    }
  })

  green(`Now deploying ${aaveAddressesArray.length} aToken proxies`)

  const aTokenYieldSourceInterface = new ethers.utils.Interface((await hre.artifacts.readArtifact("ATokenYieldSource")).abi)
  let { lendingPoolAddressesProviderRegistry }= await getNamedAccounts()

  const outputDirectory = `./deployments/${hre.network.name}`

  // deploy a proxy for each entry in aaveAddressesArray
  for(const aTokenEntry of aaveAddressesArray){

    const proxyName = `Aave${aTokenEntry.symbol.toUpperCase()}YieldSource`
    const outputFile = `${outputDirectory}/${proxyName}.json`

    dim(`checking if ${outputFile} exists`)
    // if already deployed - skip
    if(existsSync(outputFile)){
      dim(`${aTokenEntry.aTokenSymbol} already exists for this network`)
      continue
    }

    const constructorArgs: string = aTokenYieldSourceInterface.encodeFunctionData(aTokenYieldSourceInterface.getFunction("initialize"),
      [
        aTokenEntry.aTokenAddress,
        lendingPoolAddressesProviderRegistry,
        aTokenEntry.decimals,
        `pt${aTokenEntry.aTokenSymbol}`,
        `PoolTogether ${aTokenEntry.aTokenSymbol}`,
        multisig
      ]
    )

    cyan(`Creating Proxy ${proxyName} for ${aTokenEntry.aTokenSymbol}`)
    
    const createATokenYieldSourceResult = await proxyFactoryContract.create(aTokenYieldSourceContract.address, constructorArgs)
    
    console.log("createATokenYieldSourceResult", createATokenYieldSourceResult)
    // now generate deployments JSON entry -- need: address, abi (of instance), txHash, receipt, constructor args, bytecode
    
    let receipt
    if(createATokenYieldSourceResult.hash){ // one of the RPC endpoints was returning an object with transactionHash (vs hash)
      await ethers.provider.waitForTransaction(createATokenYieldSourceResult.hash)
      receipt = await ethers.provider.getTransactionReceipt(createATokenYieldSourceResult.hash);
    }
    else { // some rpc nodes are returning transactionHash (vs hash)
      await ethers.provider.waitForTransaction(createATokenYieldSourceResult.transactionHash)
      receipt = await ethers.provider.getTransactionReceipt(createATokenYieldSourceResult.transactionHash);
    }

    const createdEvent = proxyFactoryContract.interface.parseLog(receipt.logs[0]);
    green(`aToken proxy for ${aTokenEntry.aTokenSymbol} created at ${createdEvent.args.created}`)

    dim(`saving deployments file for ${aTokenEntry.aTokenSymbol}`)

    let jsonObj: ProxyDeployment = {
      address: createdEvent.args.created,
      transactionHash: receipt.transactionHash,
      receipt: receipt,
      args: constructorArgs,
      bytecode: `${await ethers.provider.getCode(createdEvent.args.created)}`
    }
    
    dim(`Writing to ${outputFile}...`)
    writeFileSync(outputFile, JSON.stringify(jsonObj, null, 2), {encoding:'utf8',flag:'w'})
  }
};

export default deployFunction;
