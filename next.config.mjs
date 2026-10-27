/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ['@prisma/client', 'prisma'],
  allowedDevOrigins: ['192.168.0.33', '192.168.0.29', '192.168.7.21']
}

export default nextConfig
