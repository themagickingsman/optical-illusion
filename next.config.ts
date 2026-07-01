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
      { source: '/cms/:tab', destination: '/?tab=:tab' },
      
      { source: '/about', destination: '/?tab=build&preview=home' },
      { source: '/hire', destination: '/?tab=build&preview=hire' },
      { source: '/process', destination: '/?tab=build&preview=process' },
      
      { source: '/games', destination: '/?tab=build&preview=games' },
      { source: '/games/:engine', destination: '/?tab=build&preview=games&engine=:engine' },
      
      { source: '/library', destination: '/?tab=build&preview=library' },
      { source: '/library/:category', destination: '/?tab=build&preview=library&category=:category' }
    ];
  },
};

export default nextConfig;
