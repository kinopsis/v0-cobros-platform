import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { auth } from "@/lib/auth"
import { usuarioUpdateSchema } from "@/lib/validations/usuario-schema"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || session.user.rol !== "ADMIN") {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
  }

  const { id } = await params
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("usuarios")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
  }

  // Obtener actividad reciente
  const { data: actividad } = await supabase
    .from("logs_auditoria")
    .select("*")
    .eq("usuario_id", id)
    .order("timestamp", { ascending: false })
    .limit(10)

  return NextResponse.json({ data: { ...data, actividad_reciente: actividad || [] } })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || session.user.rol !== "ADMIN") {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
  }

  const { id } = await params
  const supabase = createAdminClient()
  const body = await request.json()

  const parsed = usuarioUpdateSchema.safeParse({ ...body, id })
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos invalidos", detalles: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { id: _, ...updateData } = parsed.data

  const { data, error } = await supabase
    .from("usuarios")
    .update({
      ...updateData,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Registrar en auditoria
  await supabase.from("logs_auditoria").insert({
    usuario_id: session.user.usuarioId,
    tipo_accion: "ACTUALIZACION_USUARIO",
    observaciones: `Usuario ${id} actualizado`,
  })

  return NextResponse.json({ data })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || session.user.rol !== "ADMIN") {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
  }

  const { id } = await params
  const supabase = createAdminClient()

  // Soft-delete: desactivar en vez de eliminar
  const { data, error } = await supabase
    .from("usuarios")
    .update({ activo: false, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}
