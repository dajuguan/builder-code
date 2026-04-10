# X Layer Builder Code Next.js Demo

这是一个最小可运行的 Next.js 示例，用最接近 OKX X Layer 文档的 Wagmi 写法验证 client-level `dataSuffix` 是否真的会自动进入 `useSendTransaction()` 的钱包请求。

参考文档：
- https://web3.okx.com/xlayer/docs/developer/builder-codes/integration

## 快速开始

1. 安装依赖

```bash
npm install
```

2. 复制环境变量

```bash
cp .env.example .env.local
```

3. 在 `.env.local` 里替换这些值

```bash
NEXT_PUBLIC_XLAYER_BUILDER_CODE=你的-builder-code
NEXT_PUBLIC_XLAYER_RECIPIENT_ADDRESS=你的收款地址
NEXT_PUBLIC_XLAYER_AMOUNT=0.0001
```

4. 启动开发环境

```bash
npm run dev
```

打开 `http://localhost:3000`。

## 代码结构

- `src/lib/xlayer.ts`
  定义 X Layer Testnet、Builder Code、`dataSuffix`
- `src/lib/wagmi.ts`
  按文档方式配置 `createConfig({ dataSuffix })`
- `src/components/builder-code-demo.tsx`
  一个最小页面，直接调用文档风格的 `useSendTransaction()`

## 核心实现

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

页面按钮调用的是：

```ts
sendTransaction({
  to: "0x8d7c41aa990234b2d7e064df150a4228ed984648",
  value: parseEther("0.0001"),
});
```

也就是说，这里故意不在单笔交易里传 `dataSuffix`，只验证文档里的 client-level 配置是否会自动生效。

## 注意

- 示例默认使用 `X Layer Testnet`，更安全，方便你先联调。
- 页面会尽量贴近文档写法，方便直接观察 OKX Wallet 弹窗里的 `HEX data` 是否为空。
- 如果你还没申请正式 Builder Code，可以先按 OKX 文档在测试网上注册。
- 真正验证 attribution 是否生效，还需要按官方文档去 OKLink 或开发者后台核对交易归因结果。
