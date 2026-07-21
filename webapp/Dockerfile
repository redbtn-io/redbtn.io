# syntax=docker/dockerfile:1

# ---- deps: install ALL dependencies (incl. dev) for the build ----
FROM node:22-alpine AS deps
WORKDIR /app

COPY package*.json ./
# .npmrc is mounted as a BuildKit secret from the global NPMRC redsecret so
# npm ci can authenticate to registry.redbtn.io for @redbtn packages. Never
# baked into a layer; not readable after this RUN completes.
RUN --mount=type=secret,id=npmrc,target=/app/.npmrc \
    npm ci

# ---- builder: compile the Next.js app (standalone output) ----
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- runner: minimal standalone runtime ----
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Bind the Next.js standalone server to all interfaces. Without this it
# resolves the container hostname to a loopback-only address (e.g.
# 127.0.1.1) and the reverse proxy on the host IP gets a 502.
ENV HOSTNAME=0.0.0.0
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
