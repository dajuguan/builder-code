import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DemoNav } from "@/components/demo-nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "X Layer Builder Code Integration & Verification",
  description: "A Next.js toolkit for integrating and verifying OKX X Layer Builder Code attribution — Wagmi, Viem, CLI script, and ERC-8021 encode/decode.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <DemoNav />
        {children}
      </body>
    </html>
  );
}
