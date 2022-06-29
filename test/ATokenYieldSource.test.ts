import debug from 'debug';

import { Signer } from '@ethersproject/abstract-signer';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

import { expect } from 'chai';
import { BigNumber } from 'ethers';
import { MockContract } from 'ethereum-waffle';
import { ethers, waffle } from 'hardhat';

import {
  ATokenYieldSourceHarness,
  ATokenYieldSourceHarness__factory,
  AaveLendingPool,
  ATokenMintable,
  ERC20Mintable,
} from '../types';

import IAaveIncentivesController from '../abis/IAaveIncentivesController.json';
import ILendingPoolAddressesProvider from '../abis/ILendingPoolAddressesProvider.json';
import ILendingPoolAddressesProviderRegistry from '../abis/ILendingPoolAddressesProviderRegistry.json';
import SafeERC20Wrapper from '../abis/SafeERC20Wrapper.json';

const { constants, getContractFactory, getSigners, utils } = ethers;
const { AddressZero, MaxUint256, Zero } = constants;
const { parseEther: toWei, parseUnits } = utils;

const DECIMALS = 18;

describe('ATokenYieldSource', () => {
  let contractsOwner: Signer;
  let yieldSourceOwner: SignerWithAddress;
  let wallet2: SignerWithAddress;

  let aToken: ATokenMintable;
  let incentivesController: MockContract;
  let lendingPool: AaveLendingPool;
  let lendingPoolAddressesProvider: MockContract;
  let lendingPoolAddressesProviderRegistry: MockContract;

  let aTokenYieldSource: ATokenYieldSourceHarness;

  let erc20Token: MockContract;
  let daiToken: ERC20Mintable;

  let constructorTest = false;

  const deployATokenYieldSource = async (
    aTokenAddress: string,
    incentivesControllerAddress: string,
    lendingPoolAddressesProviderRegistryAddress: string,
    decimals: number,
    owner: string,
  ) => {
    const ATokenYieldSource = (await ethers.getContractFactory(
      'ATokenYieldSourceHarness',
    )) as ATokenYieldSourceHarness__factory;

    return await ATokenYieldSource.deploy(
      aTokenAddress,
      incentivesControllerAddress,
      lendingPoolAddressesProviderRegistryAddress,
      decimals,
      'PoolTogether aDAI Yield',
      'PTaDAI',
      owner,
    );
  };

  const supplyTokenTo = async (user: SignerWithAddress, userAmount: BigNumber) => {
    const userAddress = user.address;

    await daiToken.mint(userAddress, userAmount);
    await daiToken.connect(user).approve(aTokenYieldSource.address, MaxUint256);

    await aTokenYieldSource.connect(user).supplyTokenTo(userAmount, userAddress);
  };

  const sharesToToken = async (shares: BigNumber, yieldSourceTotalSupply: BigNumber) => {
    const totalShares = await aTokenYieldSource.totalSupply();

    // tokens = (shares * yieldSourceTotalSupply) / totalShares
    return shares.mul(yieldSourceTotalSupply).div(totalShares);
  };

  const tokenToShares = async (token: BigNumber, yieldSourceTotalSupply: BigNumber) => {
    const totalShares = await aTokenYieldSource.totalSupply();

    // shares = (tokens * totalSupply) / yieldSourceBalanceOfAToken
    return token.mul(totalShares).div(yieldSourceTotalSupply);
  };

  beforeEach(async () => {
    const { deployMockContract } = waffle;

    [contractsOwner, yieldSourceOwner, wallet2] = await getSigners();

    const ERC20MintableContract = await getContractFactory('ERC20Mintable', contractsOwner);

    debug('Mocking tokens...');
    erc20Token = await deployMockContract(contractsOwner, SafeERC20Wrapper);
    daiToken = await ERC20MintableContract.deploy('Dai Stablecoin', 'DAI', DECIMALS);

    const ATokenMintableContract = await getContractFactory('ATokenMintable', contractsOwner);

    aToken = (await ATokenMintableContract.deploy(
      daiToken.address,
      'Aave interest bearing DAI',
      'aDAI',
      DECIMALS,
    )) as ATokenMintable;

    debug('Mocking contracts...');

    const AavePoolContract = await getContractFactory('AaveLendingPool', contractsOwner);

    lendingPool = (await AavePoolContract.deploy(
      daiToken.address,
      aToken.address,
    )) as AaveLendingPool;

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

    debug('Deploying ATokenYieldSource...');

    if (!constructorTest) {
      aTokenYieldSource = await deployATokenYieldSource(
        aToken.address,
        incentivesController.address,
        lendingPoolAddressesProviderRegistry.address,
        DECIMALS,
        yieldSourceOwner.address,
      );
    }
  });

  describe('constructor()', () => {
    beforeEach(() => {
      constructorTest = true;
    });

    afterEach(() => {
      constructorTest = false;
    });

    it('should fail if aToken is address zero', async () => {
      await expect(
        deployATokenYieldSource(
          AddressZero,
          incentivesController.address,
          lendingPoolAddressesProviderRegistry.address,
          DECIMALS,
          yieldSourceOwner.address,
        ),
      ).to.be.revertedWith('ATokenYieldSource/aToken-not-zero-address');
    });

    it('should fail if incentivesController is address zero', async () => {
      await expect(
        deployATokenYieldSource(
          aToken.address,
          AddressZero,
          lendingPoolAddressesProviderRegistry.address,
          DECIMALS,
          yieldSourceOwner.address,
        ),
      ).to.be.revertedWith('ATokenYieldSource/incentivesController-not-zero-address');
    });

    it('should fail if lendingPoolAddressesProviderRegistry is address zero', async () => {
      await expect(
        deployATokenYieldSource(
          aToken.address,
          incentivesController.address,
          AddressZero,
          DECIMALS,
          yieldSourceOwner.address,
        ),
      ).to.be.revertedWith('ATokenYieldSource/lendingPoolRegistry-not-zero-address');
    });

    it('should fail if owner is address zero', async () => {
      await expect(
        deployATokenYieldSource(
          aToken.address,
          incentivesController.address,
          lendingPoolAddressesProviderRegistry.address,
          DECIMALS,
          AddressZero,
        ),
      ).to.be.revertedWith('ATokenYieldSource/owner-not-zero-address');
    });

    it('should fail if token decimal is not greater than 0', async () => {
      await expect(
        deployATokenYieldSource(
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
      expect(await aTokenYieldSource.decimals()).to.equal(DECIMALS);
      expect(await aTokenYieldSource.aToken()).to.equal(aToken.address);
      expect(await aTokenYieldSource.lendingPoolAddressesProviderRegistry()).to.equal(
        lendingPoolAddressesProviderRegistry.address,
      );

      expect(await aTokenYieldSource.owner()).to.equal(yieldSourceOwner.address);
    });
  });

  describe('approveMaxAmount()', () => {
    it('should approve lending pool to spend max uint256 amount', async () => {
      await aTokenYieldSource.approveLendingPool(Zero);
      await aTokenYieldSource.connect(yieldSourceOwner).approveMaxAmount();

      expect(await daiToken.allowance(aTokenYieldSource.address, lendingPool.address)).to.equal(
        MaxUint256,
      );
    });

    it('should fail if not owner', async () => {
      await expect(aTokenYieldSource.connect(wallet2).approveMaxAmount()).to.be.revertedWith(
        'Ownable/caller-not-owner',
      );
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

      await supplyTokenTo(yieldSourceOwner, firstAmount);
      await supplyTokenTo(yieldSourceOwner, firstAmount);

      const shares = await aTokenYieldSource.balanceOf(yieldSourceOwner.address);
      const tokens = await sharesToToken(shares, yieldSourceTotalSupply);

      expect(await aTokenYieldSource.balanceOfToken(yieldSourceOwner.address)).to.equal(tokens);
    });
  });

  describe('_tokenToShares()', () => {
    it('should return shares amount', async () => {
      const amount = toWei('100');

      await supplyTokenTo(yieldSourceOwner, amount);
      await supplyTokenTo(wallet2, amount);

      const tokens = toWei('10');
      const shares = await tokenToShares(tokens, amount.mul(2));

      expect(await aTokenYieldSource.tokenToShares(toWei('10'))).to.equal(shares);
    });

    it('should return 0 if tokens param is 0', async () => {
      expect(await aTokenYieldSource.tokenToShares('0')).to.equal('0');
    });

    it('should return tokens if totalSupply is 0', async () => {
      expect(await aTokenYieldSource.tokenToShares(toWei('100'))).to.equal(toWei('100'));
    });

    it('should return shares even if aToken total supply has a lot of decimals', async () => {
      const tokens = toWei('0.000000000000000005');
      const shares = toWei('1');

      await aTokenYieldSource.mint(yieldSourceOwner.address, shares);
      await aToken.mint(aTokenYieldSource.address, tokens);

      expect(await aTokenYieldSource.tokenToShares(tokens)).to.equal(shares);
    });

    it('should return shares even if aToken total supply increases', async () => {
      const amount = toWei('100');
      const tokens = toWei('1');

      await aTokenYieldSource.mint(yieldSourceOwner.address, amount);
      await aTokenYieldSource.mint(wallet2.address, amount);
      await aToken.mint(aTokenYieldSource.address, amount);

      expect(await aTokenYieldSource.tokenToShares(tokens)).to.equal(toWei('2'));

      await aToken.mint(aTokenYieldSource.address, parseUnits('100', 36).sub(amount));

      expect(await aTokenYieldSource.tokenToShares(tokens)).to.equal(2);
    });

    it('should fail to return shares if aToken total supply increases too much', async () => {
      const amount = toWei('100');
      const tokens = toWei('1');

      await aTokenYieldSource.mint(yieldSourceOwner.address, amount);
      await aTokenYieldSource.mint(wallet2.address, amount);
      await aToken.mint(aTokenYieldSource.address, amount);

      expect(await aTokenYieldSource.tokenToShares(tokens)).to.equal(toWei('2'));

      await aToken.mint(aTokenYieldSource.address, parseUnits('100', 37).sub(amount));

      await expect(aTokenYieldSource.supplyTokenTo(tokens, wallet2.address)).to.be.revertedWith(
        'ATokenYieldSource/shares-gt-zero',
      );
    });
  });

  describe('_sharesToToken()', () => {
    it('should return tokens amount', async () => {
      const amount = toWei('100');

      await aTokenYieldSource.mint(yieldSourceOwner.address, amount);
      await aTokenYieldSource.mint(wallet2.address, amount);
      await aToken.mint(aTokenYieldSource.address, toWei('1000'));

      expect(await aTokenYieldSource.sharesToToken(toWei('2'))).to.equal(toWei('10'));
    });

    it('should return shares if totalSupply is 0', async () => {
      const shares = toWei('100');
      expect(await aTokenYieldSource.sharesToToken(shares)).to.equal(shares);
    });

    it('should return tokens even if if shares are very small', async () => {
      const shares = toWei('0.000000000000000005');
      const tokens = toWei('100');

      await aTokenYieldSource.mint(yieldSourceOwner.address, shares);
      await aToken.mint(aTokenYieldSource.address, tokens);

      expect(await aTokenYieldSource.sharesToToken(shares)).to.equal(tokens);
    });

    it('should return tokens even if aToken total supply increases', async () => {
      const amount = toWei('100');
      const tokens = toWei('1');

      await aTokenYieldSource.mint(yieldSourceOwner.address, amount);
      await aTokenYieldSource.mint(wallet2.address, amount);
      await aToken.mint(aTokenYieldSource.address, amount);

      expect(await aTokenYieldSource.sharesToToken(toWei('2'))).to.equal(tokens);

      await aToken.mint(aTokenYieldSource.address, parseUnits('100', 36).sub(amount));

      expect(await aTokenYieldSource.sharesToToken(2)).to.equal(tokens);
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
      await supplyTokenTo(yieldSourceOwner, amount);
      expect(await aTokenYieldSource.totalSupply()).to.equal(amount);
    });

    it('should supply assets if totalSupply is not 0', async () => {
      await supplyTokenTo(yieldSourceOwner, amount);
      await supplyTokenTo(wallet2, amount);
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
      await supplyTokenTo(yieldSourceOwner, yieldSourceOwnerBalance);

      await aTokenYieldSource.connect(yieldSourceOwner).redeemToken(redeemAmount);

      expect(await aTokenYieldSource.balanceOf(yieldSourceOwner.address)).to.equal(
        yieldSourceOwnerBalance.sub(redeemAmount),
      );
    });

    it('should not be able to redeem assets if balance is 0', async () => {
      await expect(
        aTokenYieldSource.connect(yieldSourceOwner).redeemToken(redeemAmount),
      ).to.be.revertedWith('ERC20: burn amount exceeds balance');
    });

    it('should fail to redeem if amount is greater than balance', async () => {
      const yieldSourceOwnerLowBalance = toWei('10');

      await supplyTokenTo(yieldSourceOwner, yieldSourceOwnerLowBalance);

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

      await aTokenYieldSource.connect(yieldSourceOwner).setManager(wallet2.address);

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
      ).to.be.revertedWith('Manageable/caller-not-manager-or-owner');
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

      await supplyTokenTo(wallet2, wallet2Amount);

      await daiToken.mint(yieldSourceOwner.address, amount);
      await daiToken.connect(yieldSourceOwner).approve(aTokenYieldSource.address, MaxUint256);

      await aTokenYieldSource.connect(yieldSourceOwner).sponsor(amount);

      expect(await aTokenYieldSource.balanceOfToken(wallet2.address)).to.equal(
        amount.add(wallet2Amount),
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
      await aTokenYieldSource.connect(yieldSourceOwner).setManager(wallet2.address);

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
      ).to.be.revertedWith('Manageable/caller-not-manager-or-owner');
    });
  });

  describe('_lendingPool()', () => {
    it('should return Aave LendingPool address', async () => {
      expect(await aTokenYieldSource.lendingPool()).to.equal(lendingPool.address);
    });
  });
});
