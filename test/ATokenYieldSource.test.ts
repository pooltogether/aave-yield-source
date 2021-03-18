import debug from 'debug';

import { Signer } from '@ethersproject/abstract-signer';
import { BigNumber } from '@ethersproject/bignumber';
import { JsonRpcProvider } from '@ethersproject/providers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

import { expect } from 'chai';
import { ethers, waffle } from 'hardhat';

import { ATokenInterface as AToken } from '../types';
import { ATokenYieldSourceHarness } from '../types';
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

  let aTokenYieldSource: ATokenYieldSourceHarness;
  let reserve: Reserve;

  let erc20Token: ERC20;
  let underlyingToken: ERC20;

  beforeEach(async () => {
    const { deployMockContract } = waffle;

    [contractsOwner, yieldSourceOwner, wallet2] = await ethers.getSigners();
    provider = waffle.provider;

    debug('mocking tokens...');
    erc20Token = ((await deployMockContract(
      contractsOwner,
      IERC20Upgradeable,
    )) as unknown) as ERC20;

    underlyingToken = ((await deployMockContract(
      contractsOwner,
      IERC20Upgradeable,
    )) as unknown) as ERC20;

    aToken = ((await deployMockContract(contractsOwner, ATokenInterface)) as unknown) as AToken;
    await aToken.mock.UNDERLYING_ASSET_ADDRESS.returns(underlyingToken.address);

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
    )) as ATokenYieldSourceHarness;
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

  describe('depositToken()', () => {
    it('should return the underlying token', async () => {
      expect(await aTokenYieldSource.depositToken()).to.equal(underlyingToken.address);
    });
  });

  describe('balanceOfToken()', () => {
    it('should return user balance', async () => {
      await aTokenYieldSource.mint(yieldSourceOwner.address, toWei('100'));
      await aTokenYieldSource.mint(wallet2.address, toWei('100'));
      await aToken.mock.balanceOf.withArgs(aTokenYieldSource.address).returns(toWei('1000'));

      expect(await aTokenYieldSource.balanceOfToken(wallet2.address)).to.equal(toWei('500'));
    });
  });

  describe('_tokenToShares()', () => {
    it('should return shares amount', async () => {
      await aTokenYieldSource.mint(yieldSourceOwner.address, toWei('100'));
      await aTokenYieldSource.mint(wallet2.address, toWei('100'));
      await aToken.mock.balanceOf.withArgs(aTokenYieldSource.address).returns(toWei('1000'));

      expect(await aTokenYieldSource.tokenToShares(toWei('10'))).to.equal(toWei('2'));
    });
  });

  describe('_sharesToToken()', () => {
    it('should return tokens amount', async () => {
      await aTokenYieldSource.mint(yieldSourceOwner.address, toWei('100'));
      await aTokenYieldSource.mint(wallet2.address, toWei('100'));
      await aToken.mock.balanceOf.withArgs(aTokenYieldSource.address).returns(toWei('1000'));

      expect(await aTokenYieldSource.sharesToToken(toWei('2'))).to.equal(toWei('10'));
    });
  });

  describe('supplyTokenTo()', () => {
    let amount: BigNumber;
    let yieldSourceBalance: BigNumber;
    let lendingPoolAddress: any;
    let tokenAddress: any;

    const supplyTokenTo = async (userAddress: SignerWithAddress['address'], userBalance: BigNumber) => {
      const lendingPoolAddress = await lendingPoolAddressesProvider.getLendingPool();
      const tokenAddress = await aTokenYieldSource.tokenAddress();

      await underlyingToken.mock.balanceOf.withArgs(yieldSourceOwner.address).returns(toWei('200'));
      await aToken.mock.balanceOf.withArgs(aTokenYieldSource.address).returns(toWei('300'));
      await underlyingToken.mock.approve.withArgs(lendingPoolAddress, userBalance).returns(true);
      await lendingPool.mock.deposit
        .withArgs(tokenAddress, userBalance, aTokenYieldSource.address, 188)
        .returns();
      await aTokenYieldSource.supplyTokenTo(userBalance, userAddress);
    };

    beforeEach(async () => {
      amount = toWei('100');
      yieldSourceBalance = toWei('100');
      lendingPoolAddress = await lendingPoolAddressesProvider.getLendingPool();
      tokenAddress = await aTokenYieldSource.tokenAddress();
    });

    it('should supply assets if totalSupply is 0', async () => {
      await supplyTokenTo(yieldSourceOwner.address, amount);
      expect(await aTokenYieldSource.totalSupply()).to.equal(amount);
    });

    it('should supply assets if totalSupply is not 0', async () => {
      await aTokenYieldSource.mint(yieldSourceOwner.address, toWei('100'));
      await aTokenYieldSource.mint(wallet2.address, toWei('100'));
      await supplyTokenTo(yieldSourceOwner.address, amount);
    });

    it('should revert on error', async () => {
      await underlyingToken.mock.approve.withArgs(lendingPoolAddress, amount).returns(true);
      await lendingPool.mock.deposit
        .withArgs(tokenAddress, amount, aTokenYieldSource.address, 188)
        .reverts();

      await expect(
        aTokenYieldSource.supplyTokenTo(amount, aTokenYieldSource.address),
      ).to.be.revertedWith('');
    });
  });

  describe('redeemToken()', () => {
    let yieldSourceOwnerBalance: BigNumber;
    let redeemAmount: BigNumber;

    beforeEach(() => {
      yieldSourceOwnerBalance = toWei('300');
      redeemAmount = toWei('100');
    });

    it('should redeem assets', async () => {
      await aTokenYieldSource.mint(yieldSourceOwner.address, yieldSourceOwnerBalance);
      await aToken.mock.balanceOf
        .withArgs(aTokenYieldSource.address)
        .returns(yieldSourceOwnerBalance);
      await lendingPool.mock.withdraw
        .withArgs(underlyingToken.address, redeemAmount, aTokenYieldSource.address)
        .returns(redeemAmount);

      await aTokenYieldSource.connect(yieldSourceOwner).redeemToken(redeemAmount);

      expect(await aTokenYieldSource.callStatic.balanceOf(yieldSourceOwner.address)).to.equal(
        yieldSourceOwnerBalance.sub(redeemAmount),
      );
    });

    it('should not be able to redeem assets if balance is 0', async () => {
      await expect(
        aTokenYieldSource.connect(yieldSourceOwner).redeemToken(redeemAmount),
      ).to.be.revertedWith('ATokenYieldSource/shares-not-zero');
    });

    it('should fail to redeem if amount superior to balance', async () => {
      const yieldSourceOwnerLowBalance = toWei('10');

      await aTokenYieldSource.mint(yieldSourceOwner.address, yieldSourceOwnerLowBalance);
      await aToken.mock.balanceOf
        .withArgs(aTokenYieldSource.address)
        .returns(yieldSourceOwnerLowBalance);
      await lendingPool.mock.withdraw
        .withArgs(underlyingToken.address, redeemAmount, aTokenYieldSource.address)
        .returns(redeemAmount);

      await expect(
        aTokenYieldSource.connect(yieldSourceOwner).redeemToken(redeemAmount),
      ).to.be.revertedWith('ERC20: burn amount exceeds balance');
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
    beforeEach(async () => {
      await aTokenYieldSource.mint(yieldSourceOwner.address, toWei('20'));
    });

    it('should transferReserve if yieldSourceOwner', async () => {
      await reserve.mock.reserveRateMantissa.returns(toWei('0.5'));
      await underlyingToken.mock.transferFrom.withArgs(aTokenYieldSource.address, wallet2.address, toWei('10')).returns(true)
      await aTokenYieldSource.connect(yieldSourceOwner).transferReserve(wallet2.address);
    });

    it('should transferReserve if assetManager', async () => {
      await reserve.mock.reserveRateMantissa.returns(toWei('0.5'));
      await underlyingToken.mock.transferFrom
        .withArgs(aTokenYieldSource.address, yieldSourceOwner.address, toWei('10'))
        .returns(true);

      await aTokenYieldSource.connect(yieldSourceOwner).setAssetManager(wallet2.address);
      await aTokenYieldSource.connect(wallet2).transferReserve(yieldSourceOwner.address);
    });

    it('should fail to transferReserve if not yieldSourceOwner or assetManager', async () => {
      await expect(
        aTokenYieldSource.connect(wallet2).transferReserve(yieldSourceOwner.address),
      ).to.be.revertedWith('OwnerOrAssetManager: caller is not owner or asset manager');
    });

    it('should fail to transferReserve if reserveRateMantissa equals 0', async () => {
      await reserve.mock.reserveRateMantissa.returns(toWei('0'));
      await expect(
        aTokenYieldSource.connect(yieldSourceOwner).transferReserve(yieldSourceOwner.address),
      ).to.be.revertedWith('ATokenYieldSource/reserveRateMantissa-not-zero');
    });
  });

  describe('transferERC20()', () => {
    it('should transferERC20 if yieldSourceOwner', async () => {
      const transferAmount = toWei('10');

      await erc20Token.mock.transferFrom
        .withArgs(aTokenYieldSource.address, wallet2.address, transferAmount)
        .returns(true);

      await aTokenYieldSource
        .connect(yieldSourceOwner)
        .transferERC20(erc20Token.address, wallet2.address, transferAmount);
    });

    it('should transferERC20 if assetManager', async () => {
      const transferAmount = toWei('10');

      await erc20Token.mock.transferFrom
        .withArgs(aTokenYieldSource.address, yieldSourceOwner.address, transferAmount)
        .returns(true);

      await aTokenYieldSource.connect(yieldSourceOwner).setAssetManager(wallet2.address);

      await aTokenYieldSource
        .connect(wallet2)
        .transferERC20(erc20Token.address, yieldSourceOwner.address, transferAmount);
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
          .transferERC20(erc20Token.address, yieldSourceOwner.address, toWei('10')),
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
      await underlyingToken.mock.approve.withArgs(lendingPoolAddress, amount).returns(true);
      await lendingPool.mock.deposit
        .withArgs(tokenAddress, amount, aTokenYieldSource.address, 188)
        .returns();

      await aTokenYieldSource.sponsor(amount);
    });

    it('should revert on error', async () => {
      await underlyingToken.mock.approve.withArgs(lendingPoolAddress, amount).returns(true);
      await lendingPool.mock.deposit
        .withArgs(tokenAddress, amount, aTokenYieldSource.address, 188)
        .reverts();

      await expect(aTokenYieldSource.sponsor(amount)).to.be.revertedWith('');
    });
  });
});
