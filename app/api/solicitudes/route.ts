import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { auth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const supabase = createAdminClient()
  const { searchParams } = new URL(request.url)
  const estado = searchParams.get("estado")
  const claseProceso = searchParams.get("clase_proceso")
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "20")
  const offset = (page - 1) * limit
  let query = supabase.from("solicitudes").select("*", { count: "exact" })
  if (estado) query = query.eq("estado", estado)
  if (claseProceso) query = query.eq("clase_proceso", claseProceso)
  if (session.user.rol === "JUZGADO") query = query.eq("correo_institucional", session.user.email)
  else if (session.user.rol === "ABOGADO") query = query.eq("abogado_asignado_id", session.user.usuarioId)
  if (session.user.rol !== "ADMIN") query = query.neq("estado", "BORRADOR")
  const { data, error, count } = await query.order("fecha_solicitud", { ascending: false }).range(offset, offset + limit - 1)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return Response.json({ data: data || [], total: count || 0, page, limit, totalPages: Math.ceil((count || 0) / limit) }, { status: 200 })
}
