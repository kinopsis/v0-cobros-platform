import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { auth } from "@/lib/auth"
import { generateSolicitudId } from "@/lib/mock-data"

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const supabase = createAdminClient()
  const { searchParams } = new URL(request.url)
  const estado = searchParams.get("estado")
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "20")
  const offset = (page - 1) * limit

  let query = supabase.from("solicitudes").select("*, sancionados(id, nombre_completo, tipo_documento, numero_documento, tipo_persona, cantidad_sancion, tipo_sancion)", { count: "exact" })

  if (estado) {
    query = query.eq("estado", estado)
  }

  // Filtrar por rol
  if (session.user.rol === "JUZGADO") {
    query = query.eq("correo_institucional", session.user.email)
  } else if (session.user.rol === "ABOGADO") {
    query = query.eq("abogado_asignado_id", session.user.usuarioId)
  }

  const { data, error, count } = await query
    .order("fecha_solicitud", { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    data: data || [],
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  })
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const supabase = createAdminClient()
  
  // Procesar FormData (soporta archivos)
  const fd = await request.formData()
  
  const radicado_origen = fd.get("radicado_origen") as string
  const naturaleza = fd.get("naturaleza") as string
  const concepto = fd.get("concepto") as string
  const sancionadosRaw = fd.get("sancionados") as string
  const sancionados = JSON.parse(sancionadosRaw || "[]")
  const etapaPreliminarRaw = fd.get("etapa_preliminar") as string
  const etapa_preliminar = JSON.parse(etapaPreliminarRaw || "{}")
  
  // Extraer archivos
  const documentos = fd.getAll("documentos") as File[]

  // Obtener datos completos del usuario autenticado para poblar campos del despacho
  const { data: usuarioDB } = await supabase
    .from("usuarios")
    .select("codigo_despacho, nombre_juzgado, nombre, email")
    .eq("id", session.user.usuarioId)
    .single()

  const solicitudId = await generateSolicitudId(supabase)

  const { data, error } = await supabase
    .from("solicitudes")
    .insert({
      id: solicitudId,
      // Datos del despacho (poblados desde BD/sesion, no desde el form)
      codigo_despacho: usuarioDB?.codigo_despacho || "",
      nombre_juzgado: usuarioDB?.nombre_juzgado || "",
      funcionario_remitente: usuarioDB?.nombre || session.user.nombre || "",
      correo_institucional: usuarioDB?.email || session.user.email || "",
      // Datos del proceso (vienen del formulario)
      radicado_origen: radicado_origen || "",
      clase_proceso: (naturaleza || "DESACATO"),  // DB col: clase_proceso
      asunto: (concepto || "PROVIDENCIA"),          // DB col: asunto
      juzgado_conocimiento: null,
      descripcion_proceso: null,
      // Etapa preliminar (viene del form)
      etapa_preliminar: etapa_preliminar || null,
      prioridad: "MEDIA",
      dias_sla: 10,
      observaciones: null,
      // Metadatos del sistema
      radicado_sigobius: null,
      estado: "EN_VALIDACION",
      created_by: session.user.usuarioId,
      fecha_solicitud: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Insertar sancionados en la tabla separada
  if (sancionados.length > 0) {
    const sancionadosParaInsertar = sancionados.map((s: any) => ({
      solicitud_id: solicitudId,
      nombre_completo: s.nombre_completo || s.nombreCompleto || "",
      tipo_documento: s.tipo_documento || s.tipoDocumento || "CC",
      numero_documento: s.numero_documento || s.numeroDocumento || "",
      tipo_persona: s.tipo_persona || s.tipoPersona || "NATURAL",
      direccion: s.direccion || null,
      ciudad: s.ciudad || null,
      tipo_sancion: s.tipo_sancion || s.tipoSancion || null,
      cantidad_sancion: s.cantidad_sancion || s.cantidadSancion || null,
    }))
    await supabase.from("sancionados").insert(sancionadosParaInsertar)
  }

  // Subir documentos a Supabase Storage
  const documentosAdjuntos = []
  for (const file of documentos) {
    try {
      const filePath = `${solicitudId}/${Date.now()}-${file.name}`
      const { error: uploadError } = await supabase.storage
        .from("solicitudes-docs")
        .upload(filePath, file, {
          contentType: "application/pdf",
          upsert: false,
        })

      if (!uploadError) {
        const { data: urlData } = await supabase.storage
          .from("solicitudes-docs")
          .createSignedUrl(filePath, 3600)

        documentosAdjuntos.push({
          solicitud_id: solicitudId,
          nombre: file.name,
          tipo: "application/pdf",
          url: urlData?.signedUrl || "",
          storage_path: filePath,
          es_obligatorio: true,
          fecha_carga: new Date().toISOString(),
        })
      } else {
        console.error("Error al subir documento a Storage:", uploadError)
      }
    } catch (uploadErr) {
      console.error("Error al subir documento:", uploadErr)
    }
  }

  // Insertar registros en documentos_adjuntos
  if (documentosAdjuntos.length > 0) {
    const { error: insertDocsError } = await supabase.from("documentos_adjuntos").insert(documentosAdjuntos)
    if (insertDocsError) {
      console.error("Error insertando en documentos_adjuntos:", insertDocsError)
    }
  }

  // Registrar en auditoria
  await supabase.from("logs_auditoria").insert({
    usuario_id: session.user.usuarioId,
    solicitud_id: solicitudId,
    tipo_accion: "CREACION",
    estado_nuevo: "EN_VALIDACION",
    observaciones: "Solicitud creada desde portal de juzgados",
  })

  return NextResponse.json({ data }, { status: 201 })
}
