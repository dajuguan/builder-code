import { createWalletClient, custom, type EIP1193Provider } from "viem";
import { dataSuffix } from "@/lib/xlayer";

export type BrowserProvider = EIP1193Provider & {
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, listener: (...args: unknown[]) => void) => void;
};

declare global {
  interface Window {
    ethereum?: BrowserProvider;
  }

  var __builderCodeWalletClient__: ReturnType<typeof createWalletClient> | undefined;
}

export function getInjectedProvider() {
  if (typeof window === "undefined") return null;
  return window.ethereum ?? null;
}

export function getBuilderCodeWalletClient() {
  const provider = getInjectedProvider();
  if (!provider) throw new Error("未检测到 injected wallet provider。");

  if (!globalThis.__builderCodeWalletClient__) {
    globalThis.__builderCodeWalletClient__ = createWalletClient({
      dataSuffix,
      transport: custom(provider),
    });
  }

  return globalThis.__builderCodeWalletClient__;
}
