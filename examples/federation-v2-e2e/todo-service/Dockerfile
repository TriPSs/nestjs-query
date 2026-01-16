# TodoItem Service Dockerfile
# Multi-stage build: builds nestjs-query from source code

# ============================================
# Stage 1: Build nestjs-query packages
# ============================================
FROM node:22 AS builder

WORKDIR /build

# Copy only dependency files first for caching
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
COPY nx.json ./
COPY tsconfig*.json ./
COPY jest.* ./

# Copy package.json files for each package (for dependency resolution)
COPY packages/core/package.json ./packages/core/
COPY packages/query-graphql/package.json ./packages/query-graphql/
COPY packages/query-typeorm/package.json ./packages/query-typeorm/

# Install dependencies (this layer will be cached if deps don't change)
RUN corepack enable && yarn install

# Now copy source code (changes here won't invalidate dep cache)
COPY packages/ ./packages/

# Build all packages
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
COPY examples/federation-v2-e2e/todo-service/package*.json ./

# Install dependencies using local packages
RUN npm install ./packages/souagrosolucoes-nestjs-query-core-*.tgz \
    ./packages/souagrosolucoes-nestjs-query-graphql-*.tgz \
    ./packages/souagrosolucoes-nestjs-query-typeorm-*.tgz \
    && npm install

# Copy source code
COPY examples/federation-v2-e2e/todo-service/src ./src
COPY examples/federation-v2-e2e/todo-service/tsconfig.json ./
COPY examples/federation-v2-e2e/todo-service/nest-cli.json ./

# Build NestJS application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the service
CMD ["node", "dist/main.js"]
