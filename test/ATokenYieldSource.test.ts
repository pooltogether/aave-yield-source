import debug from 'debug';

import { Signer } from '@ethersproject/abstract-signer';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

import { expect } from 'chai';
import { BigNumber } from 'ethers';
import { MockContract } from 'ethereum-waffle';
import { ethers, waffle } from 'hardhat';

import { ATokenYieldSourceHarness, ERC20Mintable } from '../types';

import ATokenInterface from '../abis/ATokenInterface.json';
import IAaveIncentivesController from '../abis/IAaveIncentivesController.json';
import ILendingPool from '../abis/ILendingPool.json';
import ILendingPoolAddressesProvider from '../abis/ILendingPoolAddressesProvider.json';
import ILendingPoolAddressesProviderRegistry from '../abis/ILendingPoolAddressesProviderRegistry.json';
import SafeERC20WrapperUpgradeable from '../abis/SafeERC20WrapperUpgradeable.json';

const { constants, getContractFactory, getSigners, utils } = ethers;
const { AddressZero, MaxUint256 } = constants;
const { parseEther: toWei } = utils;

describe('ATokenYieldSource', () => {
  let contractsOwner: Signer;
  let yieldSourceOwner: SignerWithAddress;
  let wallet2: SignerWithAddress;

  let aToken: MockContract;
  let incentivesController: MockContract;
  let lendingPool: MockContract;
  let lendingPoolAddressesProvider: MockContract;
  let lendingPoolAddressesProviderRegistry: MockContract;

  let aTokenYieldSource: ATokenYieldSourceHarness;

  let erc20Token: MockContract;
  let daiToken: ERC20Mintable;

  let isInitializeTest = false;

  const initializeATokenYieldSource = async (
    aTokenAddress: string,
    incentivesControllerAddress: string,
    lendingPoolAddressesProviderRegistryAddress: string,
    decimals: number,
    owner: string,
  ) => {
    await aTokenYieldSource.initialize(
      aTokenAddress,
      incentivesControllerAddress,
      lendingPoolAddressesProviderRegistryAddress,
      decimals,
      'Test',
      'TEST',
      owner,
    );
  };

  const supplyTokenTo = async (
    user: SignerWithAddress,
    userAmount: BigNumber,
    aTokenTotalSupply: BigNumber,
  ) => {
    const tokenAddress = await aTokenYieldSource.tokenAddress();
    const userAddress = user.address;

    await daiToken.mint(userAddress, userAmount);
    await daiToken.connect(user).approve(aTokenYieldSource.address, MaxUint256);

    await lendingPool.mock.deposit
      .withArgs(tokenAddress, userAmount, aTokenYieldSource.address, 188)
      .returns();

    // aTokenTotalSupply should never be 0 since we mint shares to the user after depositin in Aave
    await aToken.mock.balanceOf.withArgs(aTokenYieldSource.address).returns(aTokenTotalSupply);

    await aTokenYieldSource.connect(user).supplyTokenTo(userAmount, userAddress);
  };

  const sharesToToken = async (shares: BigNumber, yieldSourceTotalSupply: BigNumber) => {
    const totalShares = await aTokenYieldSource.callStatic.totalSupply();

    // tokens = (shares * yieldSourceTotalSupply) / totalShares
    return shares.mul(yieldSourceTotalSupply).div(totalShares);
  };

  beforeEach(async () => {
    const { deployMockContract } = waffle;

    [contractsOwner, yieldSourceOwner, wallet2] = await getSigners();

    const ERC20MintableContract = await getContractFactory('ERC20Mintable', contractsOwner);

    debug('mocking tokens...');
    erc20Token = await deployMockContract(contractsOwner, SafeERC20WrapperUpgradeable);

    daiToken = await ERC20MintableContract.deploy('Dai Stablecoin', 'DAI', 18);

    aToken = await deployMockContract(contractsOwner, ATokenInterface);
    await aToken.mock.UNDERLYING_ASSET_ADDRESS.returns(daiToken.address);

    debug('mocking contracts...');
    lendingPool = await deployMockContract(contractsOwner, ILendingPool);

    incentivesController = await deployMockContract(contractsOwner, IAaveIncentivesController);

    lendingPoolAddressesProvider = await deployMockContract(
      contractsOwner,
      ILendingPoolAddressesProvider,
    );

    lendingPoolAddressesProviderRegistry = await deployMockContract(
      contractsOwner,
      ILendingPoolAddressesProviderRegistry,
    );

    await lendingPoolAddressesProvider.mock.getLendingPool.returns(lendingPool.address);
    await lendingPoolAddressesProviderRegistry.mock.getAddressesProvidersList.returns([
      lendingPoolAddressesProvider.address,
      '0x67FB118A780fD740C8936511947cC4bE7bb7730c',
    ]);

    debug('deploying ATokenYieldSource instance...');

    const ATokenYieldSource = await ethers.getContractFactory('ATokenYieldSourceHarness');
    const hardhatATokenYieldSourceHarness = await ATokenYieldSource.deploy();

    aTokenYieldSource = ((await ethers.getContractAt(
      'ATokenYieldSourceHarness',
      hardhatATokenYieldSourceHarness.address,
      contractsOwner,
    )) as unknown) as ATokenYieldSourceHarness;

    if (!isInitializeTest) {
      await initializeATokenYieldSource(
        aToken.address,
        incentivesController.address,
        lendingPoolAddressesProviderRegistry.address,
        18,
        yieldSourceOwner.address,
      );
    }
  });

  describe('initialize()', () => {
    before(() => {
      isInitializeTest = true;
    });

    after(() => {
      isInitializeTest = false;
    });

    it('should fail if aToken is address zero', async () => {
      await expect(
        initializeATokenYieldSource(
          AddressZero,
          incentivesController.address,
          lendingPoolAddressesProviderRegistry.address,
          18,
          yieldSourceOwner.address,
        ),
      ).to.be.revertedWith('ATokenYieldSource/aToken-not-zero-address');
    });

    it('should fail if incentivesController is address zero', async () => {
      await expect(
        initializeATokenYieldSource(
          aToken.address,
          AddressZero,
          lendingPoolAddressesProviderRegistry.address,
          18,
          yieldSourceOwner.address,
        ),
      ).to.be.revertedWith('ATokenYieldSource/incentivesController-not-zero-address');
    });

    it('should fail if lendingPoolAddressesProviderRegistry is address zero', async () => {
      await expect(
        initializeATokenYieldSource(
          aToken.address,
          incentivesController.address,
          AddressZero,
          18,
          yieldSourceOwner.address,
        ),
      ).to.be.revertedWith('ATokenYieldSource/lendingPoolRegistry-not-zero-address');
    });

    it('should fail if owner is address zero', async () => {
      await expect(
        initializeATokenYieldSource(
          aToken.address,
          incentivesController.address,
          lendingPoolAddressesProviderRegistry.address,
          18,
          AddressZero,
        ),
      ).to.be.revertedWith('ATokenYieldSource/owner-not-zero-address');
    });

    it('should fail if token decimal is not greater than 0', async () => {
      await expect(
        initializeATokenYieldSource(
          aToken.address,
          incentivesController.address,
          lendingPoolAddressesProviderRegistry.address,
          0,
          yieldSourceOwner.address,
        ),
      ).to.be.revertedWith('ATokenYieldSource/decimals-gt-zero');
    });
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

  describe('approveMaxAmount()', () => {
    it('should approve lending pool to spend max uint256 amount', async () => {
      expect(
        await aTokenYieldSource.connect(yieldSourceOwner).callStatic.approveMaxAmount(),
      ).to.equal(true);

      expect(await daiToken.allowance(aTokenYieldSource.address, lendingPool.address)).to.equal(
        MaxUint256,
      );
    });

    it('should fail if not owner', async () => {
      await expect(
        aTokenYieldSource.connect(wallet2).callStatic.approveMaxAmount(),
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });
  });

  describe('depositToken()', () => {
    it('should return the underlying token', async () => {
      expect(await aTokenYieldSource.depositToken()).to.equal(daiToken.address);
    });
  });

  describe('balanceOfToken()', () => {
    it('should return user balance', async () => {
      const firstAmount = toWei('100');
      const yieldSourceTotalSupply = firstAmount.mul(2);

      await supplyTokenTo(yieldSourceOwner, firstAmount, firstAmount);
      await supplyTokenTo(yieldSourceOwner, firstAmount, yieldSourceTotalSupply);

      await aToken.mock.balanceOf
        .withArgs(aTokenYieldSource.address)
        .returns(yieldSourceTotalSupply);

      const shares = await aTokenYieldSource.callStatic.balanceOf(yieldSourceOwner.address);
      const tokens = await sharesToToken(shares, yieldSourceTotalSupply);

      expect(await aTokenYieldSource.callStatic.balanceOfToken(yieldSourceOwner.address)).to.equal(
        tokens,
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

    it('should return 0 if tokens param is 0', async () => {
      expect(await aTokenYieldSource.tokenToShares('0')).to.equal('0');
    });

    it('should return tokens if totalSupply is 0', async () => {
      expect(await aTokenYieldSource.tokenToShares(toWei('100'))).to.equal(toWei('100'));
    });

    it('should return shares even if aToken total supply has a lot of decimals', async () => {
      await aTokenYieldSource.mint(yieldSourceOwner.address, toWei('1'));
      await aToken.mock.balanceOf
        .withArgs(aTokenYieldSource.address)
        .returns(toWei('0.000000000000000005'));

      expect(await aTokenYieldSource.tokenToShares(toWei('0.000000000000000005'))).to.equal(
        toWei('1'),
      );
    });

    it('should return shares even if aToken total supply increases', async () => {
      await aTokenYieldSource.mint(yieldSourceOwner.address, toWei('100'));
      await aTokenYieldSource.mint(wallet2.address, toWei('100'));
      await aToken.mock.balanceOf.withArgs(aTokenYieldSource.address).returns(toWei('100'));

      expect(await aTokenYieldSource.tokenToShares(toWei('1'))).to.equal(toWei('2'));

      await aToken.mock.balanceOf
        .withArgs(aTokenYieldSource.address)
        .returns(ethers.utils.parseUnits('100', 36));
      expect(await aTokenYieldSource.tokenToShares(toWei('1'))).to.equal(2);
    });

    it('should fail to return shares if aToken total supply increases too much', async () => {
      await aTokenYieldSource.mint(yieldSourceOwner.address, toWei('100'));
      await aTokenYieldSource.mint(wallet2.address, toWei('100'));
      await aToken.mock.balanceOf.withArgs(aTokenYieldSource.address).returns(toWei('100'));

      expect(await aTokenYieldSource.tokenToShares(toWei('1'))).to.equal(toWei('2'));

      await aToken.mock.balanceOf
        .withArgs(aTokenYieldSource.address)
        .returns(ethers.utils.parseUnits('100', 37));
      await expect(aTokenYieldSource.supplyTokenTo(toWei('1'), wallet2.address)).to.be.revertedWith(
        'ATokenYieldSource/shares-gt-zero',
      );
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

      expect(await aTokenYieldSource.sharesToToken(toWei('0.000000000000000005'))).to.equal(
        toWei('100'),
      );
    });

    it('should return tokens even if aToken total supply increases', async () => {
      await aTokenYieldSource.mint(yieldSourceOwner.address, toWei('100'));
      await aTokenYieldSource.mint(wallet2.address, toWei('100'));
      await aToken.mock.balanceOf.withArgs(aTokenYieldSource.address).returns(toWei('100'));

      expect(await aTokenYieldSource.sharesToToken(toWei('2'))).to.equal(toWei('1'));

      await aToken.mock.balanceOf
        .withArgs(aTokenYieldSource.address)
        .returns(ethers.utils.parseUnits('100', 36));
      expect(await aTokenYieldSource.sharesToToken(2)).to.equal(toWei('1'));
    });
  });

  describe('supplyTokenTo()', () => {
    let amount: BigNumber;
    let tokenAddress: any;

    beforeEach(async () => {
      amount = toWei('100');
      tokenAddress = await aTokenYieldSource.tokenAddress();
    });

    it('should supply assets if totalSupply is 0', async () => {
      await supplyTokenTo(yieldSourceOwner, amount, amount);
      expect(await aTokenYieldSource.totalSupply()).to.equal(amount);
    });

    it('should supply assets if totalSupply is not 0', async () => {
      await supplyTokenTo(yieldSourceOwner, amount, amount);
      await supplyTokenTo(wallet2, amount, amount.mul(2));
    });

    it('should revert on error', async () => {
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
      await supplyTokenTo(yieldSourceOwner, yieldSourceOwnerBalance, yieldSourceOwnerBalance);

      await aToken.mock.balanceOf
        .withArgs(aTokenYieldSource.address)
        .returns(yieldSourceOwnerBalance);

      await lendingPool.mock.withdraw
        .withArgs(daiToken.address, redeemAmount, aTokenYieldSource.address)
        .returns(redeemAmount);

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
        .withArgs(daiToken.address, redeemAmount, aTokenYieldSource.address)
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
    let tokenAddress: any;

    beforeEach(async () => {
      amount = toWei('500');
      tokenAddress = await aTokenYieldSource.tokenAddress();
    });

    it('should sponsor Yield Source', async () => {
      const wallet2Amount = toWei('100');

      await supplyTokenTo(wallet2, wallet2Amount, wallet2Amount);

      await lendingPool.mock.deposit
        .withArgs(tokenAddress, amount, aTokenYieldSource.address, 188)
        .returns();

      await daiToken.mint(yieldSourceOwner.address, amount);
      await daiToken.connect(yieldSourceOwner).approve(aTokenYieldSource.address, MaxUint256);

      await aTokenYieldSource.connect(yieldSourceOwner).sponsor(amount);

      await aToken.mock.balanceOf
        .withArgs(aTokenYieldSource.address)
        .returns(amount.add(wallet2Amount));

      expect(await aTokenYieldSource.callStatic.balanceOfToken(wallet2.address)).to.equal(
        amount.add(wallet2Amount),
      );
    });

    it('should revert on error', async () => {
      await lendingPool.mock.deposit
        .withArgs(tokenAddress, amount, aTokenYieldSource.address, 188)
        .reverts();

      await expect(aTokenYieldSource.connect(yieldSourceOwner).sponsor(amount)).to.be.revertedWith(
        '',
      );
    });
  });

  describe('claimRewards()', () => {
    const claimAmount = toWei('100');

    beforeEach(async () => {
      await incentivesController.mock.getRewardsBalance
        .withArgs([aToken.address], aTokenYieldSource.address)
        .returns(claimAmount);

      await incentivesController.mock.claimRewards
        .withArgs([aToken.address], claimAmount, wallet2.address)
        .returns(claimAmount);
    });

    it('should claimRewards if yieldSourceOwner', async () => {
      await expect(aTokenYieldSource.connect(yieldSourceOwner).claimRewards(wallet2.address))
        .to.emit(aTokenYieldSource, 'Claimed')
        .withArgs(yieldSourceOwner.address, wallet2.address, claimAmount);
    });

    it('should claimRewards if assetManager', async () => {
      await aTokenYieldSource.connect(yieldSourceOwner).setAssetManager(wallet2.address);

      await expect(aTokenYieldSource.connect(wallet2).claimRewards(wallet2.address))
        .to.emit(aTokenYieldSource, 'Claimed')
        .withArgs(wallet2.address, wallet2.address, claimAmount);
    });

    it('should fail to claimRewards if recipient is address zero', async () => {
      await expect(
        aTokenYieldSource.connect(yieldSourceOwner).claimRewards(AddressZero),
      ).to.be.revertedWith('ATokenYieldSource/recipient-not-zero-address');
    });

    it('should fail to claimRewards if not yieldSourceOwner or assetManager', async () => {
      await expect(
        aTokenYieldSource.connect(wallet2).claimRewards(wallet2.address),
      ).to.be.revertedWith('OwnerOrAssetManager: caller is not owner or asset manager');
    });
  });

  describe('_lendingPoolProvider()', () => {
    it('should return Aave LendingPoolAddressesProvider address', async () => {
      const lendingPoolAddressesProviderList = await lendingPoolAddressesProviderRegistry.getAddressesProvidersList();

      expect(await aTokenYieldSource.lendingPoolProvider()).to.equal(
        lendingPoolAddressesProviderList[0],
      );
    });
  });

  describe('_lendingPool()', () => {
    it('should return Aave LendingPool address', async () => {
      expect(await aTokenYieldSource.lendingPool()).to.equal(lendingPool.address);
    });
  });
});
