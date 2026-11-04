import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep each application independently buildable from its Vercel project root.
};

export default createNextIntlPlugin()(nextConfig);
