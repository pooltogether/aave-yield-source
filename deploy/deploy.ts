import chalk from 'chalk';

import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction, DeployResult } from 'hardhat-deploy/types';
import { Contract, ContractFactory } from 'ethers';
import { existsSync, readFile, readFileSync, writeFileSync } from "fs"
import { getChainByChainId } from "evm-chains"


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

  let { deployer, admin, multisig } = await getNamedAccounts();

  const chainId = parseInt(await getChainId());

  // 31337 is unit testing, 1337 is for coverage
  const isTestEnvironment = chainId === 31337 || chainId === 1337;

  const signer = ethers.provider.getSigner(deployer);

  dim(`network: ${chainName(chainId)} (${isTestEnvironment ? 'local' : 'remote'})`);
  dim(`deployer: ${deployer}`);

  if (!admin) {
    admin = signer._address;
  }
  if(!multisig){
    throw new Error("MultiSig address not set - needed for Owner of YieldSource")
  }

  dim(`deployer: ${admin}`);

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
  else { // real network!
    // import GenericProxyClone address (using namedAccounts) for specific network
    dim(`getting genericProxyFactory address`)
    let { genericProxyFactory } = await getNamedAccounts()
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
  else{
    dim(`TestEnvironment! No deployed ATokens. Using Kovan as mock.`)
    aaveAddressesArray = (JSON.parse(readFileSync("./aave/aaveKovan.json", {encoding: "utf-8"}))).proto
  }

  // we can filter here for aTokens that we want - by symbol
  const aTokenFilter: string[] = ["GUSD", "BUSD", "sUSD"] //"GUSD", "BUSD", "sUSD"

  aaveAddressesArray = aaveAddressesArray.filter((entry: any)=>{
    if(aTokenFilter.includes(entry.symbol)){
      return entry
    }
  })

  green(`Now deploying ${aaveAddressesArray.length} aToken proxies`)

  const aTokenYieldSourceInterface = new ethers.utils.Interface((await hre.artifacts.readArtifact("ATokenYieldSource")).abi)
  let { lendingPoolAddressesProviderRegistry }= await getNamedAccounts()

  // deploy a proxy for each entry in aaveAddressesArray
  for(const aTokenEntry of aaveAddressesArray){
    
    // if already deployed - skip
    if(existsSync(`./deployments/${isTestEnvironment? 'localhost': getChainByChainId(chainId).network}/${aTokenEntry.aTokenSymbol}.json`)){
      dim(`${aTokenEntry.aTokenSymbol} already exists for this network`)
      continue
    }

    let constructorArgs: string = aTokenYieldSourceInterface.encodeFunctionData(aTokenYieldSourceInterface.getFunction("initialize"),
      [
        aTokenEntry.aTokenAddress,
        lendingPoolAddressesProviderRegistry,
        aTokenEntry.decimals,
        `pt${aTokenEntry.aTokenSymbol}`,
        `PoolTogether ${aTokenEntry.aTokenSymbol}`,
        multisig
      ]
    )

    dim(`Creating Proxy for ${aTokenEntry.aTokenSymbol}`)
    
    const createATokenYieldSourceResult = await proxyFactoryContract.create(aTokenYieldSourceContract.address, constructorArgs) 
    
    // now generate deployments JSON entry -- need: address, abi (of instance), txHash, receipt, constructor args, bytecode
    // const createATokenYieldSourceResult = JSON.parse(readFileSync("./aaveMumbaiReceipt.json", {encoding:'utf8'})) // work around for slow rpc
    
  
    let receipt
    if(createATokenYieldSourceResult.hash){
      receipt = await ethers.provider.getTransactionReceipt(createATokenYieldSourceResult.hash);
    }
    else {
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
    
    // write to deployments/networkName/contractName.file
    if(!process.env.FORK_ENABLED){
      dim(`fork detected`)
      writeFileSync(`./deployments/localhost/${aTokenEntry.aTokenSymbol}.json`, JSON.stringify(jsonObj), {encoding:'utf8',flag:'w'})
      
    }
    else if(!isTestEnvironment){
      dim(`external network ${getChainByChainId(chainId).chain} detected`)
      writeFileSync(`./deployments/${getChainByChainId(chainId).chain}/${aTokenEntry.aTokenSymbol}.json`, JSON.stringify(jsonObj), {encoding:'utf8',flag:'w'})
    }
    else{
      writeFileSync(`./deployments/localhost/${aTokenEntry.aTokenSymbol}.json`, JSON.stringify(jsonObj), {encoding:'utf8',flag:'w'})
    }
  }
    

  
};

export default deployFunction;
