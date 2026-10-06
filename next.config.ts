import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return process.env.NEXT_PUBLIC_ADMIN_PROVIDER === 'supabase'
      ? [] : [{ source: '/admin', destination: '/studio/obsah', permanent: false }]
  },
  images: { remotePatterns: [
    { protocol: 'https', hostname: 'cdn.sanity.io' },
    { protocol: 'https', hostname: 'htgwzjcdxbknzvobwioa.supabase.co', pathname: '/storage/v1/object/public/site-media/**' },
  ] },
}

export default nextConfig
