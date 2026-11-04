import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  // Keep each application independently buildable from its Vercel project root.
};

export default createNextIntlPlugin()(nextConfig);
