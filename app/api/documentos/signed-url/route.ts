import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { auth } from "@/lib/auth"

/**
 * GET /api/documentos/signed-url?path=SOL-XXXXX/timestamp-filename.pdf
 * 
 * Genera una URL firmada fresca (válida por 1 hora) para visualizar
 * o descargar un documento almacenado en Supabase Storage.
 * Requiere autenticación.
 */
export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const storagePath = searchParams.get("path")

  if (!storagePath) {
    return NextResponse.json({ error: "Falta el parámetro 'path'" }, { status: 400 })
  }

  // Prevenir path traversal
  if (storagePath.includes("..") || storagePath.includes("\\")) {
    return NextResponse.json({ error: "Ruta inválida" }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Generar URL firmada fresca (1 hora de validez)
  const { data, error } = await supabase.storage
    .from("solicitudes-docs")
    .createSignedUrl(storagePath, 3600)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ signedUrl: data.signedUrl })
}
