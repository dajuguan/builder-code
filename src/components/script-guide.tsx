"use client";

export function ScriptGuide() {
  return (
    <main className="shell">
      <section className="hero">
        <div className="hero-card">
          <span className="eyebrow">Shell Script + X Layer Builder Codes</span>
          <h1>CLI Script Guide</h1>
          <p>
            <span className="mono">send-erc8021.sh</span> sends ERC-8021 attributed transactions on
            a fixed interval using only <span className="mono">python3</span> and{" "}
            <span className="mono">curl</span> — no extra dependencies required. The script derives
            your address from the private key, encodes the Builder Code as an ERC-8021 Schema 0 data
            suffix, signs the transaction locally, and broadcasts it via raw JSON-RPC.
          </p>
        </div>
      </section>

      <section className="demo-card">
        <div className="demo-pane">
          <h2 className="section-title">Quick Start</h2>
          <p className="section-copy">
            Make the script executable, then run it with your private key and Builder Code. It will
            print your derived address and balance on startup, then send one transaction per minute.
            The default RPC endpoints are public and may be rate-limited — use <span className="mono">-r</span> to
            pass a private endpoint if you hit errors.
          </p>

          <div className="meta-list">
            <div className="meta-card">
              <div className="meta-label">Step 1 — Download the script</div>
              <div className="meta-value mono">{"curl -O http://xxx.com/send-erc8021.sh"}</div>
            </div>

            <div className="meta-card">
              <div className="meta-label">Step 2 — Make executable</div>
              <div className="meta-value mono">{"chmod +x send-erc8021.sh"}</div>
            </div>

            <div className="meta-card">
              <div className="meta-label">Step 3 — Run on X Layer Testnet (default)</div>
              <div className="meta-value mono">
                {"./send-erc8021.sh \\"}
                <br />
                {"  -k 0xYOUR_PRIVATE_KEY \\"}
                <br />
                {"  -b YOUR-BUILDER-CODE"}
              </div>
            </div>

            <div className="meta-card">
              <div className="meta-label">Step 4 — Run on X Layer Mainnet</div>
              <div className="meta-value mono">
                {"./send-erc8021.sh \\"}
                <br />
                {"  -k 0xYOUR_PRIVATE_KEY \\"}
                <br />
                {"  -b YOUR-BUILDER-CODE \\"}
                <br />
                {"  -n mainnet"}
              </div>
            </div>

            <div className="meta-card">
              <div className="meta-label">Custom RPC and interval</div>
              <div className="meta-value mono">
                {"./send-erc8021.sh \\"}
                <br />
                {"  -k 0xYOUR_PRIVATE_KEY \\"}
                <br />
                {"  -b YOUR-BUILDER-CODE \\"}
                <br />
                {"  -r https://your-rpc.example.com \\"}
                <br />
                {"  -i 30"}
                <br />
                {"  # sends every 30 seconds"}
              </div>
            </div>
          </div>
        </div>

        <aside className="meta-pane">
          <h2 className="section-title">All Options</h2>
          <p className="meta-copy">Every flag is listed below. Only <span className="mono">-k</span> and <span className="mono">-b</span> are required.</p>

          <div className="meta-list">
            <div className="meta-card">
              <div className="meta-label"><span className="mono">-k</span> / <span className="mono">--key</span> &nbsp;(required)</div>
              <div className="meta-value">Sender private key, <span className="mono">0x</span>-prefixed. The script derives the address from this key — the same address is used as the recipient so no OKB leaves your wallet.</div>
            </div>

            <div className="meta-card">
              <div className="meta-label"><span className="mono">-b</span> / <span className="mono">--builder</span> &nbsp;(required)</div>
              <div className="meta-value">Your X Layer Builder Code string, e.g. <span className="mono">my-app-code</span>. Encoded into the transaction <span className="mono">data</span> field as ERC-8021 Schema 0.</div>
            </div>

            <div className="meta-card">
              <div className="meta-label"><span className="mono">-n</span> / <span className="mono">--network</span></div>
              <div className="meta-value"><span className="mono">testnet</span> (default, chain 1952) or <span className="mono">mainnet</span> (chain 196). Uses the official X Layer public RPC unless overridden.</div>
            </div>

            <div className="meta-card">
              <div className="meta-label"><span className="mono">-r</span> / <span className="mono">--rpc</span></div>
              <div className="meta-value">Override the RPC endpoint, e.g. a private node or a load-balanced URL.</div>
            </div>

            <div className="meta-card">
              <div className="meta-label"><span className="mono">-i</span> / <span className="mono">--interval</span></div>
              <div className="meta-value">Seconds between sends. Default: <span className="mono">60</span>. The first transaction is sent immediately on startup.</div>
            </div>
          </div>
        </aside>
      </section>

      <section className="demo-card" style={{ marginTop: 24 }}>
        <div className="demo-pane">
          <h2 className="section-title">Expected Output</h2>
          <p className="section-copy">
            On startup the script prints your address, balance, and data suffix so you can verify
            everything before the first send.
          </p>

          <div className="meta-card" style={{ marginTop: 20 }}>
            <div className="meta-label">Terminal output</div>
            <div className="meta-value mono" style={{ whiteSpace: "pre", overflowX: "auto" }}>
              {`════════════════════════════════════════════════════
  ERC-8021 Attribution Sender
════════════════════════════════════════════════════
  Network:      testnet (chain 1952)
  RPC:          https://testrpc.xlayer.tech/terigon
  Builder Code: your-builder-code
  Interval:     60s
════════════════════════════════════════════════════

Address:      0xYourDerivedAddress
Data suffix:  0x796f75722d6275696c6465722d636f6465100080218021802180218021802180218021
Chain ID:     1952
RPC:          https://testrpc.xlayer.tech/terigon
Interval:     60s

Balance:      0.199999 OKB  (199999130000000000 wei)

Press Ctrl+C to stop.

[2026-04-10 23:32:19] #1 nonce=2  gas_price=0.02 gwei  gas_limit=23312  est_cost=0.00000047 OKB  balance=0.19999913 OKB
[2026-04-10 23:32:19] #1 ✓ 0xabc123...
  Explorer: https://www.okx.com/web3/explorer/xlayer-test/tx/0xabc123...
  Next send in 60s...`}
            </div>
          </div>
        </div>

        <aside className="meta-pane">
          <h2 className="section-title">How It Works</h2>
          <p className="meta-copy">Everything runs in pure Python stdlib + curl. No pip, no cast, no node.</p>

          <div className="meta-list">
            <div className="meta-card">
              <div className="meta-label">Address derivation</div>
              <div className="meta-value">secp256k1 scalar multiplication on the private key → uncompressed public key → keccak256 → last 20 bytes.</div>
            </div>

            <div className="meta-card">
              <div className="meta-label">ERC-8021 encoding (Schema 0)</div>
              <div className="meta-value mono">
                {"codes_ascii  ← UTF-8 bytes of Builder Code"}
                <br />
                {"codes_len    ← 1-byte length"}
                <br />
                {"schema_id    ← 0x00 (canonical registry)"}
                <br />
                {"erc_suffix   ← 0x80218021... (16 bytes)"}
                <br />
                {"data = concat(codes_ascii, codes_len,"}
                <br />
                {"             schema_id, erc_suffix)"}
              </div>
            </div>

            <div className="meta-card">
              <div className="meta-label">Transaction signing</div>
              <div className="meta-value">RFC-6979 deterministic k, ECDSA with EIP-2 low-s enforcement (recovery bit flipped when s is flipped), EIP-155 replay protection via <span className="mono">v = chainId × 2 + 35 + parity</span>.</div>
            </div>

            <div className="meta-card">
              <div className="meta-label">Broadcast</div>
              <div className="meta-value"><span className="mono">eth_getTransactionCount</span> → <span className="mono">eth_gasPrice</span> → <span className="mono">eth_getBalance</span> → sign → <span className="mono">eth_sendRawTransaction</span>. All via JSON-RPC over Python <span className="mono">urllib</span>.</div>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
