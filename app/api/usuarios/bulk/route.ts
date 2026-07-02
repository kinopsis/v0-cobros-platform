import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { auth } from "@/lib/auth"
import { usuarioBulkSchema } from "@/lib/validations/usuario-schema"

export async function PATCH(request: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.rol !== "ADMIN") {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
  }

  const supabase = createAdminClient()
  const body = await request.json()

  const parsed = usuarioBulkSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos invalidos", detalles: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { ids, accion } = parsed.data
  const activo = accion === "activar"

  const { error } = await supabase
    .from("usuarios")
    .update({ activo, updated_at: new Date().toISOString() })
    .in("id", ids)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Registrar en auditoria
  await supabase.from("logs_auditoria").insert({
    usuario_id: session.user.usuarioId,
    solicitud_id: null as unknown as string,
    tipo_accion: accion === "activar" ? "USUARIOS_ACTIVADOS" : "USUARIOS_DESACTIVADOS",
    observaciones: `${ids.length} usuarios ${accion === "activar" ? "activados" : "desactivados"}`,
  })

  return NextResponse.json({
    success: true,
    message: `${ids.length} usuarios ${accion === "activar" ? "activados" : "desactivados"}`,
  })
}
