import NextAuth from "next-auth"
import AzureAD from "@auth/core/providers/azure-ad"
import Credentials from "@auth/core/providers/credentials"
import { createAdminClient } from "@/lib/supabase/admin"
import { loginLimiter, getClientIP } from "@/lib/rate-limit"
import bcrypt from "bcryptjs"

// Multi-tenant (patron vTiger): solo se requiere client_id + client_secret.
// tenantId default "organizations" = cualquier cuenta work/school de Office 365.
const hasAzureConfig =
  process.env.AUTH_AZURE_AD_ID && process.env.AUTH_AZURE_AD_SECRET

const AZURE_TENANT = process.env.AUTH_AZURE_AD_TENANT_ID || "organizations"
const AZURE_AUTO_CREATE = process.env.AUTH_AZURE_AD_AUTO_CREATE === "true"

// Lista de dominios permitidos (comma-separated). Vacio = permitir todos
// y delegar el control de acceso al cruce con la tabla usuarios.
const AZURE_DOMAINS: string[] = (process.env.AUTH_AZURE_AD_DOMAIN || "")
  .split(",")
  .map((d) => d.trim().toLowerCase())
  .filter(Boolean)

function isDomainAllowed(email: string): boolean {
  if (AZURE_DOMAINS.length === 0) return true
  const domain = email.split("@")[1]?.toLowerCase()
  return !!domain && AZURE_DOMAINS.includes(domain)
}

const providers: any[] = [
  Credentials({
    id: "credentials",
    name: "Credenciales locales",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials, request) {
      // Rate limiting: máximo 5 intentos por minuto por IP
      const clientIP = getClientIP(request as Request)
      const rateLimitResult = await loginLimiter.limit(`login:${clientIP}`)
      if (!rateLimitResult.success) {
        throw new Error("Demasiados intentos. Intente de nuevo en un minuto.")
      }

      const email = (credentials?.email as string)?.toLowerCase().trim()
      const password = credentials?.password as string
      if (!email || !password) return null

      const supabase = createAdminClient()
      const { data: user } = await supabase
        .from("usuarios")
        .select("*")
        .eq("email", email)
        .eq("activo", true)
        .single()

      if (!user) return null

      // Verificar contraseña contra hash almacenado en BD
      if (!user.password_hash) return null
      const validPassword = await bcrypt.compare(password, user.password_hash)
      if (!validPassword) return null

      await supabase
        .from("usuarios")
        .update({ ultimo_acceso: new Date().toISOString() })
        .eq("id", user.id)

      return {
        id: user.id,
        email: user.email,
        name: user.nombre,
        rol: user.rol,
        usuarioId: user.id,
        nombre: user.nombre,
        codigoDespacho: user.codigo_despacho || "",
        nombreJuzgado: user.nombre_juzgado || "",
      }
    },
  }),
]

if (hasAzureConfig) {
  providers.push(
    AzureAD({
      clientId: process.env.AUTH_AZURE_AD_ID!,
      clientSecret: process.env.AUTH_AZURE_AD_SECRET!,
      tenantId: AZURE_TENANT,
      authorization: { params: { scope: "openid profile email User.Read" } },
    })
  )
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers,
  pages: { signIn: "/login", error: "/login" },
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === "azure-ad") {
        const email = (profile?.email as string | undefined)?.toLowerCase().trim()
        if (!email) return false
        if (AZURE_DOMAINS.length > 0 && !isDomainAllowed(email)) return false
      }
      return true
    },
    async jwt({ token, account, profile, user }) {
      if (account?.provider === "credentials" && user) {
        token.rol = (user as any).rol
        token.usuarioId = (user as any).usuarioId
        token.nombre = (user as any).nombre
        token.codigoDespacho = (user as any).codigoDespacho
        token.nombreJuzgado = (user as any).nombreJuzgado
        return token
      }

      if (account?.provider === "azure-ad" && profile) {
        const supabase = createAdminClient()
        const email = profile.email as string | undefined
        const azureOid = profile.sub
        if (!email || !azureOid) return token

        const { data: eu } = await supabase
          .from("usuarios")
          .select("*")
          .or(`azure_oid.eq.${azureOid},email.eq.${email}`)
          .single()

        if (eu) {
          if (!eu.azure_oid) {
            await supabase.from("usuarios").update({ azure_oid: azureOid, ultimo_acceso: new Date().toISOString() }).eq("id", eu.id)
          } else {
            await supabase.from("usuarios").update({ ultimo_acceso: new Date().toISOString() }).eq("id", eu.id)
          }
          if (!eu.activo) return { ...token, blocked: true }
          token.rol = eu.rol
          token.usuarioId = eu.id
          token.nombre = eu.nombre
        } else {
          if (AZURE_AUTO_CREATE && isDomainAllowed(email)) {
            const { data: nu } = await supabase.from("usuarios").insert({
              azure_oid: azureOid, email,
              nombre: (profile as any)?.name || email.split("@")[0],
              rol: "JUZGADO", activo: true,
              ultimo_acceso: new Date().toISOString(),
            }).select().single()
            if (nu) {
              token.rol = nu.rol
              token.usuarioId = nu.id
              token.nombre = nu.nombre
            }
          } else {
            return { ...token, blocked: true }
          }
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.rol = token.rol as string
        session.user.usuarioId = token.usuarioId as string
        session.user.nombre = token.nombre as string
        session.user.codigoDespacho = token.codigoDespacho as string
        session.user.nombreJuzgado = token.nombreJuzgado as string
      }
      return session
    },
  },
  session: { strategy: "jwt", maxAge: 30 * 60 },
  trustHost: process.env.AUTH_TRUST_HOST === "true" || process.env.NODE_ENV !== "production",
})
