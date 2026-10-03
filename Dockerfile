# ==========================================
# Stage 1: Build stage
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy package files first to leverage Docker layer caching
COPY app/package*.json ./

# Install all dependencies (including devDependencies if needed for build)
RUN npm ci --only=production

# ==========================================
# Stage 2: Production runtime stage
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

# Create a non-root user and group for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -u 1001 -S nodejs -G nodejs

# Copy node_modules and app source from builder and app folder
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY app/ ./

# Change ownership of the app directory to the non-root user
RUN chown -R nodejs:nodejs /usr/src/app

# Switch to non-root user
USER nodejs

# Expose the application port
EXPOSE 3000

# Define environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Add a container health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 http://localhost:3000/healthz || exit 1

# Start the application
CMD ["node", "server.js"]