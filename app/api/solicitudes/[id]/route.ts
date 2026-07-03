import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { auth } from "@/lib/auth"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
  } catch (err: any) {
    console.error("[GET /api/solicitudes/[id]] Error:", err)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { id } = await params
  const supabase = createAdminClient()

  // Detectar Content-Type: FormData (corrección del juzgado) vs JSON (gestor/abogado)
  const contentType = request.headers.get("content-type") || ""
  let body: Record<string, any> = {}

  if (contentType.includes("multipart/form-data")) {
    const fd = await request.formData()
    for (const [key, value] of fd.entries()) {
      if (key === "documentos" || key === "sancionados" || key === "etapa_preliminar") continue
      body[key] = value
    }
    // Mapear nombres de campo del formulario a columnas de BD
    if (fd.get("naturaleza")) body["clase_proceso"] = fd.get("naturaleza")
    if (fd.get("concepto")) body["asunto"] = fd.get("concepto")
    if (fd.get("respuesta_juzgado")) body["respuesta_juzgado"] = fd.get("respuesta_juzgado")
  } else {
    body = await request.json()
  }

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

  // Whitelist: campos permitidos para actualización según rol y estado
  const BASE_FIELDS = [
    "estado",
    "observaciones",
    "motivo_devolucion",
    "motivo_devolucion_abogado",
  ]

  // Campos que puede editar el JUZGADO cuando corrige una devolución
  const JUZGADO_CORRECCION_FIELDS = [
    "radicado_origen",
    "clase_proceso",
    "asunto",
    "juzgado_conocimiento",
    "descripcion_proceso",
    "etapa_preliminar",
    "respuesta_juzgado",
  ]

  // Campos administrativos (GESTOR/ADMIN)
  const ADMIN_FIELDS = [
    "radicado_sigobius",
    "prioridad",
    "dias_sla",
    "abogado_asignado_id",
    "fecha_asignacion",
    "fecha_radicacion_gcc",
  ]

  let ALLOWED_UPDATE_FIELDS = [...BASE_FIELDS]

  // JUZGADO puede editar datos de la solicitud cuando está en estado de devolución
  const estadosCorregibles = ["DEVUELTA_POR_GESTOR", "DEVUELTA_POR_ABOGADO", "EN_VALIDACION"]
  if (session.user.rol === "JUZGADO" && solicitudActual && estadosCorregibles.includes(solicitudActual.estado)) {
    ALLOWED_UPDATE_FIELDS.push(...JUZGADO_CORRECCION_FIELDS)
  }

  // GESTOR y ADMIN pueden usar campos administrativos
  if (session.user.rol === "GESTOR" || session.user.rol === "ADMIN") {
    ALLOWED_UPDATE_FIELDS.push(...ADMIN_FIELDS)
  }
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
  } catch (err: any) {
    console.error("[PATCH /api/solicitudes/[id]] Error:", err)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
