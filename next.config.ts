import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      { source: '/cms/:tab', destination: '/cms?tab=:tab' },
      { source: '/games/:engine', destination: '/games?engine=:engine' },
      { source: '/library/:category', destination: '/library?category=:category' }
    ];
  },
};

export default nextConfig;
