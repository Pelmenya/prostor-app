# ─── 1. Зависимости ─────────────────────────────────────────
ARG NODE_IMAGE=node:22.16-slim
FROM ${NODE_IMAGE} AS deps

WORKDIR /app

COPY package.json package-lock.json* ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund --fetch-retries=5 --fetch-retry-mintimeout=20000 --fetch-retry-maxtimeout=120000

# ─── 2. Сборка ──────────────────────────────────────────────
FROM ${NODE_IMAGE} AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* инлайнятся в бандл при билде — только используемые в коде
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SLOVO_API_URL
ARG NEXT_PUBLIC_S3_PUBLIC_URL
ARG NEXT_PUBLIC_SALE_PRICES
ARG NEXT_PUBLIC_VAPID_PUBLIC_KEY
ARG NEXT_PUBLIC_COMMISSION_PERCENTS
ARG NEXT_PUBLIC_SMART_SEARCH_MOCK
ARG BUILD_API_URL
ARG BUILD_SLOVO_API_URL
ARG INTERNAL_API_URL
ARG INTERNAL_SLOVO_API_URL

RUN npm run build

# ─── 3. Продакшн ────────────────────────────────────────────
FROM ${NODE_IMAGE} AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs nextjs

# standalone сервер
COPY --from=builder /app/.next/standalone ./

# статика и публичные файлы (standalone не включает их автоматически)
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
