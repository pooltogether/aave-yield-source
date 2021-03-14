import debug from 'debug';

import { Signer } from '@ethersproject/abstract-signer';
import { BigNumber } from '@ethersproject/bignumber';
import { JsonRpcProvider } from '@ethersproject/providers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

import { expect } from 'chai';
import { ethers, waffle } from 'hardhat';

import { ATokenInterface as AToken } from '../types';
import { ATokenYieldSource } from '../types';
import { ATokenYieldSourceProxyFactory } from '../types';
import { IERC20Upgradeable as ERC20 } from '../types';
import { ILendingPool as LendingPool } from '../types';
import { ILendingPoolAddressesProvider as LendingPoolAddressesProvider } from '../types';
import { ILendingPoolAddressesProviderRegistry as LendingPoolAddressesProviderRegistry } from '../types';
import { IReserve as Reserve } from '../types/IReserve.d';

import ATokenInterface from '../abis/ATokenInterface.json';
import ILendingPool from '../abis/ILendingPool.json';
import ILendingPoolAddressesProvider from '../abis/ILendingPoolAddressesProvider.json';
import ILendingPoolAddressesProviderRegistry from '../abis/ILendingPoolAddressesProviderRegistry.json';

import IERC20Upgradeable from '../abis/IERC20Upgradeable.json';
import IReserve from '../abis/IReserve.json';

const toWei = ethers.utils.parseEther;

describe('ATokenYieldSource', () => {
  let contractsOwner: Signer;
  let yieldSourceOwner: SignerWithAddress;
  let wallet2: SignerWithAddress;
  let provider: JsonRpcProvider;

  let aToken: AToken;
  let lendingPool: LendingPool;
  let lendingPoolAddressesProvider: LendingPoolAddressesProvider;
  let lendingPoolAddressesProviderRegistry: LendingPoolAddressesProviderRegistry;

  let aTokenYieldSource: ATokenYieldSource;
  let reserve: Reserve;

  let erc20token: ERC20;

  beforeEach(async () => {
    const { deployMockContract } = waffle;

    [contractsOwner, yieldSourceOwner, wallet2] = await ethers.getSigners();
    provider = waffle.provider;

    debug('mocking tokens...');
    erc20token = ((await deployMockContract(
      contractsOwner,
      IERC20Upgradeable,
    )) as unknown) as ERC20;

    aToken = ((await deployMockContract(contractsOwner, ATokenInterface)) as unknown) as AToken;
    await aToken.mock.UNDERLYING_ASSET_ADDRESS.returns(erc20token.address);

    debug('mocking contracts...');
    lendingPool = ((await deployMockContract(
      contractsOwner,
      ILendingPool,
    )) as unknown) as LendingPool;

    lendingPoolAddressesProvider = ((await deployMockContract(
      contractsOwner,
      ILendingPoolAddressesProvider,
    )) as unknown) as LendingPoolAddressesProvider;

    lendingPoolAddressesProviderRegistry = ((await deployMockContract(
      contractsOwner,
      ILendingPoolAddressesProviderRegistry,
    )) as unknown) as LendingPoolAddressesProviderRegistry;

    await lendingPoolAddressesProvider.mock.getLendingPool.returns(lendingPool.address);
    await lendingPoolAddressesProviderRegistry.mock.getAddressesProvidersList.returns([
      lendingPoolAddressesProvider.address,
      '0x67FB118A780fD740C8936511947cC4bE7bb7730c',
    ]);

    reserve = ((await deployMockContract(contractsOwner, IReserve)) as unknown) as Reserve;

    debug('deploying ATokenYieldSourceProxyFactory...');

    const ATokenYieldSourceProxyFactory = await ethers.getContractFactory(
      'ATokenYieldSourceProxyFactoryHarness',
    );
    const hardhatATokenYieldSourceProxyFactory = (await ATokenYieldSourceProxyFactory.deploy()) as ATokenYieldSourceProxyFactory;

    const initializeTx = await hardhatATokenYieldSourceProxyFactory.create(
      aToken.address,
      lendingPoolAddressesProviderRegistry.address,
      reserve.address,
      yieldSourceOwner.address,
    );

    const receipt = await provider.getTransactionReceipt(initializeTx.hash);
    const proxyCreatedEvent = hardhatATokenYieldSourceProxyFactory.interface.parseLog(
      receipt.logs[0],
    );

    expect(proxyCreatedEvent.name).to.equal('ProxyCreated');

    aTokenYieldSource = (await ethers.getContractAt(
      'ATokenYieldSourceHarness',
      proxyCreatedEvent.args.proxy,
      contractsOwner,
    )) as ATokenYieldSource;
  });

  describe('create()', () => {
    it('should create ATokenYieldSource', async () => {
      expect(await aTokenYieldSource.aToken()).to.equal(aToken.address);
      expect(await aTokenYieldSource.lendingPoolAddressesProviderRegistry()).to.equal(
        lendingPoolAddressesProviderRegistry.address,
      );
      expect(await aTokenYieldSource.reserve()).to.equal(reserve.address);
      expect(await aTokenYieldSource.owner()).to.equal(yieldSourceOwner.address);
    });
  });

  describe('token()', () => {
    it('should return the underlying token', async () => {
      expect(await aTokenYieldSource.token()).to.equal(erc20token.address);
    });
  });

  describe('balanceOf()', () => {
    it('should return the underlying balance', async () => {
      const balance = toWei('32');

      await aToken.mock.balanceOf.withArgs(yieldSourceOwner.address).returns(balance);
      expect(await aTokenYieldSource.callStatic.balanceOf(yieldSourceOwner.address)).to.equal(
        balance,
      );
    });
  });

  describe('supplyTo()', () => {
    let amount: BigNumber;
    let lendingPoolAddress: any;
    let tokenAddress: any;

    beforeEach(async () => {
      amount = toWei('500');
      lendingPoolAddress = await lendingPoolAddressesProvider.getLendingPool();
      tokenAddress = await aTokenYieldSource.tokenAddress();
    });

    it('should supply assets to Aave', async () => {
      await erc20token.mock.approve.withArgs(lendingPoolAddress, amount).returns(true);
      await lendingPool.mock.deposit
        .withArgs(tokenAddress, amount, aTokenYieldSource.address, 188)
        .returns();

      await aTokenYieldSource.supplyTo(amount, aTokenYieldSource.address);
    });

    it('should revert on error', async () => {
      await erc20token.mock.approve.withArgs(lendingPoolAddress, amount).returns(true);
      await lendingPool.mock.deposit
        .withArgs(tokenAddress, amount, aTokenYieldSource.address, 188)
        .reverts();

      await expect(
        aTokenYieldSource.supplyTo(amount, aTokenYieldSource.address),
      ).to.be.revertedWith('');
    });
  });

  describe('redeem()', () => {
    let amount: BigNumber;
    let redeemAmount: BigNumber;

    beforeEach(async () => {
      amount = toWei('300');
      redeemAmount = toWei('100');
    });

    it('should redeem assets from Aave', async () => {
      await aToken.mock.balanceOf.withArgs(aTokenYieldSource.address).returns(amount);
      await lendingPool.mock.withdraw
        .withArgs(erc20token.address, redeemAmount, aTokenYieldSource.address)
        .returns(redeemAmount);
      await aTokenYieldSource.redeem(redeemAmount);
    });

    it('should revert on error', async () => {
      await aToken.mock.balanceOf.withArgs(aTokenYieldSource.address).returns(amount);
      await lendingPool.mock.withdraw
        .withArgs(erc20token.address, redeemAmount, aTokenYieldSource.address)
        .reverts();

      await expect(aTokenYieldSource.redeem(redeemAmount)).to.be.revertedWith('');
    });
  });

  describe('_lendingPoolProvider()', () => {
    it('should return Aave LendingPoolAddressesProvider address', async () => {
      const lendingPoolAddressesProviderList = await lendingPoolAddressesProviderRegistry.getAddressesProvidersList();

      expect(await aTokenYieldSource.connect(yieldSourceOwner).lendingPoolProvider()).to.equal(
        lendingPoolAddressesProviderList[0],
      );
    });
  });

  describe('_lendingPool()', () => {
    it('should return Aave LendingPool address', async () => {
      expect(await aTokenYieldSource.connect(yieldSourceOwner).lendingPool()).to.equal(
        lendingPool.address,
      );
    });
  });

  describe('setReserve()', () => {
    it('should setReserve if yieldSourceOwner', async () => {
      await aTokenYieldSource.connect(yieldSourceOwner).setReserve(reserve.address);

      expect(await aTokenYieldSource.reserve()).to.equal(reserve.address);
    });

    it('should fail to setReserve if not yieldSourceOwner', async () => {
      await expect(
        aTokenYieldSource.connect(wallet2).setReserve(reserve.address),
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });
  });

  describe('transferReserve()', () => {
    it('should transferReserve if yieldSourceOwner', async () => {
      await reserve.mock.withdrawReserve
        .withArgs(aTokenYieldSource.address, wallet2.address)
        .returns(toWei('10'));

      await aTokenYieldSource.connect(yieldSourceOwner).transferReserve(wallet2.address);
    });

    it('should transferReserve if assetManager', async () => {
      await reserve.mock.withdrawReserve
        .withArgs(aTokenYieldSource.address, yieldSourceOwner.address)
        .returns(toWei('10'));

      await aTokenYieldSource.connect(yieldSourceOwner).setAssetManager(wallet2.address);

      await aTokenYieldSource.connect(wallet2).transferReserve(yieldSourceOwner.address);
    });

    it('should fail to transferReserve if not yieldSourceOwner or assetManager', async () => {
      await expect(
        aTokenYieldSource.connect(wallet2).transferReserve(yieldSourceOwner.address),
      ).to.be.revertedWith('OwnerOrAssetManager: caller is not owner or asset manager');
    });
  });

  describe('transferERC20()', () => {
    it('should transferERC20 if yieldSourceOwner', async () => {
      const transferAmount = toWei('10');

      await erc20token.mock.transferFrom
        .withArgs(aTokenYieldSource.address, wallet2.address, transferAmount)
        .returns(true);

      await aTokenYieldSource
        .connect(yieldSourceOwner)
        .transferERC20(erc20token.address, wallet2.address, transferAmount);
    });

    it('should transferERC20 if assetManager', async () => {
      const transferAmount = toWei('10');

      await erc20token.mock.transferFrom
        .withArgs(aTokenYieldSource.address, yieldSourceOwner.address, transferAmount)
        .returns(true);

      await aTokenYieldSource.connect(yieldSourceOwner).setAssetManager(wallet2.address);

      await aTokenYieldSource
        .connect(wallet2)
        .transferERC20(erc20token.address, yieldSourceOwner.address, transferAmount);
    });

    it('should not allow to transfer aToken', async () => {
      await expect(
        aTokenYieldSource
          .connect(yieldSourceOwner)
          .transferERC20(aToken.address, wallet2.address, toWei('10')),
      ).to.be.revertedWith('ATokenYieldSource/aToken-transfer-not-allowed');
    });

    it('should fail to transferERC20 if not yieldSourceOwner or assetManager', async () => {
      await expect(
        aTokenYieldSource
          .connect(wallet2)
          .transferERC20(erc20token.address, yieldSourceOwner.address, toWei('10')),
      ).to.be.revertedWith('OwnerOrAssetManager: caller is not owner or asset manager');
    });
  });

  describe('sponsor()', () => {
    let amount: BigNumber;
    let lendingPoolAddress: any;
    let tokenAddress: any;

    beforeEach(async () => {
      amount = toWei('500');
      lendingPoolAddress = await lendingPoolAddressesProvider.getLendingPool();
      tokenAddress = await aTokenYieldSource.tokenAddress();
    });

    it('should sponsor Yield Source', async () => {
      await erc20token.mock.approve.withArgs(lendingPoolAddress, amount).returns(true);
      await lendingPool.mock.deposit
        .withArgs(tokenAddress, amount, aTokenYieldSource.address, 188)
        .returns();

      await aTokenYieldSource.sponsor(amount);
    });

    it('should revert on error', async () => {
      await erc20token.mock.approve.withArgs(lendingPoolAddress, amount).returns(true);
      await lendingPool.mock.deposit
        .withArgs(tokenAddress, amount, aTokenYieldSource.address, 188)
        .reverts();

      await expect(aTokenYieldSource.sponsor(amount)).to.be.revertedWith('');
    });
  });
});
