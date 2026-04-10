import { Attribution } from "ox/erc8021";
import { defineChain, type Address } from "viem";

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

const placeholderBuilderCode = "YOUR-BUILDER-CODE";

export const builderCode =
  process.env.NEXT_PUBLIC_XLAYER_BUILDER_CODE ?? placeholderBuilderCode;

export const builderCodeConfigured = builderCode !== placeholderBuilderCode;

export const dataSuffix = Attribution.toDataSuffix({
  codes: [builderCode],
});

export const defaultRecipientAddress = (
  process.env.NEXT_PUBLIC_XLAYER_RECIPIENT_ADDRESS ??
  "0x5f4d9959cf2a8408c8c8be42f244dc6d4816214d"
) as Address;

export const defaultAmount = process.env.NEXT_PUBLIC_XLAYER_AMOUNT ?? "0.0";

export const builderCodeDocsUrl =
  "https://web3.okx.com/xlayer/docs/developer/builder-codes/integration";

export const faucetUrl = "https://www.okx.com/web3/faucet";
