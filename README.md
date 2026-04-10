# X Layer Builder Code Next.js Demo

A minimal runnable Next.js demo split into two verification pages:

- `/wagmi` — Wagmi provider-based version
- `/viem` — Viem client-based version

Used to verify whether the OKX X Layer Builder Code actually reaches the final wallet request under each integration approach.

Reference docs:
- https://web3.okx.com/xlayer/docs/developer/builder-codes/integration

## Quick Start

1. Install dependencies

```bash
npm install
```

2. Copy the environment variables

```bash
cp .env.example .env.local
```

3. Fill in your values in `.env.local`

```bash
NEXT_PUBLIC_XLAYER_BUILDER_CODE=your-builder-code
NEXT_PUBLIC_XLAYER_RECIPIENT_ADDRESS=your-recipient-address
NEXT_PUBLIC_XLAYER_AMOUNT=0.0001
```

4. Start the dev server

```bash
npm run dev
```

Open `http://localhost:3000` — it will redirect to `/wagmi` automatically. Use the top nav to switch between `/wagmi` and `/viem`.

## Project Structure

- `src/lib/xlayer.ts` — X Layer Testnet config, Builder Code, `dataSuffix`
- `app/wagmi/page.tsx` — Wagmi sub-page
- `app/viem/page.tsx` — Viem sub-page
- `src/lib/wagmi.ts` — Wagmi base config
- `src/components/builder-code-demo.tsx` — Wagmi verification page
- `src/components/viem-builder-code-demo.tsx` — Viem verification page

## Core Implementation

```ts
export const dataSuffix = Attribution.toDataSuffix({
  codes: [builderCode],
});

export const config = createConfig({
  chains: [xlayerTestnet],
  connectors: [injected()],
  transports: {
    [xlayerTestnet.id]: http(xlayerTestnet.rpcUrls.default.http[0]),
  },
  dataSuffix,
});
```

The page button calls:

```ts
sendTransaction({
  to: "0x8d7c41aa990234b2d7e064df150a4228ed984648",
});
```

No `dataSuffix` is passed at the individual transaction level — this intentionally tests whether the client-level config from the docs takes effect automatically.

## Notes

- The demo defaults to `X Layer Testnet` for safer local testing.
- Pages closely mirror the official docs so you can directly observe whether `HEX data` in the OKX Wallet popup is populated.
- If you haven't applied for an official Builder Code yet, you can register on testnet following the OKX docs.
- To fully verify that attribution is working, check the transaction attribution results in OKLink or the developer dashboard per the official docs.
