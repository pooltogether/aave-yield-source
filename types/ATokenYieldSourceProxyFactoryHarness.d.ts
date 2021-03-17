/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import {
  ethers,
  EventFilter,
  Signer,
  BigNumber,
  BigNumberish,
  PopulatedTransaction,
} from "ethers";
import {
  Contract,
  ContractTransaction,
  Overrides,
  CallOverrides,
} from "@ethersproject/contracts";
import { BytesLike } from "@ethersproject/bytes";
import { Listener, Provider } from "@ethersproject/providers";
import { FunctionFragment, EventFragment, Result } from "@ethersproject/abi";
import { TypedEventFilter, TypedEvent, TypedListener } from "./commons";

interface ATokenYieldSourceProxyFactoryHarnessInterface
  extends ethers.utils.Interface {
  functions: {
    "c_0x2b4df744(bytes32)": FunctionFragment;
    "c_0x5cb6b1f4(bytes32)": FunctionFragment;
    "create(address,address,address,address)": FunctionFragment;
    "deployMinimal(address,bytes)": FunctionFragment;
    "instance()": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "c_0x2b4df744",
    values: [BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "c_0x5cb6b1f4",
    values: [BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "create",
    values: [string, string, string, string]
  ): string;
  encodeFunctionData(
    functionFragment: "deployMinimal",
    values: [string, BytesLike]
  ): string;
  encodeFunctionData(functionFragment: "instance", values?: undefined): string;

  decodeFunctionResult(
    functionFragment: "c_0x2b4df744",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "c_0x5cb6b1f4",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "create", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "deployMinimal",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "instance", data: BytesLike): Result;

  events: {
    "ProxyCreated(address)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "ProxyCreated"): EventFragment;
}

export class ATokenYieldSourceProxyFactoryHarness extends Contract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  listeners<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter?: TypedEventFilter<EventArgsArray, EventArgsObject>
  ): Array<TypedListener<EventArgsArray, EventArgsObject>>;
  off<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  on<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  once<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  removeListener<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  removeAllListeners<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>
  ): this;

  listeners(eventName?: string): Array<Listener>;
  off(eventName: string, listener: Listener): this;
  on(eventName: string, listener: Listener): this;
  once(eventName: string, listener: Listener): this;
  removeListener(eventName: string, listener: Listener): this;
  removeAllListeners(eventName?: string): this;

  queryFilter<EventArgsArray extends Array<any>, EventArgsObject>(
    event: TypedEventFilter<EventArgsArray, EventArgsObject>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEvent<EventArgsArray & EventArgsObject>>>;

  interface: ATokenYieldSourceProxyFactoryHarnessInterface;

  functions: {
    c_0x2b4df744(
      c__0x2b4df744: BytesLike,
      overrides?: CallOverrides
    ): Promise<[void]>;

    "c_0x2b4df744(bytes32)"(
      c__0x2b4df744: BytesLike,
      overrides?: CallOverrides
    ): Promise<[void]>;

    c_0x5cb6b1f4(
      c__0x5cb6b1f4: BytesLike,
      overrides?: CallOverrides
    ): Promise<[void]>;

    "c_0x5cb6b1f4(bytes32)"(
      c__0x5cb6b1f4: BytesLike,
      overrides?: CallOverrides
    ): Promise<[void]>;

    create(
      _aToken: string,
      _lendingPoolAddressesProviderRegistry: string,
      _reserve: string,
      _owner: string,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    "create(address,address,address,address)"(
      _aToken: string,
      _lendingPoolAddressesProviderRegistry: string,
      _reserve: string,
      _owner: string,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    deployMinimal(
      _logic: string,
      _data: BytesLike,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    "deployMinimal(address,bytes)"(
      _logic: string,
      _data: BytesLike,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    instance(overrides?: CallOverrides): Promise<[string]>;

    "instance()"(overrides?: CallOverrides): Promise<[string]>;
  };

  c_0x2b4df744(
    c__0x2b4df744: BytesLike,
    overrides?: CallOverrides
  ): Promise<void>;

  "c_0x2b4df744(bytes32)"(
    c__0x2b4df744: BytesLike,
    overrides?: CallOverrides
  ): Promise<void>;

  c_0x5cb6b1f4(
    c__0x5cb6b1f4: BytesLike,
    overrides?: CallOverrides
  ): Promise<void>;

  "c_0x5cb6b1f4(bytes32)"(
    c__0x5cb6b1f4: BytesLike,
    overrides?: CallOverrides
  ): Promise<void>;

  create(
    _aToken: string,
    _lendingPoolAddressesProviderRegistry: string,
    _reserve: string,
    _owner: string,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  "create(address,address,address,address)"(
    _aToken: string,
    _lendingPoolAddressesProviderRegistry: string,
    _reserve: string,
    _owner: string,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  deployMinimal(
    _logic: string,
    _data: BytesLike,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  "deployMinimal(address,bytes)"(
    _logic: string,
    _data: BytesLike,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  instance(overrides?: CallOverrides): Promise<string>;

  "instance()"(overrides?: CallOverrides): Promise<string>;

  callStatic: {
    c_0x2b4df744(
      c__0x2b4df744: BytesLike,
      overrides?: CallOverrides
    ): Promise<void>;

    "c_0x2b4df744(bytes32)"(
      c__0x2b4df744: BytesLike,
      overrides?: CallOverrides
    ): Promise<void>;

    c_0x5cb6b1f4(
      c__0x5cb6b1f4: BytesLike,
      overrides?: CallOverrides
    ): Promise<void>;

    "c_0x5cb6b1f4(bytes32)"(
      c__0x5cb6b1f4: BytesLike,
      overrides?: CallOverrides
    ): Promise<void>;

    create(
      _aToken: string,
      _lendingPoolAddressesProviderRegistry: string,
      _reserve: string,
      _owner: string,
      overrides?: CallOverrides
    ): Promise<string>;

    "create(address,address,address,address)"(
      _aToken: string,
      _lendingPoolAddressesProviderRegistry: string,
      _reserve: string,
      _owner: string,
      overrides?: CallOverrides
    ): Promise<string>;

    deployMinimal(
      _logic: string,
      _data: BytesLike,
      overrides?: CallOverrides
    ): Promise<string>;

    "deployMinimal(address,bytes)"(
      _logic: string,
      _data: BytesLike,
      overrides?: CallOverrides
    ): Promise<string>;

    instance(overrides?: CallOverrides): Promise<string>;

    "instance()"(overrides?: CallOverrides): Promise<string>;
  };

  filters: {
    ProxyCreated(proxy: null): TypedEventFilter<[string], { proxy: string }>;
  };

  estimateGas: {
    c_0x2b4df744(
      c__0x2b4df744: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "c_0x2b4df744(bytes32)"(
      c__0x2b4df744: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    c_0x5cb6b1f4(
      c__0x5cb6b1f4: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "c_0x5cb6b1f4(bytes32)"(
      c__0x5cb6b1f4: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    create(
      _aToken: string,
      _lendingPoolAddressesProviderRegistry: string,
      _reserve: string,
      _owner: string,
      overrides?: Overrides
    ): Promise<BigNumber>;

    "create(address,address,address,address)"(
      _aToken: string,
      _lendingPoolAddressesProviderRegistry: string,
      _reserve: string,
      _owner: string,
      overrides?: Overrides
    ): Promise<BigNumber>;

    deployMinimal(
      _logic: string,
      _data: BytesLike,
      overrides?: Overrides
    ): Promise<BigNumber>;

    "deployMinimal(address,bytes)"(
      _logic: string,
      _data: BytesLike,
      overrides?: Overrides
    ): Promise<BigNumber>;

    instance(overrides?: CallOverrides): Promise<BigNumber>;

    "instance()"(overrides?: CallOverrides): Promise<BigNumber>;
  };

  populateTransaction: {
    c_0x2b4df744(
      c__0x2b4df744: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "c_0x2b4df744(bytes32)"(
      c__0x2b4df744: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    c_0x5cb6b1f4(
      c__0x5cb6b1f4: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "c_0x5cb6b1f4(bytes32)"(
      c__0x5cb6b1f4: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    create(
      _aToken: string,
      _lendingPoolAddressesProviderRegistry: string,
      _reserve: string,
      _owner: string,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    "create(address,address,address,address)"(
      _aToken: string,
      _lendingPoolAddressesProviderRegistry: string,
      _reserve: string,
      _owner: string,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    deployMinimal(
      _logic: string,
      _data: BytesLike,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    "deployMinimal(address,bytes)"(
      _logic: string,
      _data: BytesLike,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    instance(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "instance()"(overrides?: CallOverrides): Promise<PopulatedTransaction>;
  };
}
