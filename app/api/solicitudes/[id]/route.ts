import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { auth } from "@/lib/auth"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { id } = await params
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("solicitudes")
    .select("*, sancionados(*), documentos_adjuntos(*), abogado:usuarios!abogado_asignado_id(id, nombre, email), logs:logs_auditoria(*)")
    .eq("id", id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 })
  }

  // Control de acceso: JUZGADO solo puede ver sus propias solicitudes
  if (session.user.rol === "JUZGADO" && data?.correo_institucional !== session.user.email) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  return NextResponse.json({ data })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { id } = await params
  const supabase = createAdminClient()
  const body = await request.json()

  // Control de acceso por rol
  if (session.user.rol === "JUZGADO") {
    const { data: solicitud } = await supabase
      .from("solicitudes")
      .select("correo_institucional")
      .eq("id", id)
      .single()
    if (solicitud?.correo_institucional !== session.user.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }
  } else if (session.user.rol === "ABOGADO") {
    const { data: solicitud } = await supabase
      .from("solicitudes")
      .select("abogado_asignado_id")
      .eq("id", id)
      .single()
    if (solicitud?.abogado_asignado_id !== session.user.usuarioId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }
  }

  // Obtener estado anterior para auditoria y validación de transiciones
  const { data: solicitudActual } = await supabase
    .from("solicitudes")
    .select("estado")
    .eq("id", id)
    .single()

  // Validar transiciones de estado permitidas
  if (body.estado && solicitudActual && body.estado !== solicitudActual.estado) {
    const VALID_TRANSITIONS: Record<string, string[]> = {
      EN_VALIDACION: ["RADICADA_EN_SIGOBIUS", "DEVUELTA_POR_GESTOR"],
      RADICADA_EN_SIGOBIUS: ["ASIGNADA_A_ABOGADO"],
      ASIGNADA_A_ABOGADO: ["RADICADA_EN_GCC", "DEVUELTA_POR_ABOGADO"],
      DEVUELTA_POR_GESTOR: ["EN_VALIDACION"],
      DEVUELTA_POR_ABOGADO: ["EN_VALIDACION"],
      RADICADA_EN_GCC: [],
    }
    const allowed = VALID_TRANSITIONS[solicitudActual.estado] || []
    if (!allowed.includes(body.estado)) {
      return NextResponse.json(
        { error: `Transición inválida: no se puede pasar de ${solicitudActual.estado} a ${body.estado}` },
        { status: 400 }
      )
    }
  }

  // Whitelist: solo campos permitidos para actualización según rol
  const ALLOWED_UPDATE_FIELDS = [
    "estado",
    "observaciones",
    "motivo_devolucion",
    "radicado_sigobius",
    "prioridad",
    "dias_sla",
    "juzgado_conocimiento",
    "descripcion_proceso",
    "abogado_asignado_id",
    "fecha_asignacion",
    "fecha_radicacion_gcc",
  ]
  const updateData: Record<string, unknown> = {}
  for (const key of ALLOWED_UPDATE_FIELDS) {
    if (key in body) {
      updateData[key] = body[key]
    }
  }
  updateData["updated_at"] = new Date().toISOString()

  const { data, error } = await supabase
    .from("solicitudes")
    .update(updateData)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Registrar cambio en auditoria
  if (body.estado && solicitudActual && body.estado !== solicitudActual.estado) {
    await supabase.from("logs_auditoria").insert({
      usuario_id: session.user.usuarioId,
      solicitud_id: id,
      tipo_accion: "CAMBIO_ESTADO",
      estado_anterior: solicitudActual.estado,
      estado_nuevo: body.estado,
      observaciones: body.observaciones || "",
    })
  }

  return NextResponse.json({ data })
}
