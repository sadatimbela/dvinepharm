import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false, // Disabled to prevent Supabase gotrue-js lock contention from double-mount
};

export default nextConfig;
