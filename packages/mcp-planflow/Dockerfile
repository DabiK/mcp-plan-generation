FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable

# Install dependencies (workspace-aware)
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY packages/mcp-planflow/package.json packages/mcp-planflow/package.json
COPY packages/planflow-viewer/package.json packages/planflow-viewer/package.json
RUN pnpm install --frozen-lockfile

# Build server
COPY . .
RUN pnpm --filter mcp-planflow build

# Runtime image
FROM node:20-alpine AS runtime
WORKDIR /app
RUN corepack enable
ENV NODE_ENV=production
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/packages/mcp-planflow/dist ./packages/mcp-planflow/dist
COPY --from=base /app/packages/mcp-planflow/package.json ./packages/mcp-planflow/package.json

ENV HTTP_ENABLED=true
ENV HTTP_PORT=3000
ENV HTTP_HOST=0.0.0.0
ENV CORS_ORIGIN=http://localhost:4173
ENV MCP_ENABLED=true

CMD ["pnpm", "--filter", "mcp-planflow", "start"]
