FROM node:22

WORKDIR /app

COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn/releases ./.yarn/releases
COPY examples/federation-v2-e2e/e2e-test/package.json ./examples/federation-v2-e2e/e2e-test/
RUN corepack enable && yarn workspaces focus e2e-test

WORKDIR /app/examples/federation-v2-e2e/e2e-test
COPY tsconfig.base.json /app/tsconfig.base.json
COPY examples/federation-v2-e2e/e2e-test/vitest.config.cts ./
COPY examples/federation-v2-e2e/e2e-test/tsconfig*.json ./
COPY examples/federation-v2-e2e/e2e-test/e2e ./e2e

CMD ["yarn", "test"]
