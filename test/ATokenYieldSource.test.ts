import debug from 'debug';

import { Signer } from '@ethersproject/abstract-signer';
import { BigNumber } from '@ethersproject/bignumber';
import { JsonRpcProvider } from '@ethersproject/providers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

import { expect } from 'chai';
import { ethers, waffle } from 'hardhat';

import {
  ATokenInterface as AToken,
  ATokenYieldSourceHarness,
  ATokenYieldSourceProxyFactory,
  IERC20Upgradeable as ERC20,
  ILendingPool as LendingPool,
  ILendingPoolAddressesProvider as LendingPoolAddressesProvider,
  ILendingPoolAddressesProviderRegistry as LendingPoolAddressesProviderRegistry,
} from '../types';

import ATokenInterface from '../abis/ATokenInterface.json';
import ILendingPool from '../abis/ILendingPool.json';
import ILendingPoolAddressesProvider from '../abis/ILendingPoolAddressesProvider.json';
import ILendingPoolAddressesProviderRegistry from '../abis/ILendingPoolAddressesProviderRegistry.json';
import SafeERC20WrapperUpgradeable from '../abis/SafeERC20WrapperUpgradeable.json';

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

  let erc20Token: ERC20;
  let underlyingToken: ERC20;

  // Numerical error tests for shares decreasing

  beforeEach(async () => {
    const { deployMockContract } = waffle;

    [contractsOwner, yieldSourceOwner, wallet2] = await ethers.getSigners();
    provider = waffle.provider;

    debug('mocking tokens...');
    erc20Token = ((await deployMockContract(
      contractsOwner,
      SafeERC20WrapperUpgradeable,
    )) as unknown) as ERC20;

    underlyingToken = ((await deployMockContract(
      contractsOwner,
      SafeERC20WrapperUpgradeable,
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

    debug('deploying ATokenYieldSourceProxyFactory...');

    const ATokenYieldSourceProxyFactory = await ethers.getContractFactory(
      'ATokenYieldSourceProxyFactoryHarness',
    );
    const hardhatATokenYieldSourceProxyFactory = (await ATokenYieldSourceProxyFactory.deploy()) as ATokenYieldSourceProxyFactory;

    const initializeTx = await hardhatATokenYieldSourceProxyFactory.create(
      aToken.address,
      lendingPoolAddressesProviderRegistry.address,
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

      expect(await aTokenYieldSource.callStatic.balanceOfToken(wallet2.address)).to.equal(
        toWei('500'),
      );
    });
  });

  describe('_tokenToShares()', () => {
    it('should return shares amount', async () => {
      await aTokenYieldSource.mint(yieldSourceOwner.address, toWei('100'));
      await aTokenYieldSource.mint(wallet2.address, toWei('100'));
      await aToken.mock.balanceOf.withArgs(aTokenYieldSource.address).returns(toWei('1000'));

      expect(await aTokenYieldSource.tokenToShares(toWei('10'))).to.equal(toWei('2'));
    });

    it('should return tokens if totalSupply is 0', async () => {
      expect(await aTokenYieldSource.tokenToShares(toWei('100'))).to.equal(toWei('100'));
    });

    it('should return shares even if aToken total supply has a lot of decimals', async () => {
      await aTokenYieldSource.mint(yieldSourceOwner.address, toWei('1'));
      await aToken.mock.balanceOf
        .withArgs(aTokenYieldSource.address)
        .returns(toWei('0.000000000000000005'));

      expect(await aTokenYieldSource.tokenToShares(toWei('0.000000000000000005'))).to.equal(toWei('1'));
    });

    it('should return shares even if aToken total supply increases', async () => {
      await aTokenYieldSource.mint(yieldSourceOwner.address, toWei('100'));
      await aTokenYieldSource.mint(wallet2.address, toWei('100'));
      await aToken.mock.balanceOf.withArgs(aTokenYieldSource.address).returns(toWei('100'));

      expect(await aTokenYieldSource.tokenToShares(toWei('1'))).to.equal(toWei('2'));

      await aToken.mock.balanceOf.withArgs(aTokenYieldSource.address).returns(ethers.utils.parseUnits('100', 36));
      expect(await aTokenYieldSource.tokenToShares(toWei('1'))).to.equal(2);
    });

    it('should fail to return shares if aToken total supply increases too much', async () => {
      await aTokenYieldSource.mint(yieldSourceOwner.address, toWei('100'));
      await aTokenYieldSource.mint(wallet2.address, toWei('100'));
      await aToken.mock.balanceOf.withArgs(aTokenYieldSource.address).returns(toWei('100'));

      expect(await aTokenYieldSource.tokenToShares(toWei('1'))).to.equal(toWei('2'));

      await aToken.mock.balanceOf.withArgs(aTokenYieldSource.address).returns(ethers.utils.parseUnits('100', 37));
      await expect(aTokenYieldSource.tokenToShares(toWei('1'))).to.be.revertedWith('ATokenYieldSource/shares-equal-zero');
    });
  });

  describe('_sharesToToken()', () => {
    it('should return tokens amount', async () => {
      await aTokenYieldSource.mint(yieldSourceOwner.address, toWei('100'));
      await aTokenYieldSource.mint(wallet2.address, toWei('100'));
      await aToken.mock.balanceOf.withArgs(aTokenYieldSource.address).returns(toWei('1000'));

      expect(await aTokenYieldSource.sharesToToken(toWei('2'))).to.equal(toWei('10'));
    });

    it('should return shares if totalSupply is 0', async () => {
      expect(await aTokenYieldSource.sharesToToken(toWei('100'))).to.equal(toWei('100'));
    });

    it('should return tokens even if totalSupply has a lot of decimals', async () => {
      await aTokenYieldSource.mint(yieldSourceOwner.address, toWei('0.000000000000000005'));
      await aToken.mock.balanceOf.withArgs(aTokenYieldSource.address).returns(toWei('100'));

      expect(await aTokenYieldSource.sharesToToken(toWei('0.000000000000000005'))).to.equal(toWei('100'));
    });

    it('should return tokens even if aToken total supply increases', async () => {
      await aTokenYieldSource.mint(yieldSourceOwner.address, toWei('100'));
      await aTokenYieldSource.mint(wallet2.address, toWei('100'));
      await aToken.mock.balanceOf.withArgs(aTokenYieldSource.address).returns(toWei('100'));

      expect(await aTokenYieldSource.sharesToToken(toWei('2'))).to.equal(toWei('1'));

      await aToken.mock.balanceOf.withArgs(aTokenYieldSource.address).returns(ethers.utils.parseUnits('100', 36));
      expect(await aTokenYieldSource.sharesToToken(2)).to.equal(toWei('1'));
    });
  });

  const supplyTokenTo = async (user: SignerWithAddress, userAmount: BigNumber) => {
    const lendingPoolAddress = await lendingPoolAddressesProvider.getLendingPool();
    const tokenAddress = await aTokenYieldSource.tokenAddress();
    const userAddress = user.address;

    await underlyingToken.mock.balanceOf.withArgs(yieldSourceOwner.address).returns(toWei('200'));
    await aToken.mock.balanceOf.withArgs(aTokenYieldSource.address).returns(toWei('300'));
    await underlyingToken.mock.transferFrom
      .withArgs(userAddress, aTokenYieldSource.address, userAmount)
      .returns(true);
    await underlyingToken.mock.allowance
      .withArgs(aTokenYieldSource.address, lendingPoolAddress)
      .returns(toWei('0'));
    await underlyingToken.mock.approve.withArgs(lendingPoolAddress, userAmount).returns(true);
    await lendingPool.mock.deposit
      .withArgs(tokenAddress, userAmount, aTokenYieldSource.address, 188)
      .returns();
    await aTokenYieldSource.connect(user).supplyTokenTo(userAmount, userAddress);
  };

  describe('supplyTokenTo()', () => {
    let amount: BigNumber;
    let lendingPoolAddress: any;
    let tokenAddress: any;

    beforeEach(async () => {
      amount = toWei('100');
      lendingPoolAddress = await lendingPoolAddressesProvider.getLendingPool();
      tokenAddress = await aTokenYieldSource.tokenAddress();
    });

    it('should supply assets if totalSupply is 0', async () => {
      await supplyTokenTo(yieldSourceOwner, amount);
      expect(await aTokenYieldSource.totalSupply()).to.equal(amount);
    });

    it('should supply assets if totalSupply is not 0', async () => {
      await aTokenYieldSource.mint(yieldSourceOwner.address, toWei('100'));
      await aTokenYieldSource.mint(wallet2.address, toWei('100'));
      await supplyTokenTo(yieldSourceOwner, amount);
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

      const balanceAfter = await aToken.balanceOf(aTokenYieldSource.address);
      const balanceDiff = yieldSourceOwnerBalance.sub(balanceAfter);

      await underlyingToken.mock.transfer
        .withArgs(yieldSourceOwner.address, balanceDiff)
        .returns(true);

      await aTokenYieldSource.connect(yieldSourceOwner).redeemToken(redeemAmount);

      expect(await aTokenYieldSource.callStatic.balanceOf(yieldSourceOwner.address)).to.equal(
        yieldSourceOwnerBalance.sub(redeemAmount),
      );
    });

    it('should not be able to redeem assets if balance is 0', async () => {
      await expect(
        aTokenYieldSource.connect(yieldSourceOwner).redeemToken(redeemAmount),
      ).to.be.revertedWith('ERC20: burn amount exceeds balance');
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

  describe('transferERC20()', () => {
    it('should transferERC20 if yieldSourceOwner', async () => {
      const transferAmount = toWei('10');

      await erc20Token.mock.transfer.withArgs(wallet2.address, transferAmount).returns(true);

      await aTokenYieldSource
        .connect(yieldSourceOwner)
        .transferERC20(erc20Token.address, wallet2.address, transferAmount);
    });

    it('should transferERC20 if assetManager', async () => {
      const transferAmount = toWei('10');

      await erc20Token.mock.transfer
        .withArgs(yieldSourceOwner.address, transferAmount)
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
      const wallet2Amount = toWei('100');
      await aTokenYieldSource.mint(wallet2.address, wallet2Amount);

      await underlyingToken.mock.transferFrom
        .withArgs(yieldSourceOwner.address, aTokenYieldSource.address, amount)
        .returns(true);
      await underlyingToken.mock.allowance
        .withArgs(aTokenYieldSource.address, lendingPoolAddress)
        .returns(toWei('0'));
      await underlyingToken.mock.approve.withArgs(lendingPoolAddress, amount).returns(true);
      await lendingPool.mock.deposit
        .withArgs(tokenAddress, amount, aTokenYieldSource.address, 188)
        .returns();

      await aTokenYieldSource.connect(yieldSourceOwner).sponsor(amount);
      await aToken.mock.balanceOf
        .withArgs(aTokenYieldSource.address)
        .returns(amount.add(wallet2Amount));
      expect(await aTokenYieldSource.callStatic.balanceOfToken(wallet2.address)).to.equal(
        amount.add(wallet2Amount),
      );
    });

    it('should revert on error', async () => {
      await underlyingToken.mock.transferFrom
        .withArgs(yieldSourceOwner.address, aTokenYieldSource.address, amount)
        .returns(true);
      await underlyingToken.mock.allowance
        .withArgs(aTokenYieldSource.address, lendingPoolAddress)
        .returns(toWei('0'));
      await underlyingToken.mock.approve.withArgs(lendingPoolAddress, amount).returns(true);
      await lendingPool.mock.deposit
        .withArgs(tokenAddress, amount, aTokenYieldSource.address, 188)
        .reverts();

      await expect(aTokenYieldSource.connect(yieldSourceOwner).sponsor(amount)).to.be.revertedWith(
        '',
      );
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
});
function toHex(arg0: number) {
  throw new Error('Function not implemented.');
}
