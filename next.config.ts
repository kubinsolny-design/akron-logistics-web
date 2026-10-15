import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async redirects() { return [{ source: '/spoluprace', destination: '/kontakt', permanent: true }] },
  async headers() {
    return [{ source: '/:path*', headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      { key: 'Content-Security-Policy', value: "base-uri 'self'; object-src 'none'; frame-ancestors 'self'" },
    ] }, ...['/admin/:path*', '/studio/:path*', '/api/:path*'].map(source => ({
      source, headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
    }))]
  },
  images: { remotePatterns: [
    { protocol: 'https', hostname: 'htgwzjcdxbknzvobwioa.supabase.co', pathname: '/storage/v1/object/public/site-media/**' },
  ] },
}

export default nextConfig
