import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { auth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const radicado = searchParams.get("radicado")

  if (!radicado || radicado.length < 10) {
    return NextResponse.json(
      { error: "Radicado invalido o muy corto" },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("despachos")
    .select("radicado_origen, codigo_despacho, nombre_despacho")
    .eq("radicado_origen", radicado)
    .single()

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json(
        { found: false, message: "Radicado no encontrado en la base de datos" },
        { status: 404 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ found: true, data })
}
