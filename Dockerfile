# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:22-slim AS builder

WORKDIR /app

# Copy dependency manifests for optimal layer caching
COPY package*.json ./
RUN npm ci

# Copy full repository source code and execute the production build:
# (tsc -b && vite build && tsc -p tsconfig.server.json)
COPY . .
RUN npm run build

# ── Stage 2: Production Runner ───────────────────────────────────────────────
FROM node:22-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install runtime dependencies only (omitting devDependencies)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled frontend SPA assets and compiled backend Node.js server
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist-server ./dist-server

# Create data directory for local fallback storage when Firestore is unconfigured
RUN mkdir -p /app/data

# Cloud Run dynamically injects the PORT environment variable (default: 8080)
ENV PORT=8080
EXPOSE 8080

CMD ["node", "dist-server/server.js"]
