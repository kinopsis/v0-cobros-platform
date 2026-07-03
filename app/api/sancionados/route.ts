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
  const lookup = searchParams.get("lookup")
  const search = searchParams.get("search") || ""
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "50")
  const isExport = searchParams.get("export") === "csv"

  try {
    if (lookup) {
      const { data, error } = await supabase
        .from("sancionados")
        .select("nombre_completo, tipo_documento, numero_documento, tipo_persona, ciudad")
        .eq("numero_documento", lookup)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) throw error
      if (!data) return NextResponse.json({ found: false, data: null })
      return NextResponse.json({ found: true, data })
    }

    let query = supabase.from("sancionados").select(
      "id, nombre_completo, tipo_documento, numero_documento, tipo_persona, tipo_sancion, cantidad_sancion, solicitud_id, ciudad",
      { count: "exact" }
    )

    if (search) {
      query = query.ilike("nombre_completo", `%${search}%`)
    }

    if (session.user.rol === "JUZGADO") {
      const { data: solsJuzgado } = await supabase
        .from("solicitudes")
        .select("id")
        .eq("correo_institucional", session.user.email)
      const solicitudIds = (solsJuzgado || []).map((s: any) => s.id)
      if (solicitudIds.length === 0) return NextResponse.json({ data: [], total: 0, page, limit, totalPages: 0 })
      query = query.in("solicitud_id", solicitudIds)
    }

    if (session.user.rol === "ABOGADO") {
      const { data: solsAbogado } = await supabase
        .from("solicitudes")
        .select("id")
        .eq("abogado_asignado_id", session.user.usuarioId)
      const solicitudIds = (solsAbogado || []).map((s: any) => s.id)
      if (solicitudIds.length === 0) return NextResponse.json({ data: [], total: 0, page, limit, totalPages: 0 })
      query = query.in("solicitud_id", solicitudIds)
    }

    if (isExport && session.user.rol === "ADMIN") {
      const { data, error } = await query.order("nombre_completo", { ascending: true })
      if (error) throw error
      const csvHeader = "Nombre,Documento,Tipo,Persona,Sanción,Valor,Ciudad,Solicitud"
      const csvRows = (data || []).map((row: any) =>
        `"${(row.nombre_completo || "").replace(/"/g, '""')}","${row.numero_documento || ""}","${row.tipo_documento || ""}","${row.tipo_persona || ""}","${row.tipo_sancion || ""}","${row.cantidad_sancion || ""}","${row.ciudad || ""}","${row.solicitud_id || ""}"`
      )
      const csv = [csvHeader, ...csvRows].join("\n")
      return new NextResponse(csv, { status: 200, headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename=sancionados_${new Date().toISOString().split("T")[0]}.csv` } })
    }

    const offset = (page - 1) * limit
    const { data, error, count } = await query.order("nombre_completo", { ascending: true }).range(offset, offset + limit - 1)
    if (error) throw error
    return NextResponse.json({ data: data || [], total: count || 0, page, limit, totalPages: Math.ceil((count || 0) / limit) })
  } catch (err: any) {
    console.error("[sancionados API]", err.message)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
