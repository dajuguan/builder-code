# X Layer Builder Code Integration & Verification Demo

A Next.js toolkit for integrating and verifying OKX X Layer Builder Code attribution. Covers four tools across four pages:

- `/wagmi` — Wagmi provider-based integration verification
- `/viem` — Viem client-based integration verification
- `/script` — CLI script guide (`send-erc8021.sh`) for sending attributed transactions from the terminal
- `/checker` — ERC-8021 encode/decode tool for inspecting attribution suffixes

Reference docs:
- https://web3.okx.com/xlayer/docs/developer/builder-codes/integration

## Quick Start

1. Install dependencies

```bash
npm install
```

2. Start the dev server

```bash
npm run dev
```

Open `http://localhost:3000` — it will redirect to `/wagmi` automatically. Use the top nav to switch between pages.

No environment variables are required. Builder Code and recipient address are configured directly in the UI on each page.

## Project Structure

```
app/
  wagmi/        → Wagmi verification page
  viem/         → Viem verification page
  script/       → CLI script guide
  checker/      → ERC-8021 encode/decode tool

src/
  components/
    builder-code-demo.tsx       → Wagmi demo component
    viem-builder-code-demo.tsx  → Viem demo component
    script-guide.tsx            → CLI script guide component
    checker-demo.tsx            → ERC-8021 checker component
    demo-nav.tsx                → Top navigation
  lib/
    xlayer.ts       → X Layer chain config, Builder Code, dataSuffix
    wagmi.ts        → Wagmi base config
    attribution.ts  → ERC-8021 encode/decode logic (pure TS, no deps)
    viem-wallet-client.ts

public/
  send-erc8021.sh   → Downloadable CLI script
```

## Core Implementation

### Wagmi / Viem — client-level dataSuffix

```ts
export const dataSuffix = Attribution.toDataSuffix({
  codes: [builderCode],
});

// Wagmi
export const config = createConfig({
  chains: [xlayerTestnet],
  connectors: [injected()],
  transports: { [xlayerTestnet.id]: http(...) },
  dataSuffix,
});

// Viem
const walletClient = createWalletClient({
  dataSuffix,
  transport: custom(window.ethereum),
});
```

No `dataSuffix` is passed at the individual transaction level — this intentionally tests whether the client-level config takes effect automatically.

### CLI script — `send-erc8021.sh`

Sends attributed transactions on a fixed interval using only `python3` and `curl`. No Foundry, no Node.js required at runtime.

```bash
./send-erc8021.sh -k 0xYOUR_PRIVATE_KEY -b YOUR-BUILDER-CODE
./send-erc8021.sh -k 0xYOUR_PRIVATE_KEY -b YOUR-BUILDER-CODE -n mainnet
```

## Notes

- The demo defaults to `X Layer Testnet` for safer local testing.
- Pages closely mirror the official docs so you can directly observe whether `HEX data` in the OKX Wallet popup is populated.
- Use `/checker` to encode a Builder Code into a suffix and paste it into any tx's `data` field, or to decode an existing tx's input data to verify attribution.
- To fully verify that attribution is recorded, check OKLink or the developer dashboard per the official docs.
