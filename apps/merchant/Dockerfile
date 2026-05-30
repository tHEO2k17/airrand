# Production image for @airrand/merchant (Next.js standalone)
FROM node:20-alpine AS builder

ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:3003
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps ./apps
COPY packages ./packages

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @airrand/merchant... build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/apps/merchant/.next/standalone ./
COPY --from=builder /app/apps/merchant/.next/static ./apps/merchant/.next/static

EXPOSE 3001

CMD ["node", "apps/merchant/server.js"]
