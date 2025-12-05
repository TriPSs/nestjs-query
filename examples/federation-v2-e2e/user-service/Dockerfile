# User Service Dockerfile
# Multi-stage build: builds nestjs-query from source code

# ============================================
# Stage 1: Build nestjs-query packages
# ============================================
FROM node:22 AS builder

WORKDIR /build

# Copy the entire nestjs-query project (uses yarn)
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
COPY nx.json ./
COPY tsconfig*.json ./
COPY jest.* ./
COPY packages/ ./packages/

# Install dependencies and build all packages using yarn
RUN corepack enable && yarn install
RUN yarn nx run-many --target=build --all

# Pack the built packages for installation
WORKDIR /build/dist/packages/core
RUN npm pack --pack-destination /build/dist

WORKDIR /build/dist/packages/query-graphql
RUN npm pack --pack-destination /build/dist

WORKDIR /build/dist/packages/query-typeorm
RUN npm pack --pack-destination /build/dist

# ============================================
# Stage 2: Build and run the service
# ============================================
FROM node:22

WORKDIR /app

# Copy built packages from builder stage
COPY --from=builder /build/dist/*.tgz ./packages/

# Copy service package.json
COPY examples/federation-v2-e2e/user-service/package*.json ./

# Install dependencies using local packages
RUN npm install ./packages/ptc-org-nestjs-query-core-*.tgz \
    ./packages/ptc-org-nestjs-query-graphql-*.tgz \
    ./packages/ptc-org-nestjs-query-typeorm-*.tgz \
    && npm install

# Copy source code
COPY examples/federation-v2-e2e/user-service/src ./src
COPY examples/federation-v2-e2e/user-service/tsconfig.json ./
COPY examples/federation-v2-e2e/user-service/nest-cli.json ./

# Build NestJS application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the service
CMD ["node", "dist/main.js"]
