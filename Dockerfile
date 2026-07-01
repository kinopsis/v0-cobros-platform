FROM node:22-alpine AS deps
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --no-frozen-lockfile --config.ignore-scripts=true

FROM node:22-alpine AS builder
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json /app/pnpm-lock.yaml ./

# Copiar archivos explicitamente (bypassea .dockerignore de Coolify)
COPY app/ ./app/
COPY components/ ./components/
COPY lib/ ./lib/
COPY hooks/ ./hooks/
COPY public/ ./public/
COPY styles/ ./styles/
COPY next.config.mjs tsconfig.json postcss.config.mjs package.json ./

RUN rm -f .env.local .env .env.production

# Copiar pdf.worker manualmente (bypassea el hook prebuild que depende de scripts/)
RUN node -e "const fs=require('fs');const p=require('path');const rp=p.dirname(require.resolve('react-pdf/package.json'));const ws=p.join(rp,'node_modules','pdfjs-dist','build','pdf.worker.min.mjs');fs.mkdirSync('public',{recursive:true});if(fs.existsSync(ws)){fs.copyFileSync(ws,'public/pdf.worker.min.mjs');console.log('Worker copiado')}else{console.warn('Worker no encontrado, se usara fallback')}"

RUN pnpm next build

FROM node:22-alpine AS runner

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

WORKDIR /app

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/auth/csrf || exit 1

CMD ["node", "server.js"]
