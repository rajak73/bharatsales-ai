/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    domains: ['images.unsplash.com', 'via.placeholder.com'],
  },
  transpilePackages: [
    '@bharatsales/ui',
    '@bharatsales/shared-types',
    '@bharatsales/api-client',
    '@bharatsales/permissions'
  ],
};

module.exports = nextConfig;
