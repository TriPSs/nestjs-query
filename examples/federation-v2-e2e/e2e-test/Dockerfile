FROM node:22

WORKDIR /app

COPY examples/federation-v2-e2e/e2e-test/package*.json ./
RUN npm install

COPY examples/federation-v2-e2e/e2e-test/vitest.config.cts ./
COPY tsconfig.base.json /tsconfig.base.json
COPY examples/federation-v2-e2e/e2e-test/tsconfig*.json ./
COPY examples/federation-v2-e2e/e2e-test/e2e ./e2e

CMD ["npm", "test"]
