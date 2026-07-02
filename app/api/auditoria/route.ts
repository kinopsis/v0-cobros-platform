import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { auth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const supabase = createAdminClient()
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "20")
  const usuarioId = searchParams.get("usuarioId")
  const tipoAccion = searchParams.get("tipoAccion")
  const solicitudId = searchParams.get("solicitud_id")
  const offset = (page - 1) * limit

  // Control de acceso: GESTOR y ADMIN pueden ver todo; JUZGADO solo sus propias solicitudes
  if (session.user.rol === "JUZGADO" && solicitudId) {
    const { data: sol } = await supabase
      .from("solicitudes")
      .select("correo_institucional")
      .eq("id", solicitudId)
      .single()
    if (!sol || sol.correo_institucional !== session.user.email) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
    }
  } else if (session.user.rol !== "GESTOR" && session.user.rol !== "ADMIN") {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
  }

  let query = supabase
    .from("logs_auditoria")
    .select("*, usuario:usuarios(nombre, email)", { count: "exact" })

  if (usuarioId) {
    query = query.eq("usuario_id", usuarioId)
  }
  if (tipoAccion) {
    query = query.eq("tipo_accion", tipoAccion)
  }
  if (solicitudId) {
    query = query.eq("solicitud_id", solicitudId)
  }

  const { data, error, count } = await query
    .order("timestamp", { ascending: false })
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
