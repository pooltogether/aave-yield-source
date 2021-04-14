import { HardhatRuntimeEnvironment } from "hardhat/types"
import {ethers, deployments, getNamedAccounts, getChainId} from "hardhat"
import Erc20UpgradeableAbi from "../abis/ERC20Upgradeable.json"

import PoolWithMultipleWinnersBuilder from '@pooltogether/pooltogether-contracts/deployments/matic/PoolWithMultipleWinnersBuilder.json';
import RNGBlockhash from '@pooltogether/pooltogether-rng-contracts/deployments/matic_137/RNGBlockhash.json';
import ControlledToken from '@pooltogether/pooltogether-contracts/abis/ControlledToken.json';
import MultipleWinners from '@pooltogether/pooltogether-contracts/abis/MultipleWinners.json';
import YieldSourcePrizePool from '@pooltogether/pooltogether-contracts/abis/YieldSourcePrizePool.json';

import { BigNumber } from 'ethers';
import { dai } from '@studydefi/money-legos/erc20';
import { info, success } from './helpers';

interface DepositAsset {
  depositAssetName: string,
  depositAssetAddress: string,
  depositAmount: BigNumber,
  depositAssetAbi: any
}


async function createPrizePools(){
    console.log("running create prize pool script with chainId ", await getChainId())
    
    const { deployer } = await getNamedAccounts()
    
    console.log("deployer is ", deployer)
    const signer = await ethers.provider.getSigner(deployer)

    const allDeployments = await deployments.all()

    const aaveTokenAddress = "0x341d1f30e77D3FBfbD43D17183E2acb9dF25574E"

    console.log("balance of deployer ", await ethers.provider.getBalance(deployer))

    // minting mumbai AAVE
    const aaveTokenContract = await ethers.getContractAt(Erc20UpgradeableAbi, aaveTokenAddress, signer)
    // const mintResult = await aaveTokenContract.transfer(deployer, "100")

    // console.log(mintResult)


    // call for each deployed yield source
    console.log("running lifecycle for aAAVE")
    
    await poolLifecycle(signer, allDeployments.aAAVE.address,
      {depositAssetName: "AAVE",
      depositAssetAddress: aaveTokenAddress,
      depositAssetAbi: dai.abi,
      depositAmount: BigNumber.from(50)
    })

}
createPrizePools()



async function poolLifecycle(contractsOwner: any, aTokenYieldSourceAddress: string, depositArgs: DepositAsset){

  
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

  info(`Block number ${block.number}`);

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
    
  console.info(yieldSourceMultipleWinnersTx)

  await new Promise(r => setTimeout(r, 120000)); // sleep so that rpc provider has it

  console.log("calling getTranasctionReceipt with ", yieldSourceMultipleWinnersTx.hash)

  const yieldSourceMultipleWinnersReceipt = await getTransactionReceipt(
    yieldSourceMultipleWinnersTx.hash,
  );

  console.log("yieldSourceMultipleWinnersReceipt ", yieldSourceMultipleWinnersReceipt)

  const yieldSourcePrizePoolInitializedEvents = yieldSourceMultipleWinnersReceipt.logs.map(
    (log: any) => {
      try {
        return poolBuilder.interface.parseLog(log);
      } catch (e) {
        return null;
      }
    },
  );
  
  console.log("yieldSourcePrizePoolInitializedEvent ", yieldSourcePrizePoolInitializedEvents)

  const yieldSourcePrizePoolInitializedEvent = yieldSourcePrizePoolInitializedEvents.find((event:any) => 
  event && event.name === 'YieldSourcePrizePoolWithMultipleWinnersCreated');

  console.log("yieldSourcePrizePoolInitializedEvent ", yieldSourcePrizePoolInitializedEvent)


  console.log("yieldSourcePrizePoolInitializedEvent.args.prizePool ", yieldSourcePrizePoolInitializedEvent?.args.prizePool)
  const prizePool = await getContractAt(
    YieldSourcePrizePool,
    yieldSourcePrizePoolInitializedEvent?.args.prizePool,
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

  info(`Depositing ${depositAmount} ${depositAssetName} for ${contractsOwner._address}, ticket ${await prizeStrategy.ticket()}`);


  await prizePool.depositTo(
    contractsOwner._address,
    depositAmount,
    await prizeStrategy.ticket(),
    AddressZero,
  );

  success('Deposit Successful!');

  info(`Prize strategy owner: ${await prizeStrategy.owner()}`);

  

  info('Starting award...');
  await prizeStrategy.startAward();
  
  await new Promise(r => setTimeout(r, 60000)); // sleep so can completeAward
  
  info('Completing award...');
  const awardTx = await prizeStrategy.completeAward();

  await new Promise(r => setTimeout(r, 220000));
  const awardReceipt = await getTransactionReceipt(awardTx.hash);

  console.log("awardReceipt  ", awardReceipt)

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

  console.log("completeAwardLogs ", completeAwardLogs)

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
    contractsOwner._address,
    withdrawalAmount,
    ticket.address,
    earlyExitFee.exitFee,
  );


  await new Promise(r => setTimeout(r, 220000));
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