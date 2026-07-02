import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { auth } from "@/lib/auth"

/**
 * GET /api/despachos/codigos
 * 
 * Query params:
 *   ?prefijo=X  — Busca códigos cuyo codigo comience con X (LIKE 'X%')
 *                  Retorna hasta 20 resultados, ordenados por longitud descendente
 *                  (longest-prefix-match primero)
 *   ?codigo=X   — Búsqueda exacta por código
 *   (sin params) — Retorna TODOS los códigos (para precarga en frontend)
 */
export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const supabase = createAdminClient()
  const { searchParams } = new URL(request.url)
  const prefijo = searchParams.get("prefijo")
  const codigo = searchParams.get("codigo")

  try {
    // Búsqueda exacta por código
    if (codigo) {
      const { data, error } = await supabase
        .from("codigos_despachos")
        .select("codigo, nombre")
        .eq("codigo", codigo)
        .single()

      if (error) {
        if (error.code === "PGRST116") {
          return NextResponse.json({ found: false, data: null })
        }
        throw error
      }

      return NextResponse.json({ found: true, data })
    }

    // Búsqueda por prefijo
    if (prefijo) {
      const { data, error } = await supabase
        .from("codigos_despachos")
        .select("codigo, nombre")
        .like("codigo", `${prefijo}%`)
        .order("codigo", { ascending: true })
        .limit(20)

      if (error) throw error

      return NextResponse.json({ data: data || [] })
    }

    // Sin params: retornar todos los códigos (para precarga)
    const { data, error } = await supabase
      .from("codigos_despachos")
      .select("codigo, nombre")
      .order("codigo", { ascending: true })

    if (error) throw error

    return NextResponse.json({ data: data || [] })
  } catch (err: any) {
    console.error("[codigos API]", err.message)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
