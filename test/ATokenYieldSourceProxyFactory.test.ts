import { expect } from 'chai';
import { ethers } from 'hardhat';

import {
  ADAI_ADDRESS_KOVAN,
  LENDING_POOL_ADDRESSES_PROVIDER_REGISTRY_ADDRESS_KOVAN,
} from '../Constant';

import { ATokenYieldSourceProxyFactory } from '../types';

describe('ATokenYieldSourceProxyFactory', () => {
  describe('create()', () => {
    it('should create a new aToken Yield Source', async () => {
      const provider = ethers.provider;

      const ATokenYieldSourceProxyFactory = await ethers.getContractFactory(
        'ATokenYieldSourceProxyFactory',
      );

      const hardhatATokenYieldSourceProxyFactory = (await ATokenYieldSourceProxyFactory.deploy()) as ATokenYieldSourceProxyFactory;

      const tx = await hardhatATokenYieldSourceProxyFactory.create(
        ADAI_ADDRESS_KOVAN,
        LENDING_POOL_ADDRESSES_PROVIDER_REGISTRY_ADDRESS_KOVAN,
        '0x3A791e828fDd420fbE16416efDF509E4b9088Dd4',
        18,
        "TEST",
        "TestToken"
      );
      const receipt = await provider.getTransactionReceipt(tx.hash);
      const createdEvent = hardhatATokenYieldSourceProxyFactory.interface.parseLog(receipt.logs[0]);

      const hardhatAtokenYieldSource = await ethers.getContractAt("ATokenYieldSource", ethers.constants.AddressZero)
      const initializedEvent = hardhatAtokenYieldSource.interface.parseLog(receipt.logs[2]);

      expect(createdEvent.name).to.equal('ProxyCreated');
      expect(initializedEvent.args.symbol).to.equal('TEST');
      expect(initializedEvent.args.name).to.equal('TestToken');
      expect(initializedEvent.args.decimals).to.equal(18);
    });
  });
});
