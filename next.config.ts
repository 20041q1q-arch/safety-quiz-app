import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
  },
  experimental: {
    optimizePackageImports: ['idb', 'date-fns'],
  },
  outputFileTracingIncludes: {
    '/api/questions': ['./data/**/*'],
    '/api/questions/random': ['./data/**/*'],
    '/api/stats': ['./data/**/*'],
    '/api/upload': ['./data/**/*'],
  },
}

export default nextConfig
