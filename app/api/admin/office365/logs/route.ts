import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { auth } from "@/lib/auth"

export async function GET(_request: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.rol !== "ADMIN") {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
  }

  const supabase = createAdminClient()

  // Obtener logs de sincronizacion (de la tabla logs_auditoria con tipo_accion relacionado a sync)
  const { data, error } = await supabase
    .from("logs_auditoria")
    .select("*")
    .or("tipo_accion.eq.SYNC_O365,tipo_accion.eq.INTENTO_SYNC_O365")
    .order("timestamp", { ascending: false })
    .limit(20)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: data || [] })
}
