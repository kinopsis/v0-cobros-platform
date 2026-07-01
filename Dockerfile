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

COPY app/ ./app/
COPY components/ ./components/
COPY lib/ ./lib/
COPY hooks/ ./hooks/
COPY public/ ./public/
COPY styles/ ./styles/
COPY next.config.mjs tsconfig.json postcss.config.mjs package.json ./

# Regenerar archivos criticos si Coolify los excluyo del build context
RUN mkdir -p lib/supabase && \
    if [ ! -f lib/supabase/admin.ts ]; then \
      printf 'import { createClient } from "@supabase/supabase-js"\nexport function createAdminClient() {\n  return createClient(\n    process.env.NEXT_PUBLIC_SUPABASE_URL!,\n    process.env.SUPABASE_SERVICE_ROLE_KEY!,\n    { auth: { autoRefreshToken: false, persistSession: false } }\n  )\n}\n' > lib/supabase/admin.ts ; \
      echo "[fix] lib/supabase/admin.ts regenerado" ; \
    fi && \
    if [ ! -f lib/supabase/server.ts ]; then \
      printf 'import { createServerClient } from "@supabase/ssr"\nimport { cookies } from "next/headers"\nexport async function createClient() {\n  const cs = await cookies()\n  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {\n    cookies: { getAll() { return cs.getAll() }, setAll(cts) { try { cts.forEach(c => cs.set(c.name, c.value, c.options)) } catch {} } }\n  })\n}\n' > lib/supabase/server.ts ; \
      echo "[fix] lib/supabase/server.ts regenerado" ; \
    fi && \
    if [ ! -f lib/supabase/client.ts ]; then \
      printf '"use client"\nimport { createBrowserClient } from "@supabase/ssr"\nexport function createClient() {\n  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)\n}\n' > lib/supabase/client.ts ; \
      echo "[fix] lib/supabase/client.ts regenerado" ; \
    fi

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
