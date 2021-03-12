import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('ATokenYieldSourceProxyFactory', () => {
  describe('create()', () => {
    it('should create a new aToken Yield Source', async () => {
      const provider = ethers.provider;

      const ATokenYieldSourceProxyFactory = await ethers.getContractFactory(
        'ATokenYieldSourceProxyFactory',
      );

      const hardhatATokenYieldSourceProxyFactory = await ATokenYieldSourceProxyFactory.deploy();

      const tx = await hardhatATokenYieldSourceProxyFactory.create(
        '0xdCf0aF9e59C002FA3AA091a46196b37530FD48a8',
        '0x1E40B561EC587036f9789aF83236f057D1ed2A90',
        0,
        '0x3A791e828fDd420fbE16416efDF509E4b9088Dd4',
      );
      const receipt = await provider.getTransactionReceipt(tx.hash);
      const event = hardhatATokenYieldSourceProxyFactory.interface.parseLog(receipt.logs[0]);

      expect(event.name).to.equal('ProxyCreated');
    });
  });
});
