import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { auth } from "@/lib/auth"

export async function GET() {
  const session = await auth()
  if (!session?.user || session.user.rol !== "ADMIN") {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
  }

  const supabase = createAdminClient()

  // Conteos
  const { count: totalUsuarios } = await supabase.from("usuarios").select("*", { count: "exact", head: true })
  const { count: totalJuzgados } = await supabase.from("usuarios").select("*", { count: "exact", head: true }).eq("rol", "JUZGADO")
  const { count: totalGestores } = await supabase.from("usuarios").select("*", { count: "exact", head: true }).eq("rol", "GESTOR")
  const { count: totalAbogados } = await supabase.from("usuarios").select("*", { count: "exact", head: true }).eq("rol", "ABOGADO")
  const { count: totalAdmins } = await supabase.from("usuarios").select("*", { count: "exact", head: true }).eq("rol", "ADMIN")
  const { count: usuariosActivos } = await supabase.from("usuarios").select("*", { count: "exact", head: true }).eq("activo", true)
  const { count: totalSolicitudes } = await supabase.from("solicitudes").select("*", { count: "exact", head: true })
  const { count: solicitudesActivas } = await supabase.from("solicitudes").select("*", { count: "exact", head: true }).not("estado", "in", '("RADICADA_EN_GCC")')
  const { count: totalDespachos } = await supabase.from("despachos").select("*", { count: "exact", head: true })

  // O365 vinculados
  const { count: o365Vinculados } = await supabase
    .from("usuarios").select("*", { count: "exact", head: true })
    .not("azure_oid", "is", null)

  // Ciudades: obtener valores con conteo (agrupación manual, Supabase JS v2 no soporta GROUP BY)
  const { data: ciudadesRaw } = await supabase
    .from("usuarios")
    .select("ciudad")
    .not("ciudad", "is", null)
    .neq("ciudad", "")

  const ciudadCounts: Record<string, number> = {}
  for (const row of (ciudadesRaw || [])) {
    const c = row.ciudad as string
    if (c) ciudadCounts[c] = (ciudadCounts[c] || 0) + 1
  }
  const topCiudades = Object.entries(ciudadCounts)
    .map(([ciudad, total]) => ({ ciudad, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8)
  const ciudadesUnicas = Object.keys(ciudadCounts).length

  // Especialidades: mismo patrón
  const { data: especialidadesRaw } = await supabase
    .from("usuarios")
    .select("especialidad_area")
    .not("especialidad_area", "is", null)
    .neq("especialidad_area", "")

  const espCounts: Record<string, number> = {}
  for (const row of (especialidadesRaw || [])) {
    const e = row.especialidad_area as string
    if (e) espCounts[e] = (espCounts[e] || 0) + 1
  }
  const topEspecialidades = Object.entries(espCounts)
    .map(([especialidad, total]) => ({ especialidad, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8)
  const especialidadesUnicas = Object.keys(espCounts).length

  return NextResponse.json({
    usuarios: {
      total: totalUsuarios || 0,
      activos: usuariosActivos || 0,
      porRol: {
        JUZGADO: totalJuzgados || 0,
        GESTOR: totalGestores || 0,
        ABOGADO: totalAbogados || 0,
        ADMIN: totalAdmins || 0,
      },
      o365Vinculados: o365Vinculados || 0,
      ciudades: ciudadesUnicas,
      topCiudades,
      especialidades: especialidadesUnicas,
      topEspecialidades,
    },
    solicitudes: {
      total: totalSolicitudes || 0,
      activas: solicitudesActivas || 0,
    },
    despachos: {
      total: totalDespachos || 0,
    },
  })
}
