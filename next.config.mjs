/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Don't fail the production build on ESLint warnings/errors
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Don't fail the production build on type warnings either
    ignoreBuildErrors: false,
  },
};

export default nextConfig;