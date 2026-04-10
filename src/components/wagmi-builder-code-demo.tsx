"use client";

import { useState } from "react";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useSendCalls,
  useSendTransaction,
  useSwitchChain,
} from "wagmi";
import { type Address } from "viem";
import { config } from "@/lib/wagmi";
import {
  builderCodeDocsUrl,
  defaultBuilderCode,
  faucetUrl,
  makeDataSuffix,
  setBuilderCode as syncBuilderCode,
  xlayerMainnet,
  xlayerTestnet,
} from "@/lib/xlayer";

export function WagmiBuilderCodeDemo() {
  const { address, chain, chainId, isConnected } = useAccount();
  const { connect, error: connectError, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, error: switchError, isPending: isSwitching } = useSwitchChain();
  const { mutate, data: hash, error: sendError, isPending: isSending } =
    useSendTransaction();
  const {
    mutate: sendCalls,
    data: callsId,
    error: sendCallsError,
    isPending: isSendingCalls,
  } = useSendCalls();

  const [builderCode, setBuilderCode] = useState(defaultBuilderCode);
  const [recipient, setRecipient] = useState<string>("");

  const effectiveRecipient = (recipient.trim() || address || "") as Address;
  const dataSuffix = makeDataSuffix(builderCode);

  const connector = config.connectors[0];
  const isSupportedChain =
    chainId === xlayerMainnet.id || chainId === xlayerTestnet.id;
  const explorerUrl =
    chain?.blockExplorers?.default.url ?? xlayerTestnet.blockExplorers.default.url;

  return (
    <main className="shell">
      <section className="hero">
        <div className="hero-card">
          <span className="eyebrow">Next.js + Wagmi + X Layer Builder Codes</span>
          <h1>Wagmi Minimal Verification Page</h1>
          <p>This page keeps only the closest-to-docs Wagmi example. The <span className="mono">Send OKB</span> button calls <span className="mono">useSendTransaction()</span> with the ERC-8021 <span className="mono">dataSuffix</span> appended directly as the transaction <span className="mono">data</span> field.</p>
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
          <h2 className="section-title">Doc-Style Wagmi Example</h2>
          <p className="section-copy">
            Connect your wallet, then switch to the X Layer network you want to test. Click the send button and check whether the HEX data in the OKX Wallet popup is empty.
          </p>

          <div className="field-group">
            <label className="field-label" htmlFor="wagmi-builder-code">Builder Code</label>
            <input
              className="field-input mono"
              id="wagmi-builder-code"
              onChange={(e) => {
                syncBuilderCode(e.target.value);
                setBuilderCode(e.target.value);
              }}
              placeholder={defaultBuilderCode}
              type="text"
              value={builderCode}
            />
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="wagmi-recipient">
              Recipient{" "}
              <span className="field-hint">
                {address ? `defaults to your address (${address})` : "defaults to connected wallet address"}
              </span>
            </label>
            <input
              className="field-input mono"
              id="wagmi-recipient"
              onChange={(e) => setRecipient(e.target.value)}
              placeholder={address ?? "connect wallet to auto-fill"}
              type="text"
              value={recipient}
            />
          </div>

          <div className="status-grid">
            <div className="status-chip">
              <span className="status-label">Wallet</span>
              <span className="status-value">{isConnected ? "Connected" : "Disconnected"}</span>
            </div>
            <div className="status-chip">
              <span className="status-label">Network</span>
              <span className="status-value">{chain?.name ?? "Not connected"}</span>
            </div>
            <div className="status-chip">
              <span className="status-label">Recipient</span>
              <span className="status-value mono">{effectiveRecipient || "—"}</span>
            </div>
          </div>

          <div className="wallet-actions">
            {isConnected ? (
              <button className="ghost-button" onClick={() => disconnect()} type="button">
                Disconnect
              </button>
            ) : (
              <button
                className="ghost-button"
                onClick={() => connect({ connector })}
                type="button"
              >
                {isConnecting ? "Connecting..." : "Connect Wallet"}
              </button>
            )}
            <button
              className="ghost-button"
              disabled={!isConnected || chainId === xlayerMainnet.id || isSwitching}
              onClick={() => switchChain({ chainId: xlayerMainnet.id })}
              type="button"
            >
              Switch to Mainnet
            </button>
            <button
              className="ghost-button"
              disabled={!isConnected || chainId === xlayerTestnet.id || isSwitching}
              onClick={() => switchChain({ chainId: xlayerTestnet.id })}
              type="button"
            >
              Switch to Testnet
            </button>
          </div>

          <div className="actions" style={{ marginTop: 20 }}>
            <button
              className="primary-button"
              disabled={!isConnected || !isSupportedChain || isSending || !effectiveRecipient}
              onClick={() =>
                mutate({
                  to: effectiveRecipient,
                  value: 0n,
                  data: dataSuffix,
                })
              }
              type="button"
            >
              {isSending ? "Awaiting signature..." : "Send OKB via useSendTransaction"}
            </button>
            <button
              className="ghost-button"
              disabled={!isConnected || !isSupportedChain || isSendingCalls || !effectiveRecipient}
              onClick={() =>
                sendCalls({
                  calls: [{ to: effectiveRecipient }],
                  capabilities: {
                    dataSuffix: { value: dataSuffix, optional: true },
                  },
                })
              }
              type="button"
            >
              {isSendingCalls ? "Awaiting signature..." : "Send OKB via useSendCalls"}
            </button>
          </div>

          {connectError ? <div className="callout callout-danger">{connectError.message}</div> : null}
          {switchError ? <div className="callout callout-danger">{switchError.message}</div> : null}
          {sendError ? <div className="callout callout-danger">{sendError.message}</div> : null}
          {sendCallsError ? (
            <div className="callout callout-danger">{sendCallsError.message}</div>
          ) : null}

          {hash ? (
            <div className="callout callout-success">
              Transaction sent: <span className="mono"> {hash}</span>
              {" "}
              <a href={`${explorerUrl}/tx/${hash}`} rel="noreferrer" target="_blank">
                View on OKLink
              </a>
            </div>
          ) : null}

          {callsId ? (
            <div className="callout callout-success">
              useSendCalls submitted: <span className="mono"> {callsId.id}</span>
            </div>
          ) : null}
        </div>

        <aside className="meta-pane">
          <h2 className="section-title">Live Call Code</h2>
          <p className="meta-copy">
            The send buttons on this page directly execute the minimal code shown below.
          </p>

          <div className="meta-list">
            <div className="meta-card">
              <div className="meta-label">config.ts</div>
              <div className="meta-value mono">
                {`const DATA_SUFFIX = Attribution.toDataSuffix({ codes: ["${builderCode}"] })`}
                <br />
                {`createConfig({ chains: [xlayerMainnet, xlayerTestnet], dataSuffix: DATA_SUFFIX })`}
              </div>
            </div>

            <div className="meta-card">
              <div className="meta-label">button.tsx</div>
              <div className="meta-value mono">
                {`sendTransaction({`}
                <br />
                {`  to: "${effectiveRecipient || "<recipient>"}",`}
                <br />
                {`  value: 0n,`}
                <br />
                {`  data: dataSuffix, // appended as calldata`}
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
            <div className="meta-label">dataSuffix on current config</div>
            <p className="mono-note">{dataSuffix}</p>
            <p className="note">
              If the HEX data in the wallet popup is empty on this page, it directly confirms that the config-level <span className="mono">dataSuffix</span> is not automatically included in the final send request through the default Wagmi connector path.
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}
