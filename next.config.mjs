import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ['@prisma/client', 'prisma'],
  allowedDevOrigins: ['192.168.0.33', '192.168.0.29', '192.168.7.21'],
  productionBrowserSourceMaps: false,
  experimental: {
    webpackBuildWorker: false,
    cpus: 1,
  },
  webpack: (config) => {
    config.parallelism = 1
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@': path.resolve(__dirname),
    }
    return config
  },
}

export default nextConfig
