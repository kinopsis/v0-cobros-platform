import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { auth } from "@/lib/auth"

async function checkAdmin() { const s = await auth(); if (!s?.user || s.user.rol !== "ADMIN") return null; return s.user }

export async function GET(request: NextRequest) {
  const u = await checkAdmin(); if (!u) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
  const supabase = createAdminClient(); const { searchParams } = new URL(request.url)
  const isExport = searchParams.get("export") === "csv"; const search = searchParams.get("search") || ""
  const page = parseInt(searchParams.get("page") || "1"); const limit = parseInt(searchParams.get("limit") || "50")
  try {
    let query = supabase.from("codigos_despachos").select("*", { count: "exact" })
    if (search) query = query.or(`codigo.ilike.%${search}%,nombre.ilike.%${search}%`)
    if (isExport) {
      const { data, error } = await query.order("codigo", { ascending: true })
      if (error) throw error
      const csvHeader = "Codigo,Nombre"
      const csvRows = (data || []).map((r: any) => `"${r.codigo}","${(r.nombre || "").replace(/"/g, '""')}"`)
      const csv = [csvHeader, ...csvRows].join("\n")
      return new NextResponse(csv, { status: 200, headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename=juzgados.csv` } })
    }
    const offset = (page - 1) * limit
    const { data, error, count } = await query.order("codigo", { ascending: true }).range(offset, offset + limit - 1)
    if (error) throw error
    return NextResponse.json({ data: data || [], total: count || 0, page, limit, totalPages: Math.ceil((count || 0) / limit) })
  } catch (e: any) { return NextResponse.json({ error: "Error" }, { status: 500 }) }
}

export async function POST(request: NextRequest) {
  const u = await checkAdmin(); if (!u) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
  const supabase = createAdminClient()
  try {
    const { codigo, nombre } = await request.json()
    if (!codigo || !nombre) return NextResponse.json({ error: "Requerido" }, { status: 400 })
    const { data: ex } = await supabase.from("codigos_despachos").select("codigo").eq("codigo", codigo).maybeSingle()
    if (ex) return NextResponse.json({ error: "Ya existe" }, { status: 409 })
    const { data, error } = await supabase.from("codigos_despachos").insert({ codigo, nombre }).select().single()
    if (error) throw error
    return NextResponse.json({ data }, { status: 201 })
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}

export async function PUT(request: NextRequest) {
  const u = await checkAdmin(); if (!u) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
  const supabase = createAdminClient()
  try {
    const { codigo, nombre } = await request.json()
    if (!codigo || !nombre) return NextResponse.json({ error: "Requerido" }, { status: 400 })
    const { data, error } = await supabase.from("codigos_despachos").update({ nombre }).eq("codigo", codigo).select().single()
    if (error) throw error; if (!data) return NextResponse.json({ error: "No encontrado" }, { status: 404 })
    return NextResponse.json({ data })
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}

export async function DELETE(request: NextRequest) {
  const u = await checkAdmin(); if (!u) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
  const supabase = createAdminClient()
  const codigo = new URL(request.url).searchParams.get("codigo")
  if (!codigo) return NextResponse.json({ error: "codigo requerido" }, { status: 400 })
  try {
    const { error } = await supabase.from("codigos_despachos").delete().eq("codigo", codigo)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}
