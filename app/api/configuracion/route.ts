import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { auth } from "@/lib/auth"

export async function GET(_request: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.rol !== "ADMIN") {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
  }

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("configuracion_sistema")
    .select("*")
    .order("seccion")

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Organizar por seccion
  const configuracion: Record<string, Record<string, string>> = {}
  data?.forEach((item) => {
    if (!configuracion[item.seccion]) {
      configuracion[item.seccion] = {}
    }
    configuracion[item.seccion][item.clave] = item.valor
  })

  return NextResponse.json({ data: configuracion })
}

export async function PUT(request: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.rol !== "ADMIN") {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
  }

  const supabase = createAdminClient()
  const body = await request.json()
  const { configuraciones } = body

  if (!configuraciones || !Array.isArray(configuraciones)) {
    return NextResponse.json({ error: "Formato invalido" }, { status: 400 })
  }

  const updates = configuraciones.map((c: any) => ({
    ...c,
    actualizado_por: session.user.usuarioId,
    updated_at: new Date().toISOString(),
  }))

  const { error } = await supabase
    .from("configuracion_sistema")
    .upsert(updates, {
      onConflict: "seccion,clave",
      ignoreDuplicates: false,
    })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
