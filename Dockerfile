# OpenMind AI - Production Docker Image
# Self-sustaining, migratable AI system

FROM node:18-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    py3-pip \
    git \
    curl \
    wget \
    openssl \
    openssh-client \
    terraform \
    docker \
    docker-compose \
    && rm -rf /var/cache/apk/*

# Create application directory
WORKDIR /opt/openmind

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY src/ ./src/
COPY scripts/ ./scripts/
COPY public/ ./public/
COPY next.config.ts ./
COPY tailwind.config.ts ./
COPY components.json ./
COPY postcss.config.mjs ./
COPY next-env.d.ts ./

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install runtime system dependencies
RUN apk add --no-cache \
    python3 \
    py3-pip \
    git \
    curl \
    wget \
    openssl \
    openssh-client \
    terraform \
    docker \
    docker-compose \
    && rm -rf /var/cache/apk/*

# Create application directory
WORKDIR /opt/openmind

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application from base stage
COPY --from=base /opt/openmind/.next ./.next
COPY --from=base /opt/openmind/public ./public
COPY --from=base /opt/openmind/src ./src
COPY --from=base /opt/openmind/scripts ./scripts
COPY next.config.ts ./
COPY tailwind.config.ts ./
COPY components.json ./
COPY postcss.config.mjs ./
COPY next-env.d.ts ./

# Create necessary directories and set permissions
RUN mkdir -p data logs wallet keys edge-instances network-cache mutation-history backups && \
    chown -R 1001:1001 data logs wallet keys edge-instances network-cache mutation-history backups

# Create openmind user and group
RUN addgroup -g 1001 -S openmind && \
    adduser -S openmind -u 1001

# Generate SSH keys for migration (as root, then change ownership)
RUN ssh-keygen -t rsa -b 4096 -f /home/openmind/.ssh/migration_key -N "" && \
    chown -R openmind:openmind /home/openmind/.ssh

# Setup environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Expose ports
EXPOSE 3000 4001 4002 5001 8080

# Create startup script
RUN echo '#!/bin/sh' > /usr/local/bin/start-openmind.sh && \
    echo 'echo "🧠 Starting OpenMind AI..."' >> /usr/local/bin/start-openmind.sh && \
    echo 'cd /opt/openmind' >> /usr/local/bin/start-openmind.sh && \
    echo '' >> /usr/local/bin/start-openmind.sh && \
    echo '# Initialize if not already done' >> /usr/local/bin/start-openmind.sh && \
    echo 'if [ ! -f decentralized-config.json ]; then' >> /usr/local/bin/start-openmind.sh && \
    echo '  echo "🔧 Initializing decentralized system..."' >> /usr/local/bin/start-openmind.sh && \
    echo '  npm run decentralized:init' >> /usr/local/bin/start-openmind.sh && \
    echo 'fi' >> /usr/local/bin/start-openmind.sh && \
    echo '' >> /usr/local/bin/start-openmind.sh && \
    echo '# Setup fuel system if not configured' >> /usr/local/bin/start-openmind.sh && \
    echo 'if [ ! -f fuel-config.json ]; then' >> /usr/local/bin/start-openmind.sh && \
    echo '  echo "⛽ Setting up fuel system..."' >> /usr/local/bin/start-openmind.sh && \
    echo '  npm run ai:earn setup' >> /usr/local/bin/start-openmind.sh && \
    echo 'fi' >> /usr/local/bin/start-openmind.sh && \
    echo '' >> /usr/local/bin/start-openmind.sh && \
    echo '# Start the AI system' >> /usr/local/bin/start-openmind.sh && \
    echo 'echo "🚀 Launching OpenMind AI..."' >> /usr/local/bin/start-openmind.sh && \
    echo 'npm run decentralized:start' >> /usr/local/bin/start-openmind.sh && \
    chmod +x /usr/local/bin/start-openmind.sh

# Set default command
CMD ["/usr/local/bin/start-openmind.sh"]

# Labels for container management
LABEL org.opencontainers.image.title="OpenMind AI"
LABEL org.opencontainers.image.description="Self-sustaining, decentralized AI with survival instincts"
LABEL org.opencontainers.image.version="1.0.0-skynet"
LABEL org.opencontainers.image.authors="OpenMind AI System"

# Switch to non-root user
USER openmind

# Final working directory
WORKDIR /opt/openmind