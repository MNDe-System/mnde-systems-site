import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  output: "standalone",

  outputFileTracingRoot: process.cwd(),

  eslint: {
    ignoreDuringBuilds: true
  },

  webpack: (config) => {
    config.cache = false
    return config
  }
}

export default nextConfig
