"use client";

import { useState } from "react";
import { decodeAttributionFromHex, encodeAttribution, type Schema } from "@/lib/attribution";

type Mode = "encode" | "decode";

export function CheckerDemo() {
  const [mode, setMode] = useState<Mode>("encode");
  const [schema, setSchema] = useState<Extract<Schema, "0" | "1">>("0");
  const [codesText, setCodesText] = useState("");
  const [registryAddress, setRegistryAddress] = useState("");
  const [chainIdText, setChainIdText] = useState("");
  const [hexInput, setHexInput] = useState("");
  const [result, setResult] = useState<
    | { ok: true; label: string; lines: { key: string; value: string }[] }
    | { ok: false; error: string }
    | null
  >(null);

  function handleEncode() {
    const encoded = encodeAttribution({
      schema,
      codesText,
      codeRegistryAddress: registryAddress,
      chainIdText,
      cborDataHex: "",
    });
    if (!encoded.ok) {
      setResult({ ok: false, error: encoded.error });
      return;
    }
    setHexInput(encoded.suffix);
    setResult({
      ok: true,
      label: `Schema ${schema} suffix`,
      lines: [{ key: "data suffix", value: encoded.suffix }],
    });
  }

  function handleDecode() {
    const decoded = decodeAttributionFromHex(hexInput);
    if (!decoded.ok) {
      setResult({ ok: false, error: decoded.error });
      return;
    }
    const d = decoded.decoded;
    if (d.schemaId === 0) {
      setResult({
        ok: true,
        label: "Schema 0 — Canonical Registry",
        lines: [{ key: "codes", value: d.codes.join(", ") }],
      });
      return;
    }
    if (d.schemaId === 1) {
      setResult({
        ok: true,
        label: "Schema 1 — Custom Registry",
        lines: [
          { key: "codes", value: d.codes.join(", ") },
          { key: "registry address", value: d.codeRegistry.address },
          { key: "chain ID", value: String(d.codeRegistry.chainId) },
        ],
      });
      return;
    }
    if (d.schemaId === 2) {
      setResult({
        ok: true,
        label: "Schema 2 — CBOR",
        lines: [{ key: "cbor data", value: d.cborDataHex }],
      });
      return;
    }
  }

  return (
    <main className="shell">
      <section className="hero">
        <div className="hero-card">
          <span className="eyebrow">ERC-8021 Attribution Checker</span>
          <h1>Encode / Decode</h1>
          <p>Encode builder codes into an ERC-8021 data suffix, or decode raw transaction input data to extract attribution metadata.</p>
        </div>
      </section>

      <section className="demo-card">
        <div className="demo-pane">
          {/* Mode toggle */}
          <div className="wallet-actions" style={{ marginBottom: 24 }}>
            <button
              className={mode === "encode" ? "primary-button" : "ghost-button"}
              onClick={() => { setMode("encode"); setResult(null); }}
              type="button"
            >
              Encode
            </button>
            <button
              className={mode === "decode" ? "primary-button" : "ghost-button"}
              onClick={() => { setMode("decode"); setResult(null); }}
              type="button"
            >
              Decode
            </button>
          </div>

          {mode === "encode" && (
            <>
              <h2 className="section-title">Encode Attribution</h2>

              {/* Schema selector */}
              <div style={{ margin: "16px 0 20px" }}>
                <div className="meta-label" style={{ marginBottom: 8 }}>Schema</div>
                <div className="wallet-actions">
                  {(["0", "1"] as const).map((s) => (
                    <button
                      key={s}
                      className={schema === s ? "primary-button" : "ghost-button"}
                      onClick={() => setSchema(s)}
                      type="button"
                      style={{ minHeight: 38, padding: "0 14px", fontSize: "0.9rem" }}
                    >
                      {s === "0" ? "Schema 0 — Canonical" : "Schema 1 — Custom Registry"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="stack">
                <div className="field">
                  <label>Builder codes (comma-separated)</label>
                  <input
                    placeholder="my-app, my-wallet"
                    value={codesText}
                    onChange={(e) => setCodesText(e.target.value)}
                  />
                </div>

                {schema === "1" && (
                  <>
                    <div className="field">
                      <label>Registry contract address</label>
                      <input
                        placeholder="0xabc..."
                        value={registryAddress}
                        onChange={(e) => setRegistryAddress(e.target.value)}
                      />
                    </div>
                    <div className="field">
                      <label>Registry chain ID</label>
                      <input
                        placeholder="196"
                        value={chainIdText}
                        onChange={(e) => setChainIdText(e.target.value)}
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="actions" style={{ marginTop: 20 }}>
                <button
                  className="primary-button"
                  disabled={!codesText.trim()}
                  onClick={handleEncode}
                  type="button"
                >
                  Generate suffix
                </button>
              </div>
            </>
          )}

          {mode === "decode" && (
            <>
              <h2 className="section-title">Decode Attribution</h2>
              <p className="section-copy" style={{ marginBottom: 20 }}>
                Paste the full transaction input data or just the ERC-8021 suffix. The decoder reads backwards from the end, so any leading calldata is ignored.
              </p>
              <div className="field">
                <label>Transaction input data (hex)</label>
                <input
                  placeholder="0x..."
                  value={hexInput}
                  onChange={(e) => setHexInput(e.target.value)}
                />
              </div>
              <div className="actions" style={{ marginTop: 20 }}>
                <button
                  className="primary-button"
                  disabled={!hexInput.trim()}
                  onClick={handleDecode}
                  type="button"
                >
                  Decode
                </button>
              </div>
            </>
          )}

          {result && !result.ok && (
            <div className="callout callout-danger" style={{ marginTop: 20 }}>{result.error}</div>
          )}
        </div>

        <aside className="meta-pane">
          <h2 className="section-title">Result</h2>

          {!result && (
            <p className="meta-copy">Output will appear here after you encode or decode.</p>
          )}

          {result?.ok && (
            <>
              <p className="meta-copy" style={{ marginBottom: 16 }}>{result.label}</p>
              <div className="meta-list">
                {result.lines.map(({ key, value }) => (
                  <div className="meta-card" key={key}>
                    <div className="meta-label">{key}</div>
                    <div className="meta-value mono" style={{ wordBreak: "break-all" }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Show hex input when encoding so user can copy and paste into decode */}
              {mode === "encode" && hexInput && (
                <div className="fine-print">
                  <div className="meta-label">Paste into Decode to verify</div>
                  <p className="mono-note" style={{ wordBreak: "break-all", marginTop: 8 }}>{hexInput}</p>
                </div>
              )}
            </>
          )}

          <div className="fine-print">
            <div className="meta-label">ERC-8021 marker (16 bytes)</div>
            <p className="mono-note">0x80218021802180218021802180218021</p>
          </div>
        </aside>
      </section>
    </main>
  );
}
