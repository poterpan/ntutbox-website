import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "北科盒子",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant-TW">
      <body className="antialiased">{children}</body>
    </html>
  );
}
