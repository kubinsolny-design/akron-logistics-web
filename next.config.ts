import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return ['/admin/:path*', '/studio/:path*', '/api/:path*'].map(source => ({
      source, headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
    }))
  },
  images: { remotePatterns: [
    { protocol: 'https', hostname: 'cdn.sanity.io' },
    { protocol: 'https', hostname: 'htgwzjcdxbknzvobwioa.supabase.co', pathname: '/storage/v1/object/public/site-media/**' },
  ] },
}

export default nextConfig
