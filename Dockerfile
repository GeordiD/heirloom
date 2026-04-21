FROM node:24-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

FROM base AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts
COPY . .
RUN pnpm build

FROM node:24-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src/server/db/migrations ./migrations
COPY scripts/run-migrations.mjs ./scripts/run-migrations.mjs
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x entrypoint.sh
ENV NODE_ENV=production
EXPOSE 3000
CMD ["./entrypoint.sh"]
