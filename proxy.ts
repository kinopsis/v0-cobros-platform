import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

// Rutas que no requieren autenticacion
const publicRoutes = ["/login", "/api/auth"]

// Rutas restringidas por rol
const roleRestrictedRoutes: Record<string, string[]> = {
  ADMIN: ["/usuarios", "/configuracion", "/reportes", "/estadisticas", "/auditoria"],
}

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  // Permitir rutas publicas
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Redirigir a login si no hay sesion
  if (!session?.user) {
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
