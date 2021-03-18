import { expect } from 'chai';
import { Contract } from 'ethers';
import { ethers } from 'hardhat';

const toWei = ethers.utils.parseEther;

describe('FixedPoint', () => {
  let fixedPoint: Contract;

  beforeEach(async () => {
    const fixedPointFactory = await ethers.getContractFactory('ExposedFixedPoint');
    fixedPoint = await fixedPointFactory.deploy();
  });

  describe('calculateMantissa()', () => {
    it('calculate the mantissa correctly', async () => {
      expect(await fixedPoint.calculateMantissa('1', '100')).to.equal(toWei('0.01'));
    });
  });

  describe('divideUintByMantissa', () => {
    it('should work', async () => {
      expect((await fixedPoint.divideUintByMantissa('100', toWei('0.1'))).toString()).to.equal(
        '1000',
      );
    });
  });

  describe('multiplyUintByMantissa', () => {
    it('should work', async () => {
      expect((await fixedPoint.multiplyUintByMantissa('100', toWei('0.1'))).toString()).to.equal(
        '10',
      );
    });
  });
});
