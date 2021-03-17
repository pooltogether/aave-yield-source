import chalk from 'chalk';

import { task } from 'hardhat/config';

const info = (message: string) => console.log(chalk.dim(message));
const success = (message: string) => console.log(chalk.green(message));

export default task('etherscan:verify', 'Verifies ATokenYieldSource contracts on Etherscan ').setAction(
  async (taskArguments, hre) => {
    const getContract = async (name: string) => {
      const { deployments } = hre;
      const signers = await hre.ethers.getSigners();

      return hre.ethers.getContractAt(name, (await deployments.get(name)).address, signers[0]);
    };

    const verifyAddress = async (address: string, contractName: string, options = '') => {
      await hre.run('verify:verify', {
        address,
        contract: `contracts/yield-source/${contractName}.sol:${contractName}`,
      });
    };

    const verifyProxyFactory = async (proxyFactoryName: string, instanceName: string) => {
      const proxyFactory = await getContract(proxyFactoryName);
      const proxyFactoryAddress = proxyFactory.address;
      const instanceAddress = await proxyFactory.instance();

      info(`Verifying ${proxyFactoryName}...`);
      await verifyAddress(proxyFactoryAddress, proxyFactoryName);

      info(`Verifying ${instanceName} instance...`);
      await verifyAddress(instanceAddress, instanceName);

      success(`Verified!`);
    };

    info(`Verifying proxy factory instances...`);

    await verifyProxyFactory('ATokenYieldSourceProxyFactory', 'ATokenYieldSource');

    success('Done!');
  },
);
