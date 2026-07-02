# ─── 1. Зависимости ─────────────────────────────────────────
FROM node:22.16-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# ─── 2. Сборка ──────────────────────────────────────────────
FROM node:22.16-alpine AS builder

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
ARG INTERNAL_API_URL
ARG INTERNAL_SLOVO_API_URL

RUN npm run build

# ─── 3. Продакшн ────────────────────────────────────────────
FROM node:22.16-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

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
