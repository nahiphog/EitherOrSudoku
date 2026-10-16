import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  assetPrefix: process.env.NEXT_PUBLIC_GITHUB_PAGES_BASE || undefined,
};

export default nextConfig;
