import PoolWithMultipleWinnersBuilder from '@pooltogether/pooltogether-contracts/deployments/mainnet/PoolWithMultipleWinnersBuilder.json';
import RNGBlockhash from '@pooltogether/pooltogether-rng-contracts/deployments/mainnet/RNGBlockhash.json';
import ControlledToken from '@pooltogether/pooltogether-contracts/abis/ControlledToken.json';
import MultipleWinners from '@pooltogether/pooltogether-contracts/abis/MultipleWinners.json';
import YieldSourcePrizePool from '@pooltogether/pooltogether-contracts/abis/YieldSourcePrizePool.json';
import { dai, usdc } from '@studydefi/money-legos/erc20';

import { task } from 'hardhat/config';

import {
  ADAI_ADDRESS_MAINNET,
  LENDING_POOL_ADDRESSES_PROVIDER_REGISTRY_ADDRESS_MAINNET,
} from '../../Constant';

import { info, success } from '../helpers';

export default task('fork:create-aave-prize-pool', 'Create Aave Prize Pool').setAction(
  async (taskArguments, hre) => {
    const { ethers } = hre;
    const { constants, provider, getContractAt, getContractFactory, getSigners, utils } = ethers;
    const [contractsOwner, yieldSourceOwner] = await getSigners();
    const { AddressZero } = constants;
    const { getBlock, getBlockNumber, getTransactionReceipt, send } = provider;
    const { formatEther, parseEther: toWei } = utils;

    async function increaseTime(time: number) {
      await send('evm_increaseTime', [time]);
      await send('evm_mine', []);
    }
    console.log("contractsOwner address ", contractsOwner.address)
    console.log("balance of contractsOwner ", (await provider.getBalance(contractsOwner.address)).toString())

    // info('Deploying ATokenYieldSourceProxyFactory...');

    // const ATokenYieldSourceProxyFactory = await getContractFactory('ATokenYieldSourceProxyFactory');

    // const hardhatATokenYieldSourceProxyFactory = (await ATokenYieldSourceProxyFactory.deploy());

    // const aTokenYieldSourceProxyFactoryTx = await hardhatATokenYieldSourceProxyFactory.create(
    //   ADAI_ADDRESS_MAINNET,
    //   LENDING_POOL_ADDRESSES_PROVIDER_REGISTRY_ADDRESS_MAINNET,
    //   yieldSourceOwner.address,
    // );

    // const aTokenYieldSourceProxyFactoryReceipt = await getTransactionReceipt(
    //   aTokenYieldSourceProxyFactoryTx.hash,
    // );
    // const proxyCreatedEvent = hardhatATokenYieldSourceProxyFactory.interface.parseLog(
    //   aTokenYieldSourceProxyFactoryReceipt.logs[0],
    // );

    const aTokenYieldSource = (await getContractAt(
      'ATokenYieldSource',
      "0x2bA1e000a381aD42af10C6e33aFe5994eE878D72",
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
    await prizeStrategy.addExternalErc20Award(usdc.address);

    const daiAmount = toWei('1000');
    const daiContract = await getContractAt(dai.abi, dai.address, contractsOwner);
    await daiContract.approve(prizePool.address, daiAmount);

    info(`Depositing ${formatEther(daiAmount)} Dai...`);

    console.log("contractsOwner address ", contractsOwner.address)
    console.log("balance of contractsOwner ", (await provider.getBalance(contractsOwner.address)).toString())
    console.log("prizepool address ", prizePool.address)
    console.log("prizestrat address ", prizeStrategy.address)
    console.log("ticket ", await prizeStrategy.ticket())

    // console.log((await provider.getGasPrice()).toString())

    await prizePool.depositTo(
      contractsOwner.address,
      daiAmount,
      await prizeStrategy.ticket(),
      AddressZero,
    );

    success('Deposited Dai!');

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

    const awarded = awardLogs.find((event) => event && event.name === 'Awarded');

    success(`Awarded ${formatEther(awarded?.args?.amount)} Dai!`);

    info('Withdrawing...');
    const ticketAddress = await prizeStrategy.ticket();
    const ticket = await getContractAt(ControlledToken, ticketAddress, contractsOwner);
    const withdrawalAmount = toWei('100');
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
    success(`Withdrawn ${formatEther(withdrawn?.args?.redeemed)} Dai!`);
    success(`Exit fee was ${formatEther(withdrawn?.args?.exitFee)} Dai`);

    await prizePool.captureAwardBalance();
    const awardBalance = await prizePool.callStatic.awardBalance();
    success(`Current awardable balance is ${formatEther(awardBalance)} Dai`);
  },
);
