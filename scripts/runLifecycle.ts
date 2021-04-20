import {ethers, deployments, getNamedAccounts, getChainId} from "hardhat"
import YieldSourcePrizePool from '@pooltogether/pooltogether-contracts/abis/YieldSourcePrizePool.json';
import PeriodicPrizeStrategy from '@pooltogether/pooltogether-contracts/abis/PeriodicPrizeStrategy.json';
import MultipleWinners from '@pooltogether/pooltogether-contracts/abis/MultipleWinners.json';
import {dai} from "@studydefi/money-legos/erc20"

const daiERC20Address = "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063"
const daiYieldSourcePrizePool = "0xA4579F6C63858a28eA88ee4c1bdaD628888C4aDB" 

async function runLifeCycle(){
    depositTo()
    await new Promise((r)=>(setTimeout(r, 5000)))
    startAward()
    await new Promise((r)=>(setTimeout(r, 5000)))
    completeAward()
    await new Promise((r)=>(setTimeout(r, 5000)))
    instantWithdraw()

}
runLifeCycle()

async function depositTo(){
    
    const { deployer } = await getNamedAccounts()
    


    console.log("deployer is ", deployer)
    const signer = await ethers.provider.getSigner(deployer)

    const daiERC20Contract = await ethers.getContractAt(dai.abi, daiERC20Address)

    console.log("balanceOf deployer ", await daiERC20Contract.balanceOf(deployer))

    const prizePool = await ethers.getContractAt(YieldSourcePrizePool, daiYieldSourcePrizePool, signer)

    console.log("controlledToken is ", await prizePool.token())

    const depositAmount = ethers.utils.parseEther("2")
    const approveResult = await daiERC20Contract.approve(daiYieldSourcePrizePool,depositAmount)
    console.log("approveResult ", approveResult.toString())

    const prizeStrategy = await ethers.getContractAt(MultipleWinners, await prizePool.prizeStrategy(), signer)
    const ticketAddress = await prizeStrategy.ticket()

    const depositToResult = await prizePool.depositTo(deployer, depositAmount, ticketAddress, ethers.constants.AddressZero)
    console.log("depositTo is ",depositToResult)

}
// depositTo()

async function instantWithdraw(){
    const { deployer } = await getNamedAccounts()
    const signer = await ethers.provider.getSigner(deployer)

    const prizePool = await ethers.getContractAt(YieldSourcePrizePool, daiYieldSourcePrizePool, signer)
    const withdrawAmount = ethers.utils.parseEther("0.5")
    const prizeStrategy = await ethers.getContractAt(MultipleWinners, await prizePool.prizeStrategy(), signer)
    const ticketAddress = await prizeStrategy.ticket()
    
    const exitFee = await ethers.utils.parseEther("2")
    
    const withdrawResult = await prizePool.withdrawInstantlyFrom(deployer, withdrawAmount,
        ticketAddress, exitFee)
    console.log(withdrawResult)


}
// instantWithdraw()

async function balanceOf(){
    const { deployer } = await getNamedAccounts()
    const signer = await ethers.provider.getSigner(deployer)

    const prizePool = await ethers.getContractAt(YieldSourcePrizePool, daiYieldSourcePrizePool, signer)
    console.log(await prizePool.balance())
}
// balanceOf()


async function startAward(){
    const { deployer } = await getNamedAccounts()
    const signer = await ethers.provider.getSigner(deployer)

    const prizePool = await ethers.getContractAt(YieldSourcePrizePool, daiYieldSourcePrizePool, signer)
    const prizeStrategy = await ethers.getContractAt(PeriodicPrizeStrategy, await prizePool.prizeStrategy(), signer)
    console.log(await prizeStrategy.startAward())

}
// startAward()


async function completeAward(){
    const { deployer } = await getNamedAccounts()
    const signer = await ethers.provider.getSigner(deployer)

    const prizePool = await ethers.getContractAt(YieldSourcePrizePool, daiYieldSourcePrizePool, signer)
    const prizeStrategy = await ethers.getContractAt(PeriodicPrizeStrategy, await prizePool.prizeStrategy(), signer)
    console.log(await prizeStrategy.completeAward())

}
// completeAward()

  