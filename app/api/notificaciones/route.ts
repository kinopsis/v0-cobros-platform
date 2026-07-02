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
  const offset = (page - 1) * limit

  const { data, error, count } = await supabase
    .from("notificaciones")
    .select("*", { count: "exact" })
    .eq("usuario_id", session.user.usuarioId)
    .order("fecha_creacion", { ascending: false })
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

export async function PATCH(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const supabase = createAdminClient()
  const body = await request.json()
  const { ids, accion } = body

  if (!ids || !Array.isArray(ids)) {
    return NextResponse.json({ error: "Se requiere un array de ids" }, { status: 400 })
  }

  if (accion === "marcar_leidas") {
    const { error } = await supabase
      .from("notificaciones")
      .update({ leida: true })
      .in("id", ids)
      .eq("usuario_id", session.user.usuarioId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true })
}
