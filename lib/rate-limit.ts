/**
 * Rate limiting en memoria con fallback.
 * 
 * En producción, reemplazar con @upstash/ratelimit + @upstash/redis
 * para rate limiting distribuido.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Limpieza periódica cada 5 minutos
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key)
    }
  }
}, 5 * 60 * 1000)

export interface RateLimiterConfig {
  maxRequests: number
  windowMs: number
}

export function createRateLimiter(config: RateLimiterConfig) {
  return {
    async limit(key: string): Promise<{
      success: boolean
      remaining: number
      resetAt: number
    }> {
      const now = Date.now()
      const entry = store.get(key)

      if (!entry || now > entry.resetAt) {
        store.set(key, { count: 1, resetAt: now + config.windowMs })
        return {
          success: true,
          remaining: config.maxRequests - 1,
          resetAt: now + config.windowMs,
        }
      }

      entry.count++

      if (entry.count > config.maxRequests) {
        return {
          success: false,
          remaining: 0,
          resetAt: entry.resetAt,
        }
      }

      return {
        success: true,
        remaining: config.maxRequests - entry.count,
        resetAt: entry.resetAt,
      }
    },
  }
}

// Rate limiters pre-configurados

/** Login: máximo 5 intentos por minuto por IP */
export const loginLimiter = createRateLimiter({
  maxRequests: 5,
  windowMs: 60 * 1000,
})

/** Import CSV: 1 cada 30 segundos por IP */
export const importLimiter = createRateLimiter({
  maxRequests: 1,
  windowMs: 30 * 1000,
})

/** BI/Reportes: 10 requests por minuto por usuario */
export const biLimiter = createRateLimiter({
  maxRequests: 10,
  windowMs: 60 * 1000,
})

/** Creación de solicitudes: 20 por minuto por usuario */
export const solicitudLimiter = createRateLimiter({
  maxRequests: 20,
  windowMs: 60 * 1000,
})

/** Helper para extraer IP del request (considera proxies) */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    return forwarded.split(",")[0].trim()
  }
  const realIp = request.headers.get("x-real-ip")
  if (realIp) return realIp
  const cfIp = request.headers.get("cf-connecting-ip")
  if (cfIp) return cfIp
  return "127.0.0.1"
}
