# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies needed for native modules (e.g. bcrypt)
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Stage 2: Production Runner ───────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install runtime dependencies only
COPY package*.json ./
RUN apk add --no-cache python3 make g++ && \
    npm ci --omit=dev && \
    apk del python3 make g++

# Copy built frontend SPA and built Node server
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist-server ./dist-server

# Cloud Run dynamically injects PORT (typically 8080)
ENV PORT=8080
EXPOSE 8080

CMD ["node", "dist-server/server.js"]
