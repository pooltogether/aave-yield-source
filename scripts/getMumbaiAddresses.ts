import { HardhatRuntimeEnvironment } from "hardhat/types"
import {ethers} from "hardhat"
import { writeFileSync } from "fs"
import Erc20MintableAbi from "../abis/ERC20Mintable.json"

async function getATokenAddresses(){
    // 

    console.log("finding ReserveTokensAddress")
    
    const LendingPoolAddress = "0x9198F13B08E299d85E096929fA9781A1E3d5d827"

    const lendingPoolContract = await ethers.getContractAt("LendingPool", LendingPoolAddress)

    const aaveTokenAddress = '0x341d1f30e77D3FBfbD43D17183E2acb9dF25574E'

    console.log("getReserveData is ")
    console.log(await lendingPoolContract.getReserveData(aaveTokenAddress))

    // console.log("reserveTokensAddress is ", await aaveProtocolDataProviderContract.getReserveTokensAddresses(wMaticAdddress))


}

// getATokenAddresses()


async function getTx(){ // create tx hash 0x0aa5dc09453a937c54987472c1cfc57550bf9b6cd985b28837c769ee150c874d
    // console.log(await ethers.provider)
    const receipt = JSON.stringify(await ethers.provider.getTransactionReceipt("0x5ca6e105688c0752cf29f8ca0d5b9a21879dbdf16e22cb86d75702729e416054"))
    console.log(receipt)
    // writeFileSync(`./aaveMumbaiReceipt.json`, receipt, {encoding:'utf8',flag:'w'})
}
// getTx()

// async function mintTx(){
//     const aaveTokenContract = await ethers.getContractAt(Erc20MintableAbi,"0x341d1f30e77D3FBfbD43D17183E2acb9dF25574E")
//     console.log(await aaveTokenContract.balanceOf("0x3F0556bCA55Bdbb78A9316936067a47fd4C4C4f4"))
// }
// mintTx()