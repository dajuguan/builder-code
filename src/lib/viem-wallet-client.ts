import { createWalletClient, custom, type EIP1193Provider } from "viem";

export type BrowserProvider = EIP1193Provider & {
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, listener: (...args: unknown[]) => void) => void;
};

declare global {
  interface Window {
    ethereum?: BrowserProvider;
  }
}

export function getInjectedProvider() {
  if (typeof window === "undefined") return null;
  return window.ethereum ?? null;
}

export function getBuilderCodeWalletClient(dataSuffix: `0x${string}`) {
  const provider = getInjectedProvider();
  if (!provider) throw new Error("No injected wallet provider detected.");

  return createWalletClient({
    dataSuffix,
    transport: custom(provider),
  });
}
