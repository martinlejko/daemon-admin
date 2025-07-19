# Multi-stage Dockerfile for Owleyes Frontend

# Base stage with Node.js and Bun
FROM oven/bun:1.2-alpine as base

# Set working directory
WORKDIR /app

# Development stage
FROM base as development

# Copy package files
COPY package.json bun.lock* ./

# Install dependencies
RUN bun install

# Copy source code
COPY . .

# Expose port
EXPOSE 5173

# Run development server
CMD ["bun", "run", "dev", "--host", "0.0.0.0"]

# Build stage
FROM base as build

# Copy package files
COPY package.json bun.lock* ./

# Install dependencies
RUN bun install

# Copy source code
COPY . .

# Build for production
RUN bun run build

# Production stage
FROM nginx:alpine as production

# Copy built files from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]