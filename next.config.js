/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Disable ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Ensure .well-known files are accessible
  async headers() {
    return [
      {
        source: '/.well-known/farcaster.json',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Content-Type', value: 'application/json' }
        ],
      },
      {
        source: '/.well-known/manifest.json',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Content-Type', value: 'application/json' }
        ],
      },
    ];
  },
  // Add redirect for Farcaster hosted manifest
  async redirects() {
    return [
      {
        source: '/.well-known/farcaster.json',
        destination: 'https://api.farcaster.xyz/miniapps/hosted-manifest/0197dd14-5396-6966-6be8-ce80fab90504',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
