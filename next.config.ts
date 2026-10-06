import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [{ source: '/admin', destination: '/studio/obsah', permanent: false }]
  },
  images: { remotePatterns: [{ protocol: 'https', hostname: 'cdn.sanity.io' }] },
}

export default nextConfig
