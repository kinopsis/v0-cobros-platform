import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { auth } from "@/lib/auth"
import { usuarioCreateSchema } from "@/lib/validations/usuario-schema"

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.rol !== "ADMIN") {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
  }

  const supabase = createAdminClient()
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "20")
  const rol = searchParams.get("rol")
  const search = searchParams.get("search")
  const activo = searchParams.get("activo")
  const ciudad = searchParams.get("ciudad")
  const especialidadArea = searchParams.get("especialidad_area")
  const exportCsv = searchParams.get("export") === "csv"
  const offset = (page - 1) * limit

  let query = supabase
    .from("usuarios")
    .select("*", { count: "exact" })

  if (rol) {
    query = query.eq("rol", rol)
  }
  if (activo !== null && activo !== undefined && activo !== "") {
    query = query.eq("activo", activo === "true")
  }
  if (search) {
    query = query.or(`nombre.ilike.%${search}%,email.ilike.%${search}%,nombre_juzgado.ilike.%${search}%`)
  }
  if (ciudad) {
    query = query.ilike("ciudad", `%${ciudad}%`)
  }
  if (especialidadArea) {
    query = query.ilike("especialidad_area", `%${especialidadArea}%`)
  }

  // Exportación CSV: devolver todos los resultados sin paginación
  if (exportCsv) {
    const { data, error } = await query
      .order("created_at", { ascending: false })
      .limit(2000)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const headers = [
      "nombre", "email", "rol", "ciudad", "distrito", "circuito",
      "nombre_juzgado", "telefono", "corporacion", "especialidad_area", "activo"
    ]

    const escapeCsv = (val: unknown): string => {
      const str = val != null ? String(val) : ""
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }

    const rows = (data || []).map((u: Record<string, unknown>) =>
      headers.map((h) => escapeCsv(u[h])).join(",")
    )

    const csv = "\uFEFF" + headers.join(",") + "\n" + rows.join("\n")

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=usuarios.csv",
      },
    })
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
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
  if (!session?.user || session.user.rol !== "ADMIN") {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
  }

  const supabase = createAdminClient()
  const body = await request.json()

  const parsed = usuarioCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos invalidos", detalles: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from("usuarios")
    .insert({
      ...parsed.data,
      creado_por: session.user.usuarioId,
    })
    .select()
    .single()

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "El email ya esta registrado" },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
}
