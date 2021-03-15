/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import { Contract, ContractFactory, Overrides } from "@ethersproject/contracts";

import type { ATokenYieldSourceProxyFactory } from "../ATokenYieldSourceProxyFactory";

export class ATokenYieldSourceProxyFactory__factory extends ContractFactory {
  constructor(signer?: Signer) {
    super(_abi, _bytecode, signer);
  }

  deploy(overrides?: Overrides): Promise<ATokenYieldSourceProxyFactory> {
    return super.deploy(
      overrides || {}
    ) as Promise<ATokenYieldSourceProxyFactory>;
  }
  getDeployTransaction(overrides?: Overrides): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): ATokenYieldSourceProxyFactory {
    return super.attach(address) as ATokenYieldSourceProxyFactory;
  }
  connect(signer: Signer): ATokenYieldSourceProxyFactory__factory {
    return super.connect(signer) as ATokenYieldSourceProxyFactory__factory;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): ATokenYieldSourceProxyFactory {
    return new Contract(
      address,
      _abi,
      signerOrProvider
    ) as ATokenYieldSourceProxyFactory;
  }
}

const _abi = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "proxy",
        type: "address",
      },
    ],
    name: "ProxyCreated",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "contract ATokenInterface",
        name: "_aToken",
        type: "address",
      },
      {
        internalType: "contract ILendingPoolAddressesProviderRegistry",
        name: "_lendingPoolAddressesProviderRegistry",
        type: "address",
      },
      {
        internalType: "contract IReserve",
        name: "_reserve",
        type: "address",
      },
      {
        internalType: "address",
        name: "_owner",
        type: "address",
      },
    ],
    name: "create",
    outputs: [
      {
        internalType: "contract ATokenYieldSource",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_logic",
        type: "address",
      },
      {
        internalType: "bytes",
        name: "_data",
        type: "bytes",
      },
    ],
    name: "deployMinimal",
    outputs: [
      {
        internalType: "address",
        name: "proxy",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "instance",
    outputs: [
      {
        internalType: "contract ATokenYieldSource",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

const _bytecode =
  "0x608060405234801561001057600080fd5b5060405161001d9061007e565b604051809103906000f080158015610039573d6000803e3d6000fd5b506000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555061008b565b613915806106be83390190565b6106248061009a6000396000f3fe608060405234801561001057600080fd5b50600436106100415760003560e01c8063022ec09514610046578063abffeffc1461007a578063b3eeb5e214610148575b600080fd5b61004e61024d565b604051808273ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b61011c6004803603608081101561009057600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803573ffffffffffffffffffffffffffffffffffffffff169060200190929190505050610271565b604051808273ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b6102216004803603604081101561015e57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff1690602001909291908035906020019064010000000081111561019b57600080fd5b8201836020820111156101ad57600080fd5b803590602001918460018302840111640100000000831117156101cf57600080fd5b91908080601f016020809104026020016040519081016040528093929190818152602001838380828437600081840152601f19601f8201169050808301925050505050505091929192905050506103f9565b604051808273ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b60008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b6000806102ad60008054906101000a900473ffffffffffffffffffffffffffffffffffffffff16604051806020016040528060008152506103f9565b90508073ffffffffffffffffffffffffffffffffffffffff1663c0c53b8b8787876040518463ffffffff1660e01b8152600401808473ffffffffffffffffffffffffffffffffffffffff1681526020018373ffffffffffffffffffffffffffffffffffffffff1681526020018273ffffffffffffffffffffffffffffffffffffffff1681526020019350505050600060405180830381600087803b15801561035457600080fd5b505af1158015610368573d6000803e3d6000fd5b505050508073ffffffffffffffffffffffffffffffffffffffff1663f2fde38b846040518263ffffffff1660e01b8152600401808273ffffffffffffffffffffffffffffffffffffffff168152602001915050600060405180830381600087803b1580156103d557600080fd5b505af11580156103e9573d6000803e3d6000fd5b5050505080915050949350505050565b6000808360601b90506040517f3d602d80600a3d3981f3363d3d373d3d3d363d7300000000000000000000000081528160148201527f5af43d82803e903d91602b57fd5bf3000000000000000000000000000000000060288201526037816000f09250507efffc2da0b561cae30d9826d37709e9421c4725faebc226cbbb7ef5fc5e734982604051808273ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390a16000835111156105c35760008273ffffffffffffffffffffffffffffffffffffffff16846040518082805190602001908083835b6020831061050057805182526020820191506020810190506020830392506104dd565b6001836020036101000a0380198251168184511680821785525050505050509050019150506000604051808303816000865af19150503d8060008114610562576040519150601f19603f3d011682016040523d82523d6000602084013e610567565b606091505b50509050806105c1576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260248152602001806105cb6024913960400191505060405180910390fd5b505b509291505056fe50726f7879466163746f72792f636f6e7374727563746f722d63616c6c2d6661696c6564a264697066735822122055a50e16ffb415444ff55c4008766d0bb64955fba9d137a604f90275bcb8617364736f6c634300060c0033608060405234801561001057600080fd5b506138f5806100206000396000f3fe608060405234801561001057600080fd5b50600436106101a95760003560e01c806395d89b41116100f9578063bfc4895911610097578063db006a7511610071578063db006a75146108a7578063dd62ed3e146108e9578063f2fde38b14610961578063fc0c546a146109a5576101a9565b8063bfc48959146107ab578063c0c53b8b146107ef578063cd3293de14610873576101a9565b8063a0c1f15e116100d3578063a0c1f15e14610681578063a457c2d7146106b5578063a9059cbb14610719578063b6cce5e21461077d576101a9565b806395d89b411461054c5780639cecc80a146105cf5780639db5dbe414610613576101a9565b80633950935111610166578063715018a611610140578063715018a6146104a6578063873ba41e146104b05780638da5cb5b146104e457806394217ad114610518576101a9565b806339509351146103a6578063430602371461040a57806370a082311461044e576101a9565b806304bbd693146101ae57806306fdde03146101fc578063095ea7b31461027f57806318160ddd146102e357806323b872dd14610301578063313ce56714610385575b600080fd5b6101fa600480360360408110156101c457600080fd5b8101908080359060200190929190803573ffffffffffffffffffffffffffffffffffffffff1690602001909291905050506109d9565b005b610204610a18565b6040518080602001828103825283818151815260200191508051906020019080838360005b83811015610244578082015181840152602081019050610229565b50505050905090810190601f1680156102715780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b6102cb6004803603604081101561029557600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff16906020019092919080359060200190929190505050610aba565b60405180821515815260200191505060405180910390f35b6102eb610ad8565b6040518082815260200191505060405180910390f35b61036d6004803603606081101561031757600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803573ffffffffffffffffffffffffffffffffffffffff16906020019092919080359060200190929190505050610ae2565b60405180821515815260200191505060405180910390f35b61038d610bbb565b604051808260ff16815260200191505060405180910390f35b6103f2600480360360408110156103bc57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff16906020019092919080359060200190929190505050610bd2565b60405180821515815260200191505060405180910390f35b61044c6004803603602081101561042057600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190505050610c85565b005b6104906004803603602081101561046457600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190505050610dd3565b6040518082815260200191505060405180910390f35b6104ae610e1c565b005b6104b8610f8c565b604051808273ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b6104ec610fb2565b604051808273ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b610520610fdc565b604051808273ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b610554611006565b6040518080602001828103825283818151815260200191508051906020019080838360005b83811015610594578082015181840152602081019050610579565b50505050905090810190601f1680156105c15780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b610611600480360360208110156105e557600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff1690602001909291905050506110a8565b005b61067f6004803603606081101561062957600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803573ffffffffffffffffffffffffffffffffffffffff16906020019092919080359060200190929190505050611200565b005b61068961144d565b604051808273ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b610701600480360360408110156106cb57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff16906020019092919080359060200190929190505050611473565b60405180821515815260200191505060405180910390f35b6107656004803603604081101561072f57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff16906020019092919080359060200190929190505050611540565b60405180821515815260200191505060405180910390f35b6107a96004803603602081101561079357600080fd5b810190808035906020019092919050505061155e565b005b6107ed600480360360208110156107c157600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff1690602001909291905050506115b9565b005b6108716004803603606081101561080557600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803573ffffffffffffffffffffffffffffffffffffffff1690602001909291905050506118eb565b005b61087b611b98565b604051808273ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b6108d3600480360360208110156108bd57600080fd5b8101908080359060200190929190505050611bbe565b6040518082815260200191505060405180910390f35b61094b600480360360408110156108ff57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803573ffffffffffffffffffffffffffffffffffffffff169060200190929190505050611ec4565b6040518082815260200191505060405180910390f35b6109a36004803603602081101561097757600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190505050611f4b565b005b6109ad612140565b604051808273ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b6109e3823061214f565b6000806109ee610ad8565b14156109fc57829050610a09565b610a0683836122d0565b90505b610a13828261246a565b505050565b606060368054600181600116156101000203166002900480601f016020809104026020016040519081016040528092919081815260200182805460018160011615610100020316600290048015610ab05780601f10610a8557610100808354040283529160200191610ab0565b820191906000526020600020905b815481529060010190602001808311610a9357829003601f168201915b5050505050905090565b6000610ace610ac7612633565b848461263b565b6001905092915050565b6000603554905090565b6000610aef848484612832565b610bb084610afb612633565b610bab856040518060600160405280602881526020016137cc60289139603460008b73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206000610b61612633565b73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054612af79092919063ffffffff16565b61263b565b600190509392505050565b6000603860009054906101000a900460ff16905090565b6000610c7b610bdf612633565b84610c768560346000610bf0612633565b73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008973ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054612bb190919063ffffffff16565b61263b565b6001905092915050565b610c8d612633565b73ffffffffffffffffffffffffffffffffffffffff16610cab610fb2565b73ffffffffffffffffffffffffffffffffffffffff1614610d34576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260208152602001807f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e657281525060200191505060405180910390fd5b8073ffffffffffffffffffffffffffffffffffffffff16600073ffffffffffffffffffffffffffffffffffffffff167fa4d7db5805a7ddee85566735eb5d575b0894cef3fe057b4fa1b52090d8c2206860405160405180910390a380609760006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050565b6000603360008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050919050565b610e24612633565b73ffffffffffffffffffffffffffffffffffffffff16610e42610fb2565b73ffffffffffffffffffffffffffffffffffffffff1614610ecb576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260208152602001807f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e657281525060200191505060405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff16606560009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a36000606560006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550565b609960009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b6000606560009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16905090565b6000609760009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16905090565b606060378054600181600116156101000203166002900480601f01602080910402602001604051908101604052809291908181526020018280546001816001161561010002031660029004801561109e5780601f106110735761010080835404028352916020019161109e565b820191906000526020600020905b81548152906001019060200180831161108157829003601f168201915b5050505050905090565b6110b0612633565b73ffffffffffffffffffffffffffffffffffffffff166110ce610fb2565b73ffffffffffffffffffffffffffffffffffffffff1614611157576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260208152602001807f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e657281525060200191505060405180910390fd5b80609a60006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550609a60009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff167fbb36f8b916efa066f8cb63f4e8511b3086ff0f9bad3a1814e323eedf2404ad9a60405160405180910390a250565b611208612633565b73ffffffffffffffffffffffffffffffffffffffff16611226610fdc565b73ffffffffffffffffffffffffffffffffffffffff161480611281575061124b612633565b73ffffffffffffffffffffffffffffffffffffffff16611269610fb2565b73ffffffffffffffffffffffffffffffffffffffff16145b6112d6576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252603d81526020018061385e603d913960400191505060405180910390fd5b609860009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff16141561137d576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252602d815260200180613671602d913960400191505060405180910390fd5b8273ffffffffffffffffffffffffffffffffffffffff166323b872dd3084846040518463ffffffff1660e01b8152600401808473ffffffffffffffffffffffffffffffffffffffff1681526020018373ffffffffffffffffffffffffffffffffffffffff1681526020018281526020019350505050602060405180830381600087803b15801561140c57600080fd5b505af1158015611420573d6000803e3d6000fd5b505050506040513d602081101561143657600080fd5b810190808051906020019092919050505050505050565b609860009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b6000611536611480612633565b846115318560405180606001604052806025815260200161389b60259139603460006114aa612633565b73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008a73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054612af79092919063ffffffff16565b61263b565b6001905092915050565b600061155461154d612633565b8484612832565b6001905092915050565b611568813061214f565b3373ffffffffffffffffffffffffffffffffffffffff167fbb2c10eb8b0d65523a501a1c079906e38af3c4231e31b799d408daacd7ce7226826040518082815260200191505060405180910390a250565b6115c1612633565b73ffffffffffffffffffffffffffffffffffffffff166115df610fdc565b73ffffffffffffffffffffffffffffffffffffffff16148061163a5750611604612633565b73ffffffffffffffffffffffffffffffffffffffff16611622610fb2565b73ffffffffffffffffffffffffffffffffffffffff16145b61168f576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252603d81526020018061385e603d913960400191505060405180910390fd5b6000609a60009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1663010dfa58306040518263ffffffff1660e01b8152600401808273ffffffffffffffffffffffffffffffffffffffff16815260200191505060206040518083038186803b15801561171a57600080fd5b505afa15801561172e573d6000803e3d6000fd5b505050506040513d602081101561174457600080fd5b8101908080519060200190929190505050905060008114156117b1576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252602e815260200180613708602e913960400191505060405180910390fd5b60006117c46117be610ad8565b83612c39565b90506117ce612140565b73ffffffffffffffffffffffffffffffffffffffff166323b872dd3085846040518463ffffffff1660e01b8152600401808473ffffffffffffffffffffffffffffffffffffffff1681526020018373ffffffffffffffffffffffffffffffffffffffff1681526020018281526020019350505050602060405180830381600087803b15801561185c57600080fd5b505af1158015611870573d6000803e3d6000fd5b505050506040513d602081101561188657600080fd5b8101908080519060200190929190505050508273ffffffffffffffffffffffffffffffffffffffff167fa116a7e02870a5f52d63d8a0852e6ad2654c93986e380d98ec90044f5e776dd7826040518082815260200191505060405180910390a2505050565b600060019054906101000a900460ff168061190a5750611909612c78565b5b80611920575060008054906101000a900460ff16155b611975576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252602e81526020018061375c602e913960400191505060405180910390fd5b60008060019054906101000a900460ff1615905080156119c5576001600060016101000a81548160ff02191690831515021790555060016000806101000a81548160ff0219169083151502179055505b83609860006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555082609960006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555081609a60006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550611a90612c89565b609a60009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16609860009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff167f44568b8e52a168d64e6c28fae3904d7ce42c90369531c5e4ada5b4065520d3d1609960009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16604051808273ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390a38015611b925760008060016101000a81548160ff0219169083151502179055505b50505050565b609a60009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b600080611bca33610dd3565b14611c20576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260218152602001806137ab6021913960400191505060405180910390fd5b6000609860009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff166370a08231306040518263ffffffff1660e01b8152600401808273ffffffffffffffffffffffffffffffffffffffff16815260200191505060206040518083038186803b158015611cab57600080fd5b505afa158015611cbf573d6000803e3d6000fd5b505050506040513d6020811015611cd557600080fd5b81019080805190602001909291905050509050611cf0612d97565b73ffffffffffffffffffffffffffffffffffffffff166369328dec611d13612e26565b85306040518463ffffffff1660e01b8152600401808473ffffffffffffffffffffffffffffffffffffffff1681526020018381526020018273ffffffffffffffffffffffffffffffffffffffff1681526020019350505050602060405180830381600087803b158015611d8557600080fd5b505af1158015611d99573d6000803e3d6000fd5b505050506040513d6020811015611daf57600080fd5b8101908080519060200190929190505050506000609860009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff166370a08231306040518263ffffffff1660e01b8152600401808273ffffffffffffffffffffffffffffffffffffffff16815260200191505060206040518083038186803b158015611e4c57600080fd5b505afa158015611e60573d6000803e3d6000fd5b505050506040513d6020811015611e7657600080fd5b810190808051906020019092919050505090506000611e9e8383612ed090919063ffffffff16565b90506000611eac86336122d0565b9050611eb83382612f53565b81945050505050919050565b6000603460008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054905092915050565b611f53612633565b73ffffffffffffffffffffffffffffffffffffffff16611f71610fb2565b73ffffffffffffffffffffffffffffffffffffffff1614611ffa576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260208152602001807f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e657281525060200191505060405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff161415612080576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260268152602001806136c06026913960400191505060405180910390fd5b8073ffffffffffffffffffffffffffffffffffffffff16606560009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a380606560006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050565b600061214a612e26565b905090565b612157612140565b73ffffffffffffffffffffffffffffffffffffffff1663095ea7b361217a612d97565b846040518363ffffffff1660e01b8152600401808373ffffffffffffffffffffffffffffffffffffffff16815260200182815260200192505050602060405180830381600087803b1580156121ce57600080fd5b505af11580156121e2573d6000803e3d6000fd5b505050506040513d60208110156121f857600080fd5b810190808051906020019092919050505050612212612d97565b73ffffffffffffffffffffffffffffffffffffffff1663e8eda9df612235612e26565b848460bc6040518563ffffffff1660e01b8152600401808573ffffffffffffffffffffffffffffffffffffffff1681526020018481526020018373ffffffffffffffffffffffffffffffffffffffff1681526020018261ffff168152602001945050505050600060405180830381600087803b1580156122b457600080fd5b505af11580156122c8573d6000803e3d6000fd5b505050505050565b6000612462609860009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff166370a08231306040518263ffffffff1660e01b8152600401808273ffffffffffffffffffffffffffffffffffffffff16815260200191505060206040518083038186803b15801561235e57600080fd5b505afa158015612372573d6000803e3d6000fd5b505050506040513d602081101561238857600080fd5b8101908080519060200190929190505050612454856123a5612140565b73ffffffffffffffffffffffffffffffffffffffff166370a08231876040518263ffffffff1660e01b8152600401808273ffffffffffffffffffffffffffffffffffffffff16815260200191505060206040518083038186803b15801561240b57600080fd5b505afa15801561241f573d6000803e3d6000fd5b505050506040513d602081101561243557600080fd5b810190808051906020019092919050505061311990919063ffffffff16565b61319f90919063ffffffff16565b905092915050565b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff16141561250d576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252601f8152602001807f45524332303a206d696e7420746f20746865207a65726f20616464726573730081525060200191505060405180910390fd5b61251960008383613228565b61252e81603554612bb190919063ffffffff16565b60358190555061258681603360008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054612bb190919063ffffffff16565b603360008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508173ffffffffffffffffffffffffffffffffffffffff16600073ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef836040518082815260200191505060405180910390a35050565b600033905090565b600073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff1614156126c1576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252602481526020018061383a6024913960400191505060405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff161415612747576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260228152602001806136e66022913960400191505060405180910390fd5b80603460008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508173ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925836040518082815260200191505060405180910390a3505050565b600073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff1614156128b8576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260258152602001806138156025913960400191505060405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff16141561293e576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252602381526020018061364e6023913960400191505060405180910390fd5b612949838383613228565b6129b58160405180606001604052806026815260200161373660269139603360008773ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054612af79092919063ffffffff16565b603360008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002081905550612a4a81603360008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054612bb190919063ffffffff16565b603360008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508173ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef836040518082815260200191505060405180910390a3505050565b6000838311158290612ba4576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825283818151815260200191508051906020019080838360005b83811015612b69578082015181840152602081019050612b4e565b50505050905090810190601f168015612b965780820380516001836020036101000a031916815260200191505b509250505060405180910390fd5b5082840390509392505050565b600080828401905083811015612c2f576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252601b8152602001807f536166654d6174683a206164646974696f6e206f766572666c6f77000000000081525060200191505060405180910390fd5b8091505092915050565b600080612c4f848461311990919063ffffffff16565b9050612c6c670de0b6b3a76400008261319f90919063ffffffff16565b90508091505092915050565b6000612c833061322d565b15905090565b600060019054906101000a900460ff1680612ca85750612ca7612c78565b5b80612cbe575060008054906101000a900460ff16155b612d13576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252602e81526020018061375c602e913960400191505060405180910390fd5b60008060019054906101000a900460ff161590508015612d63576001600060016101000a81548160ff02191690831515021790555060016000806101000a81548160ff0219169083151502179055505b612d6b613240565b612d7361333e565b8015612d945760008060016101000a81548160ff0219169083151502179055505b50565b6000612da16134e5565b73ffffffffffffffffffffffffffffffffffffffff16630261bf8b6040518163ffffffff1660e01b815260040160206040518083038186803b158015612de657600080fd5b505afa158015612dfa573d6000803e3d6000fd5b505050506040513d6020811015612e1057600080fd5b8101908080519060200190929190505050905090565b6000609860009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1663b16a19de6040518163ffffffff1660e01b815260040160206040518083038186803b158015612e9057600080fd5b505afa158015612ea4573d6000803e3d6000fd5b505050506040513d6020811015612eba57600080fd5b8101908080519060200190929190505050905090565b600082821115612f48576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252601e8152602001807f536166654d6174683a207375627472616374696f6e206f766572666c6f77000081525060200191505060405180910390fd5b818303905092915050565b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff161415612fd9576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260218152602001806137f46021913960400191505060405180910390fd5b612fe582600083613228565b6130518160405180606001604052806022815260200161369e60229139603360008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054612af79092919063ffffffff16565b603360008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055506130a981603554612ed090919063ffffffff16565b603581905550600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef836040518082815260200191505060405180910390a35050565b60008083141561312c5760009050613199565b600082840290508284828161313d57fe5b0414613194576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252602181526020018061378a6021913960400191505060405180910390fd5b809150505b92915050565b6000808211613216576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252601a8152602001807f536166654d6174683a206469766973696f6e206279207a65726f00000000000081525060200191505060405180910390fd5b81838161321f57fe5b04905092915050565b505050565b600080823b905060008111915050919050565b600060019054906101000a900460ff168061325f575061325e612c78565b5b80613275575060008054906101000a900460ff16155b6132ca576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252602e81526020018061375c602e913960400191505060405180910390fd5b60008060019054906101000a900460ff16159050801561331a576001600060016101000a81548160ff02191690831515021790555060016000806101000a81548160ff0219169083151502179055505b801561333b5760008060016101000a81548160ff0219169083151502179055505b50565b600060019054906101000a900460ff168061335d575061335c612c78565b5b80613373575060008054906101000a900460ff16155b6133c8576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252602e81526020018061375c602e913960400191505060405180910390fd5b60008060019054906101000a900460ff161590508015613418576001600060016101000a81548160ff02191690831515021790555060016000806101000a81548160ff0219169083151502179055505b6000613422612633565b905080606560006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055508073ffffffffffffffffffffffffffffffffffffffff16600073ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a35080156134e25760008060016101000a81548160ff0219169083151502179055505b50565b6000806134f0613648565b9050609960009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1663365ccbbf6040518163ffffffff1660e01b815260040160006040518083038186803b15801561355a57600080fd5b505afa15801561356e573d6000803e3d6000fd5b505050506040513d6000823e3d601f19601f82011682018060405250602081101561359857600080fd5b81019080805160405193929190846401000000008211156135b857600080fd5b838201915060208201858111156135ce57600080fd5b82518660208202830111640100000000821117156135eb57600080fd5b8083526020830192505050908051906020019060200280838360005b83811015613622578082015181840152602081019050613607565b50505050905001604052505050818151811061363a57fe5b602002602001015191505090565b60009056fe45524332303a207472616e7366657220746f20746865207a65726f206164647265737341546f6b656e5969656c64536f757263652f61546f6b656e2d7472616e736665722d6e6f742d616c6c6f77656445524332303a206275726e20616d6f756e7420657863656564732062616c616e63654f776e61626c653a206e6577206f776e657220697320746865207a65726f206164647265737345524332303a20617070726f766520746f20746865207a65726f206164647265737341546f6b656e5969656c64536f757263652f72657365727665526174654d616e74697373612d6e6f742d7a65726f45524332303a207472616e7366657220616d6f756e7420657863656564732062616c616e6365496e697469616c697a61626c653a20636f6e747261637420697320616c726561647920696e697469616c697a6564536166654d6174683a206d756c7469706c69636174696f6e206f766572666c6f7741546f6b656e5969656c64536f757263652f7368617265732d6e6f742d7a65726f45524332303a207472616e7366657220616d6f756e74206578636565647320616c6c6f77616e636545524332303a206275726e2066726f6d20746865207a65726f206164647265737345524332303a207472616e736665722066726f6d20746865207a65726f206164647265737345524332303a20617070726f76652066726f6d20746865207a65726f20616464726573736f6e6c794f776e65724f7241737365744d616e616765723a2063616c6c6572206973206e6f74206f776e6572206f72206173736574206d616e6167657245524332303a2064656372656173656420616c6c6f77616e63652062656c6f77207a65726fa26469706673582212201b5527bfe82ef9a084fd3860d36be7c976132ad2a20cc6a2dbbca0acd9fc564364736f6c634300060c0033";
