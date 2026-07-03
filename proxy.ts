import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

// Rutas que no requieren autenticacion
const publicRoutes = ["/login", "/api/auth"]

// Rutas restringidas por rol
const roleRestrictedRoutes: Record<string, string[]> = {
  ADMIN: ["/usuarios", "/configuracion", "/reportes", "/estadisticas", "/auditoria"],
}

// Log de accesos bloqueados para auditoría de seguridad
type BlockedAccessLog = {
  timestamp: string
  ip: string
  path: string
  reason: "no_session" | "insufficient_role"
  role?: string
}

function logBlockedAccess(entry: BlockedAccessLog) {
  // En producción usar logger estructurado (pino)
  if (process.env.NODE_ENV === "production") {
    console.warn(
      JSON.stringify({
        event: "proxy_blocked_access",
        ...entry,
      })
    )
  }
}

// Helper para obtener IP del request (considera proxies)
function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    return forwarded.split(",")[0].trim()
  }
  const realIp = request.headers.get("x-real-ip")
  if (realIp) return realIp
  return "unknown"
}

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth
  const clientIP = getClientIP(req)

  // Permitir rutas publicas
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Redirigir a login si no hay sesion
  if (!session?.user) {
    logBlockedAccess({
      timestamp: new Date().toISOString(),
      ip: clientIP,
      path: pathname,
      reason: "no_session",
    })
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Verificar restricciones por rol
  const userRole = session.user.rol as string | undefined
  if (userRole) {
    for (const [role, routes] of Object.entries(roleRestrictedRoutes)) {
      const isRestricted = routes.some((route) => pathname.startsWith(route))
      if (isRestricted && userRole !== role) {
        logBlockedAccess({
          timestamp: new Date().toISOString(),
          ip: clientIP,
          path: pathname,
          reason: "insufficient_role",
          role: userRole,
        })
        const dashboardUrl = new URL("/dashboard", req.url)
        return NextResponse.redirect(dashboardUrl)
      }
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
