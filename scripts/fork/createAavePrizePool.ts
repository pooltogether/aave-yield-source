import PoolWithMultipleWinnersBuilder from '@pooltogether/pooltogether-contracts/deployments/mumbai/PoolWithMultipleWinnersBuilder.json';
import RNGBlockhash from '@pooltogether/pooltogether-rng-contracts/deployments/mumbai_80001/RNGBlockhash.json';
import ControlledToken from '@pooltogether/pooltogether-contracts/abis/ControlledToken.json';
import MultipleWinners from '@pooltogether/pooltogether-contracts/abis/MultipleWinners.json';
import YieldSourcePrizePool from '@pooltogether/pooltogether-contracts/abis/YieldSourcePrizePool.json';

import { dai } from '@studydefi/money-legos/erc20';
import Erc20MintableAbi from "../../abis/ERC20Mintable.json"

import { info, success } from '../helpers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { BigNumber } from 'ethers';
import { getNamedSigner } from 'hardhat-deploy-ethers/dist/src/helpers';


const hre = require("hardhat");
const { ethers, deployments,getChainId } = hre;

// export default task('fork:create-aave-prize-pool', 'Create Aave Prize Pool').setAction(
async function createPrizePools(){
    console.log("running create prize pool script")
    const chainId = parseInt(await getChainId());
    console.log("chain id is ", chainId)
   
    const { getSigners, utils} = ethers;
    const { formatEther, parseEther: toWei } = utils;

    const [contractsOwner] = await getSigners();
    const deployer = await getNamedSigner(hre, "deployer")

    const allDeployments = await deployments.all()

    // minting mumbai AAVE
    console.log("deployer address is ", deployer.address)
    const aaveTokenContract = await ethers.getContractAt(Erc20MintableAbi,"0x341d1f30e77D3FBfbD43D17183E2acb9dF25574E", deployer)

    
    const mintResult = await aaveTokenContract.mint(contractsOwner.address, "100")

    console.log(mintResult)


    // call for each deployed yield source
    console.log("running lifecycle for aAAVE")
    // await poolLifecycle(hre, contractsOwner, allDeployments.aAAVE.address,
    //   {depositAssetName: "sUSD",
    //   depositAssetAddress: sUSDAddress,
    //   depositAssetAbi: dai.abi,
    //   depositAmount: BigNumber.from(50)
    // })

}
createPrizePools()


// );

interface DepositAsset {
  depositAssetName: string,
  depositAssetAddress: string,
  depositAmount: BigNumber,
  depositAssetAbi: any
}


async function poolLifecycle(hre :HardhatRuntimeEnvironment, contractsOwner: SignerWithAddress, aTokenYieldSourceAddress: string, depositArgs: DepositAsset){

  // const { ethers } = hre;
  
  const {depositAssetAddress, depositAssetName, depositAmount, depositAssetAbi } = depositArgs

  const { constants, provider, getContractAt, utils } = ethers;
  const { getBlock, getBlockNumber, getTransactionReceipt, send } = provider;

  const { AddressZero } = constants
  const { parseEther: toWei } = utils;

  async function increaseTime(time: number) {
    await send('evm_increaseTime', [time]);
    await send('evm_mine', []);
  }


  const aTokenYieldSource = (await getContractAt(
    'ATokenYieldSource',
    aTokenYieldSourceAddress,
    contractsOwner,
  ));

  info('Deploying ATokenYieldSourcePrizePool...');

  const poolBuilder = await getContractAt(
    PoolWithMultipleWinnersBuilder.abi,
    PoolWithMultipleWinnersBuilder.address,
    contractsOwner,
  );

  const aaveYieldSourcePrizePoolConfig = {
    yieldSource: aTokenYieldSource.address,
    maxExitFeeMantissa: toWei('0.5'),
    maxTimelockDuration: 1000,
  };

  const block = await getBlock(await getBlockNumber());

  const multipleWinnersConfig = {
    rngService: RNGBlockhash.address,
    prizePeriodStart: block.timestamp,
    prizePeriodSeconds: 60,
    ticketName: 'Ticket',
    ticketSymbol: 'TICK',
    sponsorshipName: 'Sponsorship',
    sponsorshipSymbol: 'SPON',
    ticketCreditLimitMantissa: toWei('0.1'),
    ticketCreditRateMantissa: toWei('0.001'),
    numberOfWinners: 1,
  };

  const yieldSourceMultipleWinnersTx = await poolBuilder.createYieldSourceMultipleWinners(
    aaveYieldSourcePrizePoolConfig,
    multipleWinnersConfig,
    18,
  );

  const yieldSourceMultipleWinnersReceipt = await getTransactionReceipt(
    yieldSourceMultipleWinnersTx.hash,
  );

  const yieldSourcePrizePoolInitializedEvent = yieldSourceMultipleWinnersReceipt.logs.map(
    (log: any) => {
      try {
        return poolBuilder.interface.parseLog(log);
      } catch (e) {
        return null;
      }
    },
  );

  const prizePool = await getContractAt(
    YieldSourcePrizePool,
    yieldSourcePrizePoolInitializedEvent[yieldSourcePrizePoolInitializedEvent.length - 1]?.args[
      'prizePool'
    ],
    contractsOwner,
  );

  success(`Deployed ATokenYieldSourcePrizePool! ${prizePool.address}`);

  const prizeStrategy = await getContractAt(
    MultipleWinners,
    await prizePool.prizeStrategy(),
    contractsOwner,
  );
 

  const depositAssetContract = await getContractAt(depositAssetAbi, depositAssetAddress, contractsOwner);
  await depositAssetContract.approve(prizePool.address, depositAmount);

  info(`Depositing ${depositAmount} ${depositAssetName}`);

  await prizePool.depositTo(
    contractsOwner.address,
    depositAmount,
    await prizeStrategy.ticket(),
    AddressZero,
  );

  success('Deposit Successful!');

  info(`Prize strategy owner: ${await prizeStrategy.owner()}`);

  await increaseTime(60);

  info('Starting award...');
  await prizeStrategy.startAward();
  await increaseTime(1);

  info('Completing award...');
  const awardTx = await prizeStrategy.completeAward();
  const awardReceipt = await getTransactionReceipt(awardTx.hash);

  // console.log("awardReceipt event lenght  ", awardReceipt.logs.length)

  const awardLogs = awardReceipt.logs.map((log:any) => {
    try {
      return prizePool.interface.parseLog(log);
    } catch (e) {
      return null;
    }
  });

  const completeAwardLogs = awardReceipt.logs.map((log:any) => {
    try {
      return prizeStrategy.interface.parseLog(log);
    } catch (e) {
      return null;
    }
  });

  // console.log("completeAwardLogs ", completeAwardLogs)

  const awarded = awardLogs.find((event:any) => event && event.name === 'Awarded');
  // console.log("awarded event", awarded)
  
  if(awarded){
    success(`Awarded ${awarded?.args?.amount} ${depositAssetName}!`);
  }

  info('Withdrawing...');
  const ticketAddress = await prizeStrategy.ticket();
  const ticket = await getContractAt(ControlledToken, ticketAddress, contractsOwner);
  
  const withdrawalAmount = depositAmount.div(2); // withdraw half the amount deposited
  
  const earlyExitFee = await prizePool.callStatic.calculateEarlyExitFee(contractsOwner.address, ticket.address, withdrawalAmount);

  const withdrawTx = await prizePool.withdrawInstantlyFrom(
    contractsOwner.address,
    withdrawalAmount,
    ticket.address,
    earlyExitFee.exitFee,
  );

  const withdrawReceipt = await getTransactionReceipt(withdrawTx.hash);
  const withdrawLogs = withdrawReceipt.logs.map((log:any) => {
    try {
      return prizePool.interface.parseLog(log);
    } catch (e) {
      return null;
    }
  });

  const withdrawn = withdrawLogs.find((event:any) => event && event.name === 'InstantWithdrawal');
  success(`Withdrawn ${withdrawn?.args?.redeemed} ${depositAssetName}!`);
  success(`Exit fee was ${withdrawn?.args?.exitFee} ${depositAssetName}`);

  await prizePool.captureAwardBalance();
  const awardBalance = await prizePool.callStatic.awardBalance();
  success(`Current awardable balance is ${awardBalance} ${depositAssetName}`);
}