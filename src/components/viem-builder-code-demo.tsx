"use client";

import { useState, useEffect } from "react";
import { numberToHex, type Address } from "viem";
import {
  builderCodeDocsUrl,
  defaultBuilderCode,
  faucetUrl,
  makeDataSuffix,
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

  const [builderCode, setBuilderCode] = useState(defaultBuilderCode);
  const [recipient, setRecipient] = useState<string>("");

  const effectiveRecipient = (recipient.trim() || address || "") as Address;
  const dataSuffix = makeDataSuffix(builderCode);

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
        setError(nextError instanceof Error ? nextError.message : "Failed to read wallet state.");
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
      setError("No injected wallet provider detected.");
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
      setError(nextError instanceof Error ? nextError.message : "Failed to connect wallet.");
    } finally {
      setIsConnecting(false);
    }
  }

  async function switchToChain(targetChain: typeof xlayerMainnet | typeof xlayerTestnet) {
    if (!provider) {
      setError("No injected wallet provider detected.");
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
        nextError instanceof Error ? nextError.message : "Failed to switch network. Please switch manually in your wallet.";
      setError(message);
    } finally {
      setIsSwitching(false);
    }
  }

  async function sendWithViem() {
    if (!provider || !address || !activeChain) {
      setError("Please connect your wallet and switch to X Layer mainnet or testnet.");
      return;
    }
    if (!effectiveRecipient) {
      setError("Please enter a recipient address.");
      return;
    }

    setError(null);
    setIsSending(true);
    setHash(null);

    try {
      const walletClient = getBuilderCodeWalletClient(dataSuffix);

      const nextHash = await walletClient.sendTransaction({
        account: address,
        chain: activeChain,
        to: effectiveRecipient,
        value: 0n,
      });

      setHash(nextHash);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to send transaction.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <main className="shell">
      <section className="hero">
        <div className="hero-card">
          <span className="eyebrow">Next.js + Viem + X Layer Builder Codes</span>
          <h1>Viem Minimal Verification Page</h1>
          <p>This page follows the Viem approach from the docs, configuring <span className="mono">dataSuffix</span> at the wallet client level. To launch OKX Wallet in the browser, it uses an injected provider with a <span className="mono">custom(window.ethereum)</span> transport.</p>
          <div className="hero-links">
            <a className="hero-link" href={builderCodeDocsUrl} rel="noreferrer" target="_blank">
              Official Integration Docs
            </a>
            <a className="hero-link" href={faucetUrl} rel="noreferrer" target="_blank">
              Get X Layer Testnet OKB
            </a>
          </div>
        </div>
      </section>

      <section className="demo-card">
        <div className="demo-pane">
          <h2 className="section-title">Doc-Style Viem Example</h2>
          <p className="section-copy">
            Connect your wallet and switch to the X Layer network you want to test. The send button will call <span className="mono">createWalletClient(..., dataSuffix)</span> to submit the transaction so you can inspect the HEX data in the wallet popup.
          </p>

          <div className="field-group">
            <label className="field-label" htmlFor="viem-builder-code">Builder Code</label>
            <input
              className="field-input mono"
              id="viem-builder-code"
              onChange={(e) => setBuilderCode(e.target.value)}
              placeholder={defaultBuilderCode}
              type="text"
              value={builderCode}
            />
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="viem-recipient">
              Recipient{" "}
              <span className="field-hint">
                {address ? `defaults to your address (${address})` : "defaults to connected wallet address"}
              </span>
            </label>
            <input
              className="field-input mono"
              id="viem-recipient"
              onChange={(e) => setRecipient(e.target.value)}
              placeholder={address ?? "connect wallet to auto-fill"}
              type="text"
              value={recipient}
            />
          </div>

          <div className="status-grid">
            <div className="status-chip">
              <span className="status-label">Wallet</span>
              <span className="status-value">{address ? "Connected" : "Disconnected"}</span>
            </div>
            <div className="status-chip">
              <span className="status-label">Network</span>
              <span className="status-value">{activeChain?.name ?? "Not connected or not X Layer"}</span>
            </div>
            <div className="status-chip">
              <span className="status-label">Recipient</span>
              <span className="status-value mono">{effectiveRecipient || "—"}</span>
            </div>
          </div>

          <div className="wallet-actions">
            <button className="ghost-button" onClick={() => void connectWallet()} type="button">
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </button>
            <button
              className="ghost-button"
              disabled={!address || chainId === xlayerMainnet.id || isSwitching}
              onClick={() => void switchToChain(xlayerMainnet)}
              type="button"
            >
              Switch to Mainnet
            </button>
            <button
              className="ghost-button"
              disabled={!address || chainId === xlayerTestnet.id || isSwitching}
              onClick={() => void switchToChain(xlayerTestnet)}
              type="button"
            >
              Switch to Testnet
            </button>
          </div>

          <div className="actions" style={{ marginTop: 20 }}>
            <button
              className="primary-button"
              disabled={!address || !activeChain || isSending || !effectiveRecipient}
              onClick={() => void sendWithViem()}
              type="button"
            >
              {isSending ? "Awaiting signature..." : "Send OKB"}
            </button>
          </div>

          {error ? <div className="callout callout-danger">{error}</div> : null}

          {hash ? (
            <div className="callout callout-success">
              Transaction sent: <span className="mono"> {hash}</span>{" "}
              <a href={`${explorerUrl}/tx/${hash}`} rel="noreferrer" target="_blank">
                View on OKX Explorer
              </a>
            </div>
          ) : null}
        </div>

        <aside className="meta-pane">
          <h2 className="section-title">Live Call Code</h2>
          <p className="meta-copy">The send button on this page directly executes the Viem code shown below.</p>

          <div className="meta-list">
            <div className="meta-card">
              <div className="meta-label">client.ts</div>
              <div className="meta-value mono">
                {`const walletClient = createWalletClient({`}
                <br />
                {`  dataSuffix: Attribution.toDataSuffix({ codes: ["${builderCode}"] }),`}
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
                {`  to: "${effectiveRecipient || "<recipient>"}",`}
                <br />
                {`  value: 0n,`}
                <br />
                {`})`}
              </div>
            </div>

            <div className="meta-card">
              <div className="meta-label">Current Address</div>
              <div className="meta-value mono">{address ?? "Not connected"}</div>
            </div>
          </div>

          <div className="fine-print">
            <div className="meta-label">dataSuffix on current client</div>
            <p className="mono-note">{dataSuffix}</p>
          </div>
        </aside>
      </section>
    </main>
  );
}
