# =============================================================================
# Stage 1: Dependencies
# Instala TODAS las dependencias (incluyendo devDeps) con pnpm.
# Cache mount acelera builds subsecuentes.
# =============================================================================
FROM node:22-alpine AS deps
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copiar solo manifests para cacheo de capas
COPY package.json pnpm-lock.yaml ./

# Instalar con frozen-lockfile para builds reproducibles
# --config.ignore-scripts=true evita error de pnpm v10+ con build scripts bloqueados
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --config.ignore-scripts=true

# =============================================================================
# Stage 2: Builder
# Build de Next.js — ejecuta prebuild (copy-pdf-worker) + next build
# con output: 'standalone' configurado en next.config.mjs
# =============================================================================
FROM node:22-alpine AS builder
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copiar node_modules instalados y manifests
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json /app/pnpm-lock.yaml ./

# Copiar código fuente
COPY . .

# Eliminar .env.local si existiera (safety net)
RUN rm -f .env.local .env .env.production

# Build: prebuild hook copia pdf.worker.min.mjs → public/ automáticamente
RUN pnpm build

# =============================================================================
# Stage 3: Runner (imagen final mínima)
# Solo el standalone output + static assets. Usuario non-root.
# =============================================================================
FROM node:22-alpine AS runner

# Crear usuario non-root (seguridad)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

WORKDIR /app

# Copiar standalone output (incluye server.js + node_modules trazados)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Copiar assets estáticos (public/ + .next/static/)
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Ejecutar como non-root
USER nextjs

# Exponer puerto (Coolify lo detecta automáticamente)
EXPOSE 3000

# Variables de entorno runtime
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Health check: verifica que el servidor responda
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/auth/csrf || exit 1

# Iniciar servidor standalone
CMD ["node", "server.js"]
