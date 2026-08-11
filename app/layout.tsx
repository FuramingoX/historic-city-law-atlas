import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "城保法研｜历史文化名城保护法规数据库",
  description: "59份历史文化名城保护法规的结构化检索、比较与证据审查平台。",
  openGraph: {
    title: "历史文化名城保护法规数据库",
    description: "59份历史文化名城保护法规、14项制度指标与可回链的条文证据。",
    type: "website",
    images: [
      {
        url: "/historic-city-law-atlas/og.png",
        width: 1792,
        height: 909,
        alt: "历史文化名城保护法规数据库",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "历史文化名城保护法规数据库",
    description: "59份历史文化名城保护法规、14项制度指标与可回链的条文证据。",
    images: ["/historic-city-law-atlas/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}