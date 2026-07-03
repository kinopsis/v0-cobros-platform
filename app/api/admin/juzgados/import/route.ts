import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { auth } from "@/lib/auth"

const BATCH_SIZE = 500

export async function POST(request: NextRequest) {
  const s = await auth(); if (!s?.user || s.user.rol !== "ADMIN") return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
  const supabase = createAdminClient()
  try {
    const fd = await request.formData(); const file = fd.get("file") as File | null
    if (!file) return NextResponse.json({ error: "CSV requerido" }, { status: 400 })
    if (!file.name.endsWith(".csv")) return NextResponse.json({ error: "Solo .csv" }, { status: 400 })
    const buf = await file.arrayBuffer(); const txt = new TextDecoder("latin1").decode(buf)
    const lines = txt.split(/\r?\n/).filter(l => l.trim()); if (lines.length < 2) return NextResponse.json({ error: "Vacio" }, { status: 400 })
    const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""))
    const ci = headers.findIndex((h: string) => h.toLowerCase() === "codigo")
    const ni = headers.findIndex((h: string) => h.toLowerCase() === "nombre")
    if (ci === -1 || ni === -1) return NextResponse.json({ error: `Columnas: Codigo,Nombre. Detectadas: ${headers.join(",")}` }, { status: 400 })
    const rows: { codigo: string; nombre: string }[] = []; let pe = 0
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map(c => c.trim().replace(/^"|"$/g, ""))
      const c = cols[ci]?.trim(); const n = cols[ni]?.trim()
      if (!c || !n) { pe++; continue }; rows.push({ codigo: c, nombre: n })
    }
    let inserted = 0; let errors = 0
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const b = rows.slice(i, i + BATCH_SIZE)
      const { error } = await supabase.from("codigos_despachos").upsert(b, { onConflict: "codigo", ignoreDuplicates: false })
      if (error) errors += b.length; else inserted += b.length
    }
    return NextResponse.json({ total_procesados: rows.length, insertados: inserted, actualizados: 0, errores: errors + pe, errores_detalle: [] })
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}
