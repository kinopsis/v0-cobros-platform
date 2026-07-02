import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { auth } from "@/lib/auth"

export async function GET(_request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  // Solo GESTOR y ADMIN pueden listar abogados
  if (session.user.rol !== "GESTOR" && session.user.rol !== "ADMIN") {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
  }

  const supabase = createAdminClient()

  // Obtener abogados activos
  const { data: abogadosData, error } = await supabase
    .from("usuarios")
    .select("id, nombre, email, especialidades, capacidad_maxima, disponibilidad")
    .eq("rol", "ABOGADO")
    .eq("activo", true)
    .order("nombre", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Para cada abogado, obtener sus solicitudes con sancionados en una sola query
  const abogadosConCarga = await Promise.all(
    (abogadosData || []).map(async (abogado) => {
      // Obtener todas las solicitudes del abogado con sus sancionados
      const { data: solicitudes } = await supabase
        .from("solicitudes")
        .select("id, estado, etapa_preliminar, sancionados(cantidad_sancion)")
        .eq("abogado_asignado_id", abogado.id)

      const totalCasos = (solicitudes || []).length
      const casosCerrados = (solicitudes || []).filter(
        (s: any) => s.estado === "RADICADA_EN_GCC"
      ).length
      const casosActivos = totalCasos - casosCerrados

      // Contar sancionados (vía relación incluida en la query)
      let totalSancionados = 0
      for (const sol of (solicitudes || [])) {
        totalSancionados += ((sol as any).sancionados || []).length
      }

      // Sumar monto a recaudar de casos activos (de etapa_preliminar.cantidad)
      let montoRecaudar = 0
      for (const sol of (solicitudes || [])) {
        if ((sol as any).estado !== "RADICADA_EN_GCC") {
          const cantidad = (sol as any).etapa_preliminar?.cantidad
          if (cantidad) {
            const num = parseFloat(String(cantidad).replace(/[^0-9.]/g, ""))
            if (!isNaN(num)) montoRecaudar += num
          }
        }
      }

      return {
        id: abogado.id,
        nombre: abogado.nombre,
        email: abogado.email,
        especialidades: abogado.especialidades || [],
        capacidad_maxima: abogado.capacidad_maxima || 20,
        disponibilidad: abogado.disponibilidad || "DISPONIBLE",
        casos_asignados: totalCasos,
        casos_activos: casosActivos,
        casos_cerrados: casosCerrados,
        total_sancionados: totalSancionados,
        monto_recaudar: montoRecaudar,
        carga_porcentaje: Math.min(100, Math.round((casosActivos / (abogado.capacidad_maxima || 20)) * 100)),
      }
    })
  )

  return NextResponse.json({
    data: abogadosConCarga,
    total: abogadosConCarga.length,
  })
}
