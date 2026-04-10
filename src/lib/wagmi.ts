import { createConfig, http } from "wagmi";
import { injectedWithDataSuffix } from "@/lib/injected-with-data-suffix";
import { dataSuffix, xlayerMainnet, xlayerTestnet } from "@/lib/xlayer";

export const config = createConfig({
  chains: [xlayerMainnet, xlayerTestnet],
  connectors: [injectedWithDataSuffix()],
  ssr: true,
  transports: {
    [xlayerMainnet.id]: http(xlayerMainnet.rpcUrls.default.http[0]),
    [xlayerTestnet.id]: http(xlayerTestnet.rpcUrls.default.http[0]),
  },
  dataSuffix,
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
