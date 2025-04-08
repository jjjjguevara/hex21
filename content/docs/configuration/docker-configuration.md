---
title: Docker Configuration
author: Hex21 DevOps Team
date: 2025-04-08
tags: [documentation, guide, configuration, docker, containerization]
description: Guide to Docker configuration and containerization for Hex21 CMS.
id: docker-configuration-guide
---

# Docker Configuration

This guide explains how to containerize and run the Hex21 CMS using Docker.

## Overview

Hex21 CMS uses a multi-stage Docker build process optimized for Next.js applications, which provides:

- Smaller final image size
- Improved build caching
- Proper separation of build and runtime environments
- Security enhancements through non-root user execution

## Dockerfile Structure

Our Dockerfile uses a multi-stage build approach:

```dockerfile
# Base image for all stages
FROM node:20-alpine AS base

# Dependencies stage - only installs packages
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Builder stage - builds the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Runner stage - final production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/content ./content
EXPOSE 3000
CMD ["node", "server.js"]
```

## Key Configuration Points

### Next.js Output Mode

Hex21 uses Next.js `output: 'standalone'` mode in the `next.config.mjs` file, which:

- Creates a standalone folder with a minimal server.js
- Includes only the production dependencies
- Improves deployment and containerization efficiency

### Special Considerations for Hex21

Our Docker configuration addresses several Hex21-specific requirements:

1. **Content Files**: We explicitly copy the `/content` directory to ensure all documentation is available
2. **Asset Processing**: We include the `/scripts` directory for content processing during builds
3. **Non-root Execution**: We run as the `nextjs` user for enhanced security

## Building and Running

### Local Development

Build the Docker image:

```bash
docker build -t hex21 .
```

Run the container locally:

```bash
docker run -p 3000:3000 hex21
```

### Environment Variables

When running with Docker, you may need to pass environment variables:

```bash
docker run -p 3000:3000 -e NEXT_PUBLIC_API_URL=https://api.example.com hex21
```

## Best Practices

1. **Keep the .dockerignore updated**: Exclude unnecessary files like `.git`, `node_modules`, etc.
2. **Version your images**: Tag images with version numbers when deploying
3. **Use volumes for development**: For local development, mount content folders as volumes
4. **Security scanning**: Regularly scan the Docker image for vulnerabilities

## Troubleshooting

### Common Issues

1. **Build failures**: Usually related to TypeScript errors or missing dependencies
2. **Missing content**: Verify the content directory is properly copied
3. **Performance issues**: Consider optimizing the build process or using multi-stage builds
