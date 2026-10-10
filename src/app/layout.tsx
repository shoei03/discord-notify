import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "discord-notify",
  description: "GitHub の Issue / PR を Discord フォーラムに通知する Webhook",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">{children}</body>
    </html>
  );
}
