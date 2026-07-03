import { createClient } from "@supabase/supabase-js"

/**
 * Cliente Supabase con service_role key.
 * 
 * ⚠️  ADVERTENCIA DE SEGURIDAD:
 * Este cliente BYPASSEA todas las políticas RLS.
 * USO EXCLUSIVO en Server Components y API Routes para:
 * - Operaciones de escritura (INSERT, UPDATE, DELETE)
 * - Operaciones que requieren acceso administrativo completo
 * - Autenticación (login, signup, verificación de credenciales)
 * 
 * NUNCA importar en Client Components.
 * Para lecturas, preferir createAnonClient() de @/lib/supabase/anon
 * que usa ANON_KEY y respeta las políticas RLS.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
