import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { auth } from "@/lib/auth"

/**
 * DELETE /api/documentos/[id]
 * 
 * Elimina un documento adjunto de Supabase Storage y de la tabla documentos_adjuntos.
 * Solo el JUZGADO dueño de la solicitud puede eliminar sus documentos.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { id } = await params
  const supabase = createAdminClient()

  // Obtener el documento para verificar propiedad
  const { data: doc, error: fetchError } = await supabase
    .from("documentos_adjuntos")
    .select("*, solicitud:solicitudes(correo_institucional)")
    .eq("id", id)
    .single()

  if (fetchError || !doc) {
    return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 })
  }

  // Verificar que el usuario sea el dueño de la solicitud
  if (
    session.user.rol === "JUZGADO" &&
    (doc as any).solicitud?.correo_institucional !== session.user.email
  ) {
    return NextResponse.json({ error: "No autorizado para eliminar este documento" }, { status: 403 })
  }

  // Eliminar archivo de Supabase Storage
  const { error: storageError } = await supabase.storage
    .from("solicitudes-docs")
    .remove([doc.storage_path])

  if (storageError) {
    return NextResponse.json({ error: storageError.message }, { status: 500 })
  }

  // Eliminar registro de la BD
  const { error: deleteError } = await supabase
    .from("documentos_adjuntos")
    .delete()
    .eq("id", id)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
