import { Attribution } from "ox/erc8021";
import { defineChain } from "viem";

export const xlayerMainnet = defineChain({
  id: 196,
  name: "X Layer Mainnet",
  nativeCurrency: {
    name: "OKB",
    symbol: "OKB",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.xlayer.tech"],
    },
  },
  blockExplorers: {
    default: {
      name: "OKX Explorer",
      url: "https://www.okx.com/web3/explorer/xlayer",
    },
  },
});

export const xlayerTestnet = defineChain({
  id: 1952,
  name: "X Layer Testnet",
  nativeCurrency: {
    name: "OKB",
    symbol: "OKB",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://testrpc.xlayer.tech/terigon"],
    },
  },
  blockExplorers: {
    default: {
      name: "OKX Explorer",
      url: "https://www.okx.com/web3/explorer/xlayer-test",
    },
  },
  testnet: true,
});

export const defaultBuilderCode = "98xx1660gorvuiv3";

let _builderCode = defaultBuilderCode;

export function setBuilderCode(code: string) {
  _builderCode = code;
}

export function makeDataSuffix(builderCode: string) {
  return Attribution.toDataSuffix({ codes: [builderCode] });
}

/** Returns dataSuffix for the currently active builder code (mutable). */
export function getCurrentDataSuffix() {
  return makeDataSuffix(_builderCode);
}

export const builderCodeDocsUrl =
  "https://web3.okx.com/xlayer/docs/developer/builder-codes/integration";

export const faucetUrl = "https://www.okx.com/web3/faucet";
