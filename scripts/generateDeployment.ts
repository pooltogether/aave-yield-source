interface ProxyDeployment {
    address?: string
    abi?: any
    transactionHash?: string
    receipt?: any
    args?: any
    bytecode?: string
  }

import { Contract } from "ethers";
import { writeFileSync } from "fs";
import {ethers, getNamedAccounts} from "hardhat"

  async function createDeployment(){

    const hash = "0x04e348a719e5e68b858ef78a9140af1e9440a4d48febc5c40a879cfd184757b5"
    const receipt = await ethers.provider.getTransactionReceipt(hash);

    console.log("receipt is ", receipt)

    const {genericProxyFactory} = await getNamedAccounts()
    let proxyFactoryContract : Contract = await ethers.getContractAt("GenericProxyFactory", genericProxyFactory)


    const createdEvent = proxyFactoryContract.interface.parseLog(receipt.logs[0]);
    

    

    let jsonObj: ProxyDeployment = {
      address: createdEvent.args.created,
      transactionHash: receipt.transactionHash,
      receipt: receipt,
      args: ``,
      bytecode: `${await ethers.provider.getCode(createdEvent.args.created)}`
    }
    
    writeFileSync(`./deployments/mainnet/aGUSD.json`, JSON.stringify(jsonObj), {encoding:'utf8',flag:'w'})

    console.log("finished")
  }

  createDeployment()