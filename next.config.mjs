/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static page generation
  output: 'standalone',
  
  // Configure webpack to handle our content files
  webpack: (config, { isServer }) => {
    // Handle XML and DITA files
    config.module.rules.push({
      test: /\.(xml|dita|ditamap)$/,
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
  },

  // Configure logging
  logging: {
    level: 'info',
    fetches: {
      fullUrl: true,
    },
  },

  // Configure page generation
  generateStaticParams: true,
  
  // Configure static file serving
  images: {
    domains: ['localhost'],
  },
};

export default nextConfig; 