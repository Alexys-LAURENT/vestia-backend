# ---- Build stage ----
FROM node:22.11.0-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# ---- Production stage ----
FROM node:22.11.0-alpine AS production

WORKDIR /app

# Copy built output
COPY --from=builder /app/build ./

# Install production dependencies only
RUN npm ci --omit=dev

# Create storage directory
RUN mkdir -p storage

EXPOSE 3333

CMD ["node", "bin/server.js"]
