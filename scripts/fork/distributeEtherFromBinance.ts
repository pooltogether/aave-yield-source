import { dai, usdc } from '@studydefi/money-legos/erc20';

import { task } from 'hardhat/config';

import { BINANCE_ADDRESS, BINANCE7_ADDRESS, DAI_RICH_ADDRESS, LARGE_GUSD_ADDRESS, GUSD_ADDRESS, LARGE_BUSD_ADDRESS, BUSD_ADDRESS, SUSD_ADDRESS, LARGE_SUSD_ADDRESS } from '../../Constant';
import { info, success } from '../helpers';

export default task(
  'fork:distribute-ether-from-binance',
  'Distribute Ether from Binance',
).setAction(async (taskArguments, hre) => {
  info('Gathering funds from Binance...');

  const { getNamedAccounts, ethers } = hre;
  const { provider, getContractAt, getSigners } = ethers;
  const { deployer } = await getNamedAccounts();

  const [contractsOwner, yieldSourceOwner] = await getSigners();

  const binance = provider.getUncheckedSigner(BINANCE_ADDRESS);
  const binance7 = provider.getUncheckedSigner(BINANCE7_ADDRESS);
  const gusdHolder = provider.getUncheckedSigner(LARGE_GUSD_ADDRESS);
  const busdHolder = provider.getUncheckedSigner(LARGE_BUSD_ADDRESS);
  const susdHolder = provider.getUncheckedSigner(LARGE_SUSD_ADDRESS);

  const daiContract = await getContractAt(dai.abi, dai.address, binance);
  const usdcContract = await getContractAt(usdc.abi, usdc.address, binance7);
  const gusdContract = await getContractAt(dai.abi, GUSD_ADDRESS, gusdHolder)
  const busdContract = await getContractAt(dai.abi, BUSD_ADDRESS, busdHolder)
  const susdContract = await getContractAt(dai.abi, SUSD_ADDRESS, susdHolder)

  const recipients: { [key: string]: string } = {
    ['Deployer']: deployer,
    ['Dai Rich Signer']: DAI_RICH_ADDRESS,
    ['contractsOwner']: contractsOwner.address,
    ['yieldSourceOwner']: yieldSourceOwner.address,
  };

  await binance.sendTransaction({ to: gusdHolder._address, value: ethers.utils.parseEther('10') });

  const keys = Object.keys(recipients);

  for (var i = 0; i < keys.length; i++) {
    const name = keys[i];
    const address = recipients[name];

    info(`Sending 1000 Ether to ${name}...`);
    await binance.sendTransaction({ to: address, value: ethers.utils.parseEther('1000') });

    info(`Sending 1000 Dai to ${name}...`);
    await daiContract.transfer(address, ethers.utils.parseEther('1000'));

    info(`Sending 1000 GUSD to ${name}...`);
    await gusdContract.transfer(address, ethers.utils.parseUnits('1000', 2));

    info(`Sending 1000 BUSD to ${name}...`);
    await busdContract.transfer(address, ethers.utils.parseUnits('1000', 18));

    info(`Sending 1000 SUSD to ${name}...`);
    await susdContract.transfer(address, ethers.utils.parseUnits('1000', 18));

  }

  success('Done!');
});
