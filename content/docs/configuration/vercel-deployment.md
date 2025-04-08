---
title: Vercel Deployment
author: Hex21 DevOps Team
date: 2025-04-08
tags: [documentation, guide, configuration, vercel, deployment]
description: Guide to deploying Hex21 CMS on Vercel.
id: vercel-deployment-guide
---

# Vercel Deployment

This guide explains how to deploy the Hex21 CMS to Vercel and configure deployment settings.

## Overview

Vercel is a cloud platform for static sites and Serverless Functions that pairs perfectly with Hex21's Next.js foundation. Our deployment configuration is optimized for:

- Zero-configuration deployments
- Automatic preview deployments
- Fast global CDN
- Serverless functions support
- Environment variable management

## Vercel Configuration

### vercel.json

Our Hex21 deployment is configured through a `vercel.json` file at the project root:

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "outputDirectory": ".next"
}
```

This configuration:
- Specifies Next.js as the framework
- Defines custom build commands
- Sets the output directory

## Deployment Process

### Initial Setup

To deploy Hex21 to Vercel:

1. Install the Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Log in to Vercel:
   ```bash
   vercel login
   ```

3. Deploy the application:
   ```bash
   vercel deploy --prod
   ```

### Continuous Deployment

For an automated workflow:

1. Connect your Git repository to Vercel
2. Configure build settings in the Vercel dashboard
3. Set up automatic deployments on push to specific branches

## Special Considerations for Hex21

### Content Processing

Hex21's custom content processing happens during the build phase:

```json
"buildCommand": "npm run build"
```

Our `package.json` build script includes:
```
"build": "node scripts/copy-assets.mjs && node scripts/build-search-index.mjs && next build"
```

This ensures:
- All content assets are properly copied
- The search index is built
- The Next.js application is compiled

### Environment Variables

Configure these environment variables in the Vercel dashboard:

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SITE_URL` | Public URL of your deployment | `https://hex21.example.com` |
| `NEXT_PUBLIC_CONTENT_PATH` | Path to content | `/content` |
| `NODE_ENV` | Environment (production/development) | `production` |

## Deployment Regions

Hex21 is configured to deploy to all Vercel regions for optimal global performance.

## Troubleshooting

### Common Issues

1. **Build failures**: Check the build logs for TypeScript errors or missing dependencies
2. **Missing content**: Verify the content build scripts ran successfully
3. **Environment variables**: Ensure all required variables are set

### Deployment Logs

Access deployment logs through the Vercel dashboard or CLI:

```bash
vercel logs <deployment-url>
```

## Custom Domains

To use a custom domain:

1. Go to the Vercel project dashboard
2. Navigate to "Domains"
3. Add your domain
4. Follow the DNS configuration instructions

## Scaling and Performance

Configure performance settings in the Vercel dashboard:

1. Adjust Serverless Function timeout
2. Configure caching behavior
3. Set up Analytics to monitor usage and performance
