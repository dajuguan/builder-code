import { createClient, custom } from "viem";
import { createConnector } from "wagmi";
import { injected } from "wagmi/connectors";
import { dataSuffix } from "@/lib/xlayer";

type InjectedParameters = Parameters<typeof injected>[0];

export function injectedWithDataSuffix(parameters?: InjectedParameters) {
  const baseInjected = injected(parameters);

  return createConnector((config) => {
    const connector = baseInjected(config);

    return {
      ...connector,
      async getClient({ chainId } = {}) {
        const targetChainId = chainId ?? (await connector.getChainId());
        const chain = config.chains.find((item) => item.id === targetChainId);
        if (!chain) throw new Error(`Chain ${targetChainId} is not configured.`);

        const provider = await connector.getProvider({ chainId: targetChainId });
        if (!provider) throw new Error("Injected provider not found.");

        const [account] = await connector.getAccounts();
        if (!account) throw new Error("No connected account found.");

        return createClient({
          account,
          chain,
          dataSuffix,
          name: `${connector.name} Connector Client`,
          transport: (options) =>
            custom(provider)({
              ...options,
              retryCount: 0,
            }),
        });
      },
    };
  });
}
