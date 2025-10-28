/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '',
        pathname: '/**',
      },
    ],
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  // Development mode optimizations
  ...(process.env.NODE_ENV === 'development' && {
    // Disable static optimization for better hot reload
    experimental: {
      optimizeCss: false,
    },
    // Turbopack configuration for Next.js 16
    turbopack: {
      // Enable hot reload optimizations
      resolveAlias: {},
    },
  }),
};

export default nextConfig;
