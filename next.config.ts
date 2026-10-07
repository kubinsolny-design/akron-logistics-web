import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: { remotePatterns: [
    { protocol: 'https', hostname: 'cdn.sanity.io' },
    { protocol: 'https', hostname: 'htgwzjcdxbknzvobwioa.supabase.co', pathname: '/storage/v1/object/public/site-media/**' },
  ] },
}

export default nextConfig
