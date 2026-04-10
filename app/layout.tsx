import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DemoNav } from "@/components/demo-nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "X Layer Builder Code Demo",
  description: "A Next.js example for sending X Layer transactions with Builder Code attribution.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <DemoNav />
        {children}
      </body>
    </html>
  );
}
