"use client";

import { useEffect, useState } from "react";
import { numberToHex, type Address } from "viem";
import {
  builderCodeConfigured,
  builderCodeDocsUrl,
  dataSuffix,
  defaultRecipientAddress,
  faucetUrl,
  xlayerMainnet,
  xlayerTestnet,
} from "@/lib/xlayer";
import {
  getBuilderCodeWalletClient,
  getInjectedProvider,
  type BrowserProvider,
} from "@/lib/viem-wallet-client";

function getXLayerChain(chainId?: number | null) {
  if (chainId === xlayerMainnet.id) return xlayerMainnet;
  if (chainId === xlayerTestnet.id) return xlayerTestnet;
  return undefined;
}

export function ViemBuilderCodeDemo() {
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [address, setAddress] = useState<Address | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [hash, setHash] = useState<`0x${string}` | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const injected = getInjectedProvider();
    setProvider(injected);
    if (!injected) return;

    const syncWalletState = async () => {
      try {
        const [accounts, currentChainId] = await Promise.all([
          injected.request({ method: "eth_accounts" }) as Promise<string[]>,
          injected.request({ method: "eth_chainId" }) as Promise<string>,
        ]);

        setAddress((accounts[0] as Address | undefined) ?? null);
        setChainId(Number(currentChainId));
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : "读取钱包状态失败。");
      }
    };

    const handleAccountsChanged = (accounts: unknown) => {
      const nextAccounts = Array.isArray(accounts) ? (accounts as string[]) : [];
      setAddress((nextAccounts[0] as Address | undefined) ?? null);
    };

    const handleChainChanged = (nextChainId: unknown) => {
      if (typeof nextChainId === "string") setChainId(Number(nextChainId));
    };

    void syncWalletState();
    injected.on?.("accountsChanged", handleAccountsChanged);
    injected.on?.("chainChanged", handleChainChanged);

    return () => {
      injected.removeListener?.("accountsChanged", handleAccountsChanged);
      injected.removeListener?.("chainChanged", handleChainChanged);
    };
  }, []);

  const activeChain = getXLayerChain(chainId);
  const explorerUrl =
    activeChain?.blockExplorers.default.url ?? xlayerTestnet.blockExplorers.default.url;

  async function connectWallet() {
    if (!provider) {
      setError("未检测到 injected wallet provider。");
      return;
    }

    setError(null);
    setIsConnecting(true);

    try {
      const [accounts, currentChainId] = await Promise.all([
        provider.request({ method: "eth_requestAccounts" }) as Promise<string[]>,
        provider.request({ method: "eth_chainId" }) as Promise<string>,
      ]);

      setAddress((accounts[0] as Address | undefined) ?? null);
      setChainId(Number(currentChainId));
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "连接钱包失败。");
    } finally {
      setIsConnecting(false);
    }
  }

  async function switchToChain(targetChain: typeof xlayerMainnet | typeof xlayerTestnet) {
    if (!provider) {
      setError("未检测到 injected wallet provider。");
      return;
    }

    setError(null);
    setIsSwitching(true);

    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: numberToHex(targetChain.id) }],
      });
      setChainId(targetChain.id);
    } catch (nextError) {
      const message =
        nextError instanceof Error ? nextError.message : "切换网络失败，请在钱包里手动切换。";
      setError(message);
    } finally {
      setIsSwitching(false);
    }
  }

  async function sendWithViem() {
    if (!provider || !address || !activeChain) {
      setError("请先连接钱包，并切换到 X Layer 主网或测试网。");
      return;
    }

    setError(null);
    setIsSending(true);
    setHash(null);

    try {
      const walletClient = getBuilderCodeWalletClient();

      const nextHash = await walletClient.sendTransaction({
        account: address,
        chain: activeChain,
        to: defaultRecipientAddress,
      });

      setHash(nextHash);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "发送交易失败。");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <main className="shell">
      <section className="hero">
        <div className="hero-card">
          <span className="eyebrow">Next.js + Viem + X Layer Builder Codes</span>
          <h1>Viem 最小验证页</h1>
          <p>
            这个页面按文档里的 Viem 思路，在 wallet client 级别配置
            <span className="mono">dataSuffix</span>。为了能在浏览器里拉起 OKX
            Wallet，这里使用的是 injected provider 的
            <span className="mono">custom(window.ethereum)</span>
            transport。
          </p>
          <div className="hero-links">
            <a className="hero-link" href={builderCodeDocsUrl} rel="noreferrer" target="_blank">
              查看官方集成文档
            </a>
            <a className="hero-link" href={faucetUrl} rel="noreferrer" target="_blank">
              领取 X Layer Testnet OKB
            </a>
          </div>
        </div>
      </section>

      <section className="demo-card">
        <div className="demo-pane">
          <h2 className="section-title">Doc-Style Viem Example</h2>
          <p className="section-copy">
            先连接钱包，再切到你要测试的 X Layer 网络。发送按钮会通过
            <span className="mono">createWalletClient(..., dataSuffix)</span>
            发起交易，方便你直接看钱包弹窗里的 HEX data。
          </p>

          <div className="status-grid">
            <div className="status-chip">
              <span className="status-label">钱包状态</span>
              <span className="status-value">{address ? "已连接" : "未连接"}</span>
            </div>
            <div className="status-chip">
              <span className="status-label">当前网络</span>
              <span className="status-value">{activeChain?.name ?? "尚未连接或非 X Layer"}</span>
            </div>
            <div className="status-chip">
              <span className="status-label">测试地址</span>
              <span className="status-value mono">{defaultRecipientAddress}</span>
            </div>
          </div>

          <div className="wallet-actions">
            <button className="ghost-button" onClick={() => void connectWallet()} type="button">
              {isConnecting ? "连接中..." : "连接钱包"}
            </button>
            <button
              className="ghost-button"
              disabled={!address || chainId === xlayerMainnet.id || isSwitching}
              onClick={() => void switchToChain(xlayerMainnet)}
              type="button"
            >
              切到主网
            </button>
            <button
              className="ghost-button"
              disabled={!address || chainId === xlayerTestnet.id || isSwitching}
              onClick={() => void switchToChain(xlayerTestnet)}
              type="button"
            >
              切到测试网
            </button>
          </div>

          <div className="actions" style={{ marginTop: 20 }}>
            <button
              className="primary-button"
              disabled={!address || !activeChain || isSending}
              onClick={() => void sendWithViem()}
              type="button"
            >
              {isSending ? "等待钱包签名..." : "Send OKB"}
            </button>
          </div>

          {!builderCodeConfigured ? (
            <div className="callout callout-warning">
              你还在使用占位 Builder Code。先在
              <span className="mono">.env.local</span> 里替换
              <span className="mono">NEXT_PUBLIC_XLAYER_BUILDER_CODE</span>
              ，再重新启动应用。
            </div>
          ) : null}

          {error ? <div className="callout callout-danger">{error}</div> : null}

          {hash ? (
            <div className="callout callout-success">
              交易已发送：
              <span className="mono"> {hash}</span>{" "}
              <a href={`${explorerUrl}/tx/${hash}`} rel="noreferrer" target="_blank">
                在 OKX Explorer 查看
              </a>
            </div>
          ) : null}
        </div>

        <aside className="meta-pane">
          <h2 className="section-title">实际调用代码</h2>
          <p className="meta-copy">这个页面里的发送按钮会直接执行下面这段 Viem 代码。</p>

          <div className="meta-list">
            <div className="meta-card">
              <div className="meta-label">client.ts</div>
              <div className="meta-value mono">
                {`const walletClient = getBuilderCodeWalletClient()`}
                <br />
                {`// 全局单例，只初始化一次`}
              </div>
            </div>

            <div className="meta-card">
              <div className="meta-label">singleton.ts</div>
              <div className="meta-value mono">
                {`createWalletClient({`}
                <br />
                {`  dataSuffix: DATA_SUFFIX,`}
                <br />
                {`  transport: custom(window.ethereum),`}
                <br />
                {`})`}
              </div>
            </div>

            <div className="meta-card">
              <div className="meta-label">send.ts</div>
              <div className="meta-value mono">
                {`walletClient.sendTransaction({`}
                <br />
                {`  account,`}
                <br />
                {`  chain: xlayerChain,`}
                <br />
                {`  to: "${defaultRecipientAddress}",`}
                <br />
                {`})`}
              </div>
            </div>

            <div className="meta-card">
              <div className="meta-label">当前地址</div>
              <div className="meta-value mono">{address ?? "未连接"}</div>
            </div>
          </div>

          <div className="fine-print">
            <div className="meta-label">当前 client 上的 dataSuffix</div>
            <p className="mono-note">{dataSuffix}</p>
          </div>
        </aside>
      </section>
    </main>
  );
}
