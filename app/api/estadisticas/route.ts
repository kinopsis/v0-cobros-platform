import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { auth } from "@/lib/auth"

export async function GET(_request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Obtener estadisticas generales
  const { count: totalActivos } = await supabase
    .from("solicitudes")
    .select("*", { count: "exact", head: true })
    .not("estado", "in", '("RADICADA_EN_GCC")')

  const { count: radicadosHoy } = await supabase
    .from("solicitudes")
    .select("*", { count: "exact", head: true })
    .gte("fecha_solicitud", new Date().toISOString().split("T")[0])

  const { count: cerradosEnPeriodo } = await supabase
    .from("solicitudes")
    .select("*", { count: "exact", head: true })
    .eq("estado", "RADICADA_EN_GCC")
    .gte("fecha_cierre", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

  const { count: pendientesValidar } = await supabase
    .from("solicitudes")
    .select("*", { count: "exact", head: true })
    .eq("estado", "EN_VALIDACION")

  // Distribucion por clase de proceso
  const { data: distribucion } = await supabase
    .from("solicitudes")
    .select("clase_proceso, estado")
    .not("estado", "in", '("RADICADA_EN_GCC")')

  const distribucionMap: Record<string, { cantidad: number; activos: number }> = {}
  distribucion?.forEach((s) => {
    if (!distribucionMap[s.clase_proceso]) {
      distribucionMap[s.clase_proceso] = { cantidad: 0, activos: 0 }
    }
    distribucionMap[s.clase_proceso].cantidad++
    distribucionMap[s.clase_proceso].activos++
  })

  const total = Object.values(distribucionMap).reduce((sum, d) => sum + d.cantidad, 0)
  const distribucionArray = Object.entries(distribucionMap).map(([clase, data]) => ({
    claseProceso: clase,
    cantidad: data.cantidad,
    porcentaje: total > 0 ? Math.round((data.cantidad / total) * 100) : 0,
    activos: data.activos,
    cerrados: 0,
  }))

  // Productividad de abogados
  const { data: abogados } = await supabase
    .from("usuarios")
    .select("*")
    .eq("rol", "ABOGADO")
    .eq("activo", true)

  const productividad = await Promise.all(
    (abogados || []).map(async (abogado) => {
      const { count: casosAsignados } = await supabase
        .from("solicitudes")
        .select("*", { count: "exact", head: true })
        .eq("abogado_asignado_id", abogado.id)

      const { count: casosCerrados } = await supabase
        .from("solicitudes")
        .select("*", { count: "exact", head: true })
        .eq("abogado_asignado_id", abogado.id)
        .eq("estado", "RADICADA_EN_GCC")

      return {
        abogadoId: abogado.id,
        nombre: abogado.nombre,
        especialidades: abogado.especialidades || [],
        casosAsignados: casosAsignados || 0,
        casosEnProceso: (casosAsignados || 0) - (casosCerrados || 0),
        casosCerrados: casosCerrados || 0,
        diasPromedio: 0,
        cargaPorcentaje: Math.min(100, Math.round(((casosAsignados || 0) / (abogado.capacidad_maxima || 20)) * 100)),
      }
    })
  )

  return NextResponse.json({
    totalProcesosActivos: totalActivos || 0,
    radicadosHoy: radicadosHoy || 0,
    cerradosEnPeriodo: cerradosEnPeriodo || 0,
    pendientesValidar: pendientesValidar || 0,
    alertasInactividad: 0,
    tasaDevolucion: 0,
    distribucion: distribucionArray,
    productividad,
  })
}
