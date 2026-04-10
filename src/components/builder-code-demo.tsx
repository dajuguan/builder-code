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
          <h1>Wagmi 最小验证页</h1>
          <p>
            这个页面只保留最接近文档的 Wagmi 示例。
            <span className="mono">Send OKB</span>
            按钮调用的是不额外传
            <span className="mono">dataSuffix</span>
            的
            <span className="mono">useSendTransaction()</span>
            ，用来直接验证 client-level 配置是否会自动生效。
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
          <h2 className="section-title">Doc-Style Wagmi Example</h2>
          <p className="section-copy">
            先连接钱包，再切到你要测试的 X Layer 网络。然后点击发送按钮，观察 OKX
            Wallet 弹窗里的 HEX data 是否为空。
          </p>

          <div className="status-grid">
            <div className="status-chip">
              <span className="status-label">钱包状态</span>
              <span className="status-value">{isConnected ? "已连接" : "未连接"}</span>
            </div>
            <div className="status-chip">
              <span className="status-label">当前网络</span>
              <span className="status-value">{chain?.name ?? "尚未连接钱包"}</span>
            </div>
            <div className="status-chip">
              <span className="status-label">测试地址</span>
              <span className="status-value mono">{defaultRecipientAddress}</span>
            </div>
          </div>

          <div className="wallet-actions">
            {isConnected ? (
              <button className="ghost-button" onClick={() => disconnect()} type="button">
                断开钱包
              </button>
            ) : (
              <button
                className="ghost-button"
                onClick={() => connect({ connector })}
                type="button"
              >
                {isConnecting ? "连接中..." : "连接钱包"}
              </button>
            )}
            <button
              className="ghost-button"
              disabled={!isConnected || chainId === xlayerMainnet.id || isSwitching}
              onClick={() => switchChain({ chainId: xlayerMainnet.id })}
              type="button"
            >
              切到主网
            </button>
            <button
              className="ghost-button"
              disabled={!isConnected || chainId === xlayerTestnet.id || isSwitching}
              onClick={() => switchChain({ chainId: xlayerTestnet.id })}
              type="button"
            >
              切到测试网
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
              {isSending ? "等待钱包签名..." : "Send OKB via useSendTransaction"}
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
              {isSendingCalls ? "等待钱包签名..." : "Send OKB via useSendCalls"}
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

          {connectError ? <div className="callout callout-danger">{connectError.message}</div> : null}
          {switchError ? <div className="callout callout-danger">{switchError.message}</div> : null}
          {sendError ? <div className="callout callout-danger">{sendError.message}</div> : null}
          {sendCallsError ? (
            <div className="callout callout-danger">{sendCallsError.message}</div>
          ) : null}

          {hash ? (
            <div className="callout callout-success">
              交易已发送：
              <span className="mono"> {hash}</span>
              {" "}
              <a href={`${explorerUrl}/tx/${hash}`} rel="noreferrer" target="_blank">
                在 OKLink 查看
              </a>
            </div>
          ) : null}

          {callsId ? (
            <div className="callout callout-success">
              useSendCalls 已提交：
              <span className="mono"> {callsId.id}</span>
            </div>
          ) : null}
        </div>

        <aside className="meta-pane">
          <h2 className="section-title">实际调用代码</h2>
          <p className="meta-copy">
            页面里的发送按钮会直接执行下面这段最小代码。
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
              <div className="meta-label">当前地址</div>
              <div className="meta-value mono">{address ?? "未连接"}</div>
            </div>
          </div>

          <div className="fine-print">
            <div className="meta-label">当前 config 上的 dataSuffix</div>
            <p className="mono-note">{dataSuffix}</p>
            <p className="note">
              如果这个页面里钱包弹窗 HEX data 为空，就能非常直接地说明：
              当前默认 Wagmi connector 路径下，config-level
              <span className="mono">dataSuffix</span>
              没有自动进入最终的发送请求。
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}
