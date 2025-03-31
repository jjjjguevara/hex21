/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // We'll need this later for our DITA content
  experimental: {
    // Enable if we need to read markdown/DITA files at build time
    serverComponentsExternalPackages: ['gray-matter'],
  },
};

export default nextConfig; 