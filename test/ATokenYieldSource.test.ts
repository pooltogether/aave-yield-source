import debug from 'debug';

import { expect } from 'chai';
import { ethers, waffle } from 'hardhat';

import IAtoken from '../abis/IAtoken.json';
import ILendingPool from '../abis/ILendingPool.json';
import ILendingPoolAddressesProvider from '../abis/ILendingPoolAddressesProvider.json';
import ILendingPoolAddressesProviderRegistry from '../abis/ILendingPoolAddressesProviderRegistry.json';
import ITokenConfiguration from '../abis/ITokenConfiguration.json';

import IERC20 from '../abis/IERC20.json';
import { Signer } from '@ethersproject/abstract-signer';
import { Contract } from '@ethersproject/contracts';
import { MockContract } from 'ethereum-waffle';
import { JsonRpcProvider } from '@ethersproject/providers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

describe('ATokenYieldSource', () => {
  let owner: Signer;
  let wallet1: SignerWithAddress;
  let provider: JsonRpcProvider;

  let aToken: MockContract;
  let lendingPool;
  let lendingPoolAddressesProvider: MockContract;
  let lendingPoolAddressesProviderRegistry: MockContract;
  let tokenConfiguration: MockContract;

  let hardhatATokenYieldSourceProxyFactory: Contract;
  let initializeTx: any;

  let erc20token;

  beforeEach(async () => {
    const { deployMockContract } = waffle;

    [owner, wallet1] = await ethers.getSigners();
    provider = waffle.provider;

    debug('mocking tokens...');
    erc20token = await deployMockContract(owner, IERC20);
    aToken = await deployMockContract(owner, IAtoken);

    lendingPoolAddressesProviderRegistry = await deployMockContract(
      owner,
      ILendingPoolAddressesProviderRegistry,
    );

    lendingPoolAddressesProvider = await deployMockContract(owner, ILendingPoolAddressesProvider);

    await lendingPoolAddressesProviderRegistry.mock.getAddressesProvidersList.returns([
      '0x88757f2f99175387aB4C6a4b3067c77A695b0349',
      '0x67FB118A780fD740C8936511947cC4bE7bb7730c',
    ]);

    await lendingPoolAddressesProvider.mock.getLendingPool.returns(
      '0xE0fBa4Fc209b4948668006B2bE61711b7f465bAe',
    );

    lendingPool = await deployMockContract(owner, ILendingPool);
    tokenConfiguration = await deployMockContract(owner, ITokenConfiguration);

    await tokenConfiguration.mock.UNDERLYING_ASSET_ADDRESS.returns(erc20token.address);

    debug('deploying ATokenYieldSourceProxyFactory...');

    const ATokenYieldSourceProxyFactory = await ethers.getContractFactory('ATokenYieldSourceProxyFactory');
    hardhatATokenYieldSourceProxyFactory = await ATokenYieldSourceProxyFactory.deploy();

    initializeTx = await hardhatATokenYieldSourceProxyFactory.create(
      aToken.address,
      lendingPoolAddressesProviderRegistry.address,
      0,
      wallet1.address,
    );
  });

  describe('create()', () => {
    it('should create ATokenYieldSource', async () => {
      const receipt = await provider.getTransactionReceipt(initializeTx.hash);
      const proxyCreatedEvent = hardhatATokenYieldSourceProxyFactory.interface.parseLog(receipt.logs[0]);

      expect(proxyCreatedEvent.name).to.equal('ProxyCreated');

      const aTokenYieldSource = await ethers.getContractAt("ATokenYieldSource", proxyCreatedEvent.args.proxy, owner);

      expect(await aTokenYieldSource.aToken()).to.equal(aToken.address);
      expect(await aTokenYieldSource.lendingPoolAddressesProviderRegistry()).to.equal(
        lendingPoolAddressesProviderRegistry.address,
      );
      expect(await aTokenYieldSource.reserveRate()).to.equal(0);
      expect(await aTokenYieldSource.owner()).to.equal(wallet1.address);
    });
  });
});
