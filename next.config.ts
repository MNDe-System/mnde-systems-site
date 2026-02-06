import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  output: "standalone",

  experimental: {
    outputFileTracingRoot: process.cwd()
  },

  webpack: (config) => {
    config.cache = false
    return config
  }
}

export default nextConfig
