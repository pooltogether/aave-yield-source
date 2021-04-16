// const aBUSDTxResult = {
//     hash: '0xba9a4f12c40dcf9fca18f08d9d6d734c38cefde0a3001de3d1a73baf2da50744',
//     blockHash: null,
//     blockNumber: null,
//     transactionIndex: null,
//     confirmations: 0,
//     from: '0x3F0556bCA55Bdbb78A9316936067a47fd4C4C4f4',
//     gasPrice: BigNumber { _hex: '0x12a05f2001', _isBigNumber: true },
//     gasLimit: BigNumber { _hex: '0x03c3e6', _isBigNumber: true },
//     to: '0x14e09c3319244a84e7c1E7B52634f5220FA96623',
//     value: BigNumber { _hex: '0x00', _isBigNumber: true },
//     nonce: 6,
//     data: '0xa3f697ba000000000000000000000000ba71a9907e88925f59a3658c3a7618440df6406e0000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000014465e86581000000000000000000000000a361718326c15715591c299427c62086f69923d900000000000000000000000052d306e36e3b6b02c153d0266ff0f85d18bcd413000000000000000000000000000000000000000000000000000000000000001200000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000010000000000000000000000000042cd8312d2bce04277dd5161832460e95b24262e000000000000000000000000000000000000000000000000000000000000000770746142555344000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000012506f6f6c546f676574686572206142555344000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
//     r: '0x5d24137fc76765c875d56969f9f121cfec304880ecafa5394f37ea661cd892b6',
//     s: '0x5bf98428b9462c7297624516ecc0c5438368fb3de76ea7266723199d745586d2',
//     v: 38,
//     creates: null,
//     chainId: 1,
//     wait: [Function (anonymous)]
//   }

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