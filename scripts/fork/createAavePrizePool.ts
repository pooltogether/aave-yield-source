import PoolWithMultipleWinnersBuilder from '@pooltogether/pooltogether-contracts/deployments/mainnet/PoolWithMultipleWinnersBuilder.json';
import RNGBlockhash from '@pooltogether/pooltogether-rng-contracts/deployments/mainnet/RNGBlockhash.json';
import ControlledToken from '@pooltogether/pooltogether-contracts/abis/ControlledToken.json';
import MultipleWinners from '@pooltogether/pooltogether-contracts/abis/MultipleWinners.json';
import YieldSourcePrizePool from '@pooltogether/pooltogether-contracts/abis/YieldSourcePrizePool.json';
import { dai } from '@studydefi/money-legos/erc20';

import { task } from 'hardhat/config';

import {BUSD_ADDRESS, GUSD_ADDRESS, SUSD_ADDRESS} from "../../Constant"

import { info, success } from '../helpers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { BigNumber } from 'ethers';

export default task('fork:create-aave-prize-pool', 'Create Aave Prize Pool').setAction(
  async (taskArguments, hre) => {
    const { ethers, deployments } = hre;
    const { getSigners} = ethers;

    const [contractsOwner] = await getSigners();

    const allDeployments = await deployments.all()

    // call for each deployed yield source

    info("running prize pool lifecycle for GUSD")
    await poolLifecycle(hre, contractsOwner, allDeployments.aGUSD.address,
      {
        depositAssetName: "GUSD",
        depositAssetAddress: GUSD_ADDRESS,
        depositAssetAbi: dai.abi,
        depositAmount: BigNumber.from(50)
      })


    info("running prize pool lifecycle for BUSD")
    await poolLifecycle(hre, contractsOwner, allDeployments.aBUSD.address,
      {
        depositAssetName: "BUSD",
        depositAssetAddress: BUSD_ADDRESS,
        depositAssetAbi: dai.abi,
        depositAmount: BigNumber.from(50)
      })

    info("running prize pool lifecycle for sUSD")
    await poolLifecycle(hre, contractsOwner, allDeployments.aSUSD.address,
      {
        depositAssetName: "sUSD",
        depositAssetAddress: SUSD_ADDRESS,
        depositAssetAbi: dai.abi,
        depositAmount: BigNumber.from(50)
      })

  },
);

interface DepositAsset {
  depositAssetName: string,
  depositAssetAddress: string,
  depositAmount: BigNumber,
  depositAssetAbi: any
}


async function poolLifecycle(hre :HardhatRuntimeEnvironment, contractsOwner: SignerWithAddress, aTokenYieldSourceAddress: string, depositArgs: DepositAsset){

  const { ethers } = hre;
  
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
    (log) => {
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

  const awardLogs = awardReceipt.logs.map((log) => {
    try {
      return prizePool.interface.parseLog(log);
    } catch (e) {
      return null;
    }
  });

  const completeAwardLogs = awardReceipt.logs.map((log) => {
    try {
      return prizeStrategy.interface.parseLog(log);
    } catch (e) {
      return null;
    }
  });

  const awarded = awardLogs.find((event) => event && event.name === 'Awarded');

  // some of the prize pools will complete successfully and not emit the Awarded event
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
  const withdrawLogs = withdrawReceipt.logs.map((log) => {
    try {
      return prizePool.interface.parseLog(log);
    } catch (e) {
      return null;
    }
  });

  const withdrawn = withdrawLogs.find((event) => event && event.name === 'InstantWithdrawal');
  success(`Withdrawn ${withdrawn?.args?.redeemed} ${depositAssetName}!`);
  success(`Exit fee was ${withdrawn?.args?.exitFee} ${depositAssetName}`);

  await prizePool.captureAwardBalance();
  const awardBalance = await prizePool.callStatic.awardBalance();
  success(`Current awardable balance is ${awardBalance} ${depositAssetName}`);
}