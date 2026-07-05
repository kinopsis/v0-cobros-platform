import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

const publicRoutes = ["/login", "/api/auth", "/api/health"]
const roleRestrictedRoutes: Record<string, string[]> = {
  ADMIN: ["/usuarios", "/configuracion", "/reportes", "/estadisticas", "/auditoria", "/juzgados"],
}
type BlockedAccessLog = { timestamp: string; ip: string; path: string; reason: "no_session" | "insufficient_role"; role?: string }
function logBlockedAccess(entry: BlockedAccessLog) { if (process.env.NODE_ENV === "production") { console.warn(JSON.stringify({ event: "proxy_blocked_access", ...entry })) } }
export default auth(async (req) => {
  const { pathname } = req.nextUrl
  if (publicRoutes.some(r => pathname.startsWith(r))) return NextResponse.next()
  const session = await auth()
  if (!session?.user) { const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"; logBlockedAccess({ timestamp: new Date().toISOString(), ip, path: pathname, reason: "no_session" }); const url = new URL("/login", req.url); url.searchParams.set("callbackUrl", pathname); return NextResponse.redirect(url) }
  const userRol = session.user.rol as string
  for (const [rol, routes] of Object.entries(roleRestrictedRoutes)) {
    if (userRol !== rol && routes.some(r => pathname.startsWith(r))) { logBlockedAccess({ timestamp: new Date().toISOString(), ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown", path: pathname, reason: "insufficient_role", role: userRol }); return NextResponse.redirect(new URL("/dashboard", req.url)) }
  }
  return NextResponse.next()
})
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"] }