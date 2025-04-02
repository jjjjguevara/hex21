/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static page generation
  output: 'standalone',
  
  // Configure webpack to handle our content files
  webpack: (config, { isServer }) => {
    // Handle XML, DITA, and Markdown files
    config.module.rules.push({
      test: /\.(xml|dita|ditamap|md|mdita)$/,
      use: 'raw-loader'
    });

    // Handle server-only modules
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }

    return config;
  },

  // Enable experimental features we need
  experimental: {
    // Enable reading files from the content directory
    serverComponentsExternalPackages: ['fs', 'path'],
    
    // Enable better error handling
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },

    // Enable markdown processing
    mdxRs: true,
  },

  // Configure logging
  logging: {
    level: 'debug',
    fetches: {
      fullUrl: true,
    },
  },
  
  // Configure static file serving
  images: {
    domains: ['localhost'],
  },

  // Configure content directory
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdita'],
};

export default nextConfig; 