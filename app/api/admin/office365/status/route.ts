import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { auth } from "@/lib/auth"

export async function GET() {
  const session = await auth()
  if (!session?.user || session.user.rol !== "ADMIN") {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
  }

  const supabase = createAdminClient()

  const { data: config } = await supabase
    .from("configuracion_sistema")
    .select("*")
    .eq("seccion", "office365")

  const tenantId = config?.find((c: any) => c.clave === "tenant_id")?.valor
  const dominio = config?.find((c: any) => c.clave === "dominio_permitido")?.valor
  const ultimaSync = config?.find((c: any) => c.clave === "ultima_sync")?.valor

  const { count: usuariosSync } = await supabase
    .from("usuarios")
    .select("*", { count: "exact", head: true })
    .not("azure_oid", "is", null)

  const { count: totalUsuarios } = await supabase
    .from("usuarios")
    .select("*", { count: "exact", head: true })

  return NextResponse.json({
    conectado: !!tenantId,
    tenantId: tenantId ? "***" : null,
    dominioPermitido: dominio || "cendoj.ramajudicial.gov.co",
    ultimaSync: ultimaSync || null,
    usuariosSincronizados: usuariosSync || 0,
    totalUsuarios: totalUsuarios || 0,
    estado: tenantId ? "configurado" : "no_configurado",
  })
}
