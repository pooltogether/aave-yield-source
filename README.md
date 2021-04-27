<p align="center">
  <a href="https://github.com/pooltogether/pooltogether--brand-assets">
    <img src="https://github.com/pooltogether/pooltogether--brand-assets/blob/977e03604c49c63314450b5d432fe57d34747c66/logo/pooltogether-logo--purple-gradient.png?raw=true" alt="PoolTogether Brand" style="max-width:100%;" width="200">
  </a>
</p>

<br />

# PoolTogether Aave Yield Source 👻

![Tests](https://github.com/pooltogether/aave-yield-source/actions/workflows/main.yml/badge.svg)
[![Coverage Status](https://coveralls.io/repos/github/pooltogether/aave-yield-source/badge.svg)](https://coveralls.io/github/pooltogether/aave-yield-source)
[![built-with openzeppelin](https://img.shields.io/badge/built%20with-OpenZeppelin-3677FF)](https://docs.openzeppelin.com/)

PoolTogether Yield Source that uses [Aave](https://aave.com/) V2 to generate yield by lending any ERC20 token supported by Aave and deposited into the Aave Yield Source.

# Usage

## Adding a new Aave Lending Pool

First make sure the Aave json config (`aave/aaveMainnet.json`, etc) includes the lending pool.

Then, add the token symbol to the list in `aave.config.ts`.

## Deployment

Follow Installation instructions.

Aave provides a json blob per network of the files in the [docs](https://docs.aave.com/developers/deployed-contracts/deployed-contracts)
The deploy script parses this and deploys a proxy contract if the aToken file does exist in the deployments directory.

Ensure the `lendingPoolAddressesProviderRegistry` is up to date in the namedAccounts field of `hardhat.config.ts` .

To add a new network, add a json file in the `./aave` directory then run:

`yarn deploy <new_network_name>`

To add a new lending market, update the appropriate network json at `./aave` and run: 

`yarn deploy <network_name>`

The deployment script can be found in `deploy/deploy.ts`.

## Development

Clone this repository and enter the directory.

### Installation

Install dependencies:

```
yarn
```

This project uses [Yarn 2](https://yarnpkg.com), dependencies should get installed pretty quickly.

### Env

We use [direnv](https://direnv.net) to manage environment variables. You'll likely need to install it.

Copy `.envrc.example` and write down the env variables needed to run this project.
```
cp .envrc.example .envrc
```

Once your env variables are setup, load them with:
```
direnv allow
```

### Test

We use the [Hardhat](https://hardhat.org) ecosystem to test and deploy our contracts.

To run unit tests:

```
yarn test
```

To run [solhint](https://protofire.github.io/solhint/) and tests:

```
yarn verify
```

To run coverage:

```
yarn coverage
```

### Mainnet fork

Before deploying, you can make sure your implementation works by deploying a Yield Source Prize Pool on a fork of Mainnet.

Start Mainnet fork in a terminal window with the command:

```
yarn start-fork
```

In another window, start the scripts to deploy and create a Aave Yield Source Prize Pool, deposit Dai into it, award the prize and withdraw.

```
yarn deploy-fork && yarn run-fork
```

### Contract Verification

Once deployment is done, you can verify your contracts on [Etherscan](https://etherscan.io) by typing:

```
yarn verify <NETWORK_NAME>
```

### Code quality

[Prettier](https://prettier.io) is used to format TypeScript code. Use it by running:

```
yarn format
```

[Solhint](https://protofire.github.io/solhint/) is used to lint Solidity files. Run it with:
```
yarn hint
```

[TypeChain](https://github.com/ethereum-ts/Typechain) is used to generates types for scripts and tests. Generate types by running:
```
yarn typechain
```
