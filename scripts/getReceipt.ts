import {ethers, deployments, getNamedAccounts, getChainId} from "hardhat"
import YieldSourcePrizePool from '@pooltogether/pooltogether-contracts/abis/YieldSourcePrizePool.json';


async function getReceipt(){
    const hash = "0x12fd3e05f2d996f5108eb0835e6fce63fe6ef1c3eb9276e4df04e986f6e866f3"
    const receipt = await ethers.provider.getTransactionReceipt(hash)
    console.log(receipt.transactionHash)

}

// getReceipt()

async function depositTo(){
    
    const { deployer } = await getNamedAccounts()
    
    console.log("deployer is ", deployer)
    const signer = await ethers.provider.getSigner(deployer)


    const prizePool = await ethers.getContractAt(YieldSourcePrizePool, "0xB38692cc68958095A28083EfEa243461B6f90207", signer)

    await prizePool.depositTo(deployer, "10", "0x39cb91C262F5379e1B045e29a9fd8677bE747681", ethers.constants.AddressZero)
}
depositTo()