import { createClient } from "@supabase/supabase-js"

/**
 * Cliente Supabase con ANON_KEY (sin privilegios elevados).
 * 
 * ⚠️  LIMITACIÓN CON NextAuth:
 * Este cliente NO tiene sesión de Supabase Auth, por lo que RLS
 * trata todas las consultas como anónimas (auth.uid() = NULL).
 * Solo usar en contextos donde RLS esté deshabilitado o donde
 * se pase explícitamente un token de acceso de Supabase.
 * 
 * Para la mayoría de API routes con NextAuth, usar createAdminClient()
 * ya que la autorización se maneja en la capa de aplicación.
 *
 * NUNCA importar en Client Components.
 */
export function createAnonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
