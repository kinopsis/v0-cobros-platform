import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { auth } from "@/lib/auth"
import { solicitudLimiter } from "@/lib/rate-limit"
import { solicitudCreateSchema } from "@/lib/validations/solicitud-schema"
import { apiError, logApi } from "@/lib/api-helpers"
import { generateSolicitudId } from "@/lib/mock-data"

export async function GET(request: NextRequest) {
  const session = await auth()
  console.log("[GET /api/solicitudes] INICIO — autenticado:", !!session?.user, "rol:", session?.user?.rol)
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const supabase = createAdminClient()
  const { searchParams } = new URL(request.url)
  const estado = searchParams.get("estado")
  const claseProceso = searchParams.get("clase_proceso")
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "20")
  const offset = (page - 1) * limit

  let query = supabase.from("solicitudes").select("*", { count: "exact" })

  if (estado) {
    query = query.eq("estado", estado)
  }

  if (claseProceso) {
    query = query.eq("clase_proceso", claseProceso)
  }

  if (session.user.rol === "JUZGADO") {
    query = query.eq("correo_institucional", session.user.email)
  } else if (session.user.rol === "ABOGADO") {
    query = query.eq("abogado_asignado_id", session.user.usuarioId)
  }

  if (session.user.rol !== "ADMIN") {
    query = query.neq("estado", "BORRADOR")
  }

  const { data, error, count } = await query
    .order("fecha_solicitud", { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error("[GET /api/solicitudes] ERROR:", error)
    return apiError(error.message, "Error al obtener solicitudes")
  }

  const responseData = {
    data: data || [],
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  }
  console.log("[GET /api/solicitudes] ÉXITO — filas:", (data || []).length, "total:", count)
  return Response.json(responseData, { status: 200 })
}

export async function POST(request: NextRequest) {
  try {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const rateLimitResult = await solicitudLimiter.limit(`solicitud:${session.user.usuarioId}`)
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Intente de nuevo en un minuto." },
      { status: 429 }
    )
  }

  const supabase = createAdminClient()
  
  const fd = await request.formData()
  
  const radicado_origen = fd.get("radicado_origen") as string
  const naturaleza = fd.get("naturaleza") as string
  const concepto = fd.get("concepto") as string
  const sancionadosRaw = fd.get("sancionados") as string
  const etapaPreliminarRaw = fd.get("etapa_preliminar") as string
  const estado = (fd.get("estado") as string) || "EN_VALIDACION"

  let sancionados: any[] = []
  let etapa_preliminar: Record<string, unknown> = {}
  try {
    sancionados = JSON.parse(sancionadosRaw || "[]")
    etapa_preliminar = JSON.parse(etapaPreliminarRaw || "{}")
  } catch {
    return NextResponse.json(
      { error: "Datos inválidos: formato JSON incorrecto en sancionados o etapa_preliminar" },
      { status: 400 }
    )
  }

  const validation = solicitudCreateSchema.safeParse({
    radicado_origen,
    naturaleza,
    concepto,
    sancionados,
    etapa_preliminar: Object.keys(etapa_preliminar).length > 0 ? etapa_preliminar : undefined,
    estado,
  })

  if (!validation.success) {
    return NextResponse.json(
      {
        error: "Datos inválidos",
        details: validation.error.flatten(),
      },
      { status: 400 }
    )
  }

  let codigoJuzgadoResuelto: string | null = null
  let nombreJuzgadoResuelto: string | null = null
  if (radicado_origen) {
    const newFormatMatch = radicado_origen.match(/^0-(\d+)-\d{9}-00$/)
    let codigoBuscar: string | null = null
    if (newFormatMatch) {
      codigoBuscar = newFormatMatch[1]
    } else {
      codigoBuscar = radicado_origen
    }

    if (codigoBuscar) {
      const { data: codigoData } = await supabase
        .from("codigos_despachos")
        .select("codigo, nombre")
        .eq("codigo", codigoBuscar)
        .maybeSingle()

      if (codigoData) {
        codigoJuzgadoResuelto = codigoData.codigo
        nombreJuzgadoResuelto = codigoData.nombre
      } else {
        const { data: codigosData } = await supabase
          .from("codigos_despachos")
          .select("codigo, nombre")
          .order("codigo", { ascending: false })
          .limit(50)

        if (codigosData?.length) {
          for (const c of codigosData) {
            if (radicado_origen.startsWith(c.codigo)) {
              codigoJuzgadoResuelto = c.codigo
              nombreJuzgadoResuelto = c.nombre
              break
            }
          }
        }
      }
    }
  }
  
  const documentos = fd.getAll("documentos") as File[]

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
      codigo_despacho: usuarioDB?.codigo_despacho || "",
      nombre_juzgado: usuarioDB?.nombre_juzgado || "",
      funcionario_remitente: usuarioDB?.nombre || session.user.nombre || "",
      correo_institucional: usuarioDB?.email || session.user.email || "",
      radicado_origen: radicado_origen || "",
      clase_proceso: (naturaleza || "DESACATO"),
      asunto: (concepto || "PROVIDENCIA"),
      juzgado_conocimiento: nombreJuzgadoResuelto || null,
      descripcion_proceso: codigoJuzgadoResuelto
        ? `Código origen: ${codigoJuzgadoResuelto} — ${nombreJuzgadoResuelto}`
        : null,
      etapa_preliminar: etapa_preliminar || null,
      prioridad: "MEDIA",
      dias_sla: 10,
      observaciones: null,
      radicado_sigobius: null,
      estado: estado,
      created_by: session.user.usuarioId,
      fecha_solicitud: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    return apiError(error.message, "Error al crear la solicitud")
  }

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

  const documentosAdjuntos = []
  const uploadErrors: string[] = []
  
  for (const file of documentos) {
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
      const filePath = `${solicitudId}/${Date.now()}-${safeName}`
      
      const arrayBuffer = await file.arrayBuffer()

      const MAX_FILE_SIZE = 10 * 1024 * 1024
      if (file.size > MAX_FILE_SIZE) {
        uploadErrors.push(`${file.name}: El archivo excede el tamaño máximo permitido (10MB).`)
        continue
      }

      const header = new Uint8Array(arrayBuffer.slice(0, 5))
      const isPdf =
        header[0] === 0x25 &&
        header[1] === 0x50 &&
        header[2] === 0x44 &&
        header[3] === 0x46 &&
        header[4] === 0x2D
      if (!isPdf) {
        uploadErrors.push(`${file.name}: Tipo de archivo no permitido. Solo se aceptan archivos PDF.`)
        continue
      }

      const buffer = Buffer.from(arrayBuffer)
      
      const { error: uploadError } = await supabase.storage
        .from("solicitudes-docs")
        .upload(filePath, buffer, {
          contentType: file.type || "application/pdf",
          upsert: false,
        })

      if (uploadError) {
        logApi("error", `[Upload Error] ${file.name}`, uploadError)
        uploadErrors.push(`${file.name}: ${uploadError.message}`)
        continue
      }

      const { data: urlData } = await supabase.storage
        .from("solicitudes-docs")
        .createSignedUrl(filePath, 3600)

      documentosAdjuntos.push({
        solicitud_id: solicitudId,
        nombre: file.name,
        tipo: file.type || "application/pdf",
        url: urlData?.signedUrl || "",
        storage_path: filePath,
        es_obligatorio: true,
        fecha_carga: new Date().toISOString(),
      })
    } catch (uploadErr: any) {
      logApi("error", `[Upload Exception] ${file.name}`, uploadErr)
      uploadErrors.push(`${file.name}: ${uploadErr.message || "Error desconocido"}`)
    }
  }

  if (documentosAdjuntos.length > 0) {
    const { error: insertDocsError } = await supabase.from("documentos_adjuntos").insert(documentosAdjuntos)
    if (insertDocsError) {
      logApi("error", "Error insertando en documentos_adjuntos", insertDocsError)
    }
  }

  await supabase.from("logs_auditoria").insert({
    usuario_id: session.user.usuarioId,
    solicitud_id: solicitudId,
    tipo_accion: "CREACION",
    estado_nuevo: estado,
    observaciones: estado === "BORRADOR"
      ? "Borrador guardado desde portal de juzgados"
      : "Solicitud creada desde portal de juzgados",
  })

  return NextResponse.json({ 
    data, 
    documentos: { subidos: documentosAdjuntos.length, errores: uploadErrors }
  }, { status: 201 })
  } catch (err: any) {
    console.error("[POST /api/solicitudes] Error no controlado:", err)
    return NextResponse.json(
      { error: err?.message || "Error interno del servidor al crear la solicitud" },
      { status: 500 }
    )
  }
}
