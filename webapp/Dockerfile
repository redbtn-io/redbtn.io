# syntax=docker/dockerfile:1

# ---- deps: install ALL dependencies (incl. dev) for the build ----
FROM node:22-alpine AS deps
WORKDIR /app

# Token for the private @redbtn npm registry, injected at build time as a
# build-arg (never committed). RedRun passes appConfig.env values as
# --build-arg, so set REDBTN_NPM_TOKEN in the workspace env.
ARG REDBTN_NPM_TOKEN=""

COPY package*.json ./
RUN if [ -n "$REDBTN_NPM_TOKEN" ]; then \
      printf '@redbtn:registry=https://registry.redbtn.io/\n//registry.redbtn.io/:_authToken=%s\n' "$REDBTN_NPM_TOKEN" > .npmrc; \
    fi && \
    npm ci && \
    rm -f .npmrc

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
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
