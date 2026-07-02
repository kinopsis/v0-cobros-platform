import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { auth } from "@/lib/auth"

export async function POST(_request: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.rol !== "ADMIN") {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
  }

  const supabase = createAdminClient()
  const inicio = new Date()
  let nuevos = 0
  let actualizados = 0
  let errores = 0

  try {
    // Contar usuarios ya sincronizados
    const { count: antesSync } = await supabase
      .from("usuarios")
      .select("*", { count: "exact", head: true })
      .not("azure_oid", "is", null)

    // Actualizar ultima sync
    await supabase
      .from("configuracion_sistema")
      .upsert({
        seccion: "office365",
        clave: "ultima_sync",
        valor: inicio.toISOString(),
        updated_at: new Date().toISOString(),
      })

    // La sincronizacion real con Azure AD se hace via Microsoft Graph API
    // cuando el tenant esta configurado. Por ahora registramos el intento.
    const { count: despuesSync } = await supabase
      .from("usuarios")
      .select("*", { count: "exact", head: true })
      .not("azure_oid", "is", null)

    nuevos = Math.max(0, (despuesSync || 0) - (antesSync || 0))

    const duracion = (new Date().getTime() - inicio.getTime()) / 1000

    return NextResponse.json({
      success: true,
      inicio: inicio.toISOString(),
      duracion: `${duracion.toFixed(1)}s`,
      nuevos,
      actualizados,
      errores,
      totalSincronizados: despuesSync || 0,
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      nuevos,
      actualizados,
      errores: errores + 1,
    })
  }
}
