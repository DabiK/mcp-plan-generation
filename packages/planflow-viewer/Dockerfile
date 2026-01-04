# Build stage
FROM node:20-alpine AS build
WORKDIR /app
RUN corepack enable

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY packages/mcp-planflow/package.json packages/mcp-planflow/package.json
COPY packages/planflow-viewer/package.json packages/planflow-viewer/package.json
RUN pnpm install --frozen-lockfile

COPY . .
ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=${VITE_API_URL}
RUN pnpm --filter planflow-viewer build

# Runtime stage
FROM node:20-alpine AS runtime
WORKDIR /app
RUN npm install -g serve@14
COPY --from=build /app/packages/planflow-viewer/dist ./dist
EXPOSE 4173
CMD ["serve", "-s", "dist", "-l", "4173"]
