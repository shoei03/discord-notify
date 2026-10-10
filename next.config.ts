import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // 画像は使わないので、最適化エンドポイント（/_next/image）を攻撃面として残さない
  images: { unoptimized: true },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};

export default nextConfig;
