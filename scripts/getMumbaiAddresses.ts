import { HardhatRuntimeEnvironment } from "hardhat/types"
import {ethers} from "hardhat"


async function getATokenAddresses(){
    // 

    console.log("finding ReserveTokensAddress")
    const aaveProtocolDataProvider: string = "0xFA3bD19110d986c5e5E9DD5F69362d05035D045B"



    const aaveProtocolDataProviderContract = await ethers.getContractAt("IProtocolDataProvider", aaveProtocolDataProvider)

    const daiAddress = "0xbE23a3AA13038CfC28aFd0ECe4FdE379fE7fBfc4"
    const usdtAdddress = "0xf9d5AAC6E5572AEFa6bd64108ff86a222F69B64d"
    const wMaticAdddress = '0xF9680D99D6C9589e2a93a78A04A279e509205945'

    console.log("reserveTokensAddress is ", await aaveProtocolDataProviderContract.getReserveTokensAddresses(wMaticAdddress))


}

getATokenAddresses()