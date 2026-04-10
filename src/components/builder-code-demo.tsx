"use client";

import {
  useAccount,
  useConnect,
  useDisconnect,
  useSendCalls,
  useSendTransaction,
  useSwitchChain,
} from "wagmi";
import { parseEther } from "viem";
import { config } from "@/lib/wagmi";
import {
  builderCodeConfigured,
  builderCodeDocsUrl,
  dataSuffix,
  defaultRecipientAddress,
  faucetUrl,
  xlayerMainnet,
  xlayerTestnet,
} from "@/lib/xlayer";

export function BuilderCodeDemo() {
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
          <p>This page keeps only the closest-to-docs Wagmi example. The <span className="mono">Send OKB</span> button calls <span className="mono">useSendTransaction()</span> without passing an extra <span className="mono">dataSuffix</span>, to directly verify whether the client-level config takes effect automatically.</p>
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
              <span className="status-value mono">{defaultRecipientAddress}</span>
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
              disabled={!isConnected || !isSupportedChain || isSending}
              onClick={() =>
                mutate({
                  to: defaultRecipientAddress,
                  value: parseEther("0.000"),
                })
              }
              type="button"
            >
              {isSending ? "Awaiting signature..." : "Send OKB via useSendTransaction"}
            </button>
            <button
              className="ghost-button"
              disabled={!isConnected || !isSupportedChain || isSendingCalls}
              onClick={() =>
                sendCalls({
                  calls: [
                    {
                      to: defaultRecipientAddress,
                    },
                  ],
                  capabilities: {
                    dataSuffix: {
                      value: dataSuffix,
                      optional: true,
                    },
                  },
                })
              }
              type="button"
            >
              {isSendingCalls ? "Awaiting signature..." : "Send OKB via useSendCalls"}
            </button>
          </div>

          {!builderCodeConfigured ? (
            <div className="callout callout-warning">
              You are still using a placeholder Builder Code. Replace <span className="mono">NEXT_PUBLIC_XLAYER_BUILDER_CODE</span> in <span className="mono">.env.local</span> and restart the app.
            </div>
          ) : null}

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
                {`const DATA_SUFFIX = Attribution.toDataSuffix({ codes: ["YOUR-BUILDER-CODE"] })`}
                <br />
                {`createConfig({ chains: [xlayerMainnet, xlayerTestnet], dataSuffix: DATA_SUFFIX })`}
              </div>
            </div>

            <div className="meta-card">
              <div className="meta-label">button.tsx</div>
              <div className="meta-value mono">
                {`sendTransaction({`}
                <br />
                {`  to: "${defaultRecipientAddress}",`}
                <br />
                {`  value: parseEther("0.000"),`}
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
