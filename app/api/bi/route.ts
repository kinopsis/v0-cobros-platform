import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { auth } from "@/lib/auth"
import { biLimiter } from "@/lib/rate-limit"
import { convertirSancionACOP } from "@/lib/utils"

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const supabase = createAdminClient()  // SERVICE_ROLE_KEY — autorización en capa de aplicación

  // Rate limiting: máximo 10 requests por minuto por usuario
  const rateLimitResult = await biLimiter.limit(`bi:${session.user.usuarioId}`)
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Demasiadas consultas. Intente de nuevo en un minuto." },
      { status: 429 }
    )
  }

  const { searchParams } = new URL(request.url)
  const rol = session.user.rol
  const juzgadoFiltro = searchParams.get("juzgado")

  // Helper: extraer monto numérico de etapa_preliminar.cantidad
  const extraerMonto = (cantidad: unknown): number => {
    if (!cantidad) return 0
    const num = parseFloat(String(cantidad).replace(/[^0-9.]/g, ""))
    return isNaN(num) ? 0 : num
  }

  // ── Query base: todas las solicitudes ──
  let solicitudesQuery = supabase.from("solicitudes").select(
    "id, estado, nombre_juzgado, clase_proceso, asunto, fecha_solicitud, fecha_asignacion, etapa_preliminar, abogado_asignado_id, sancionados(cantidad_sancion, tipo_sancion)"
  )

  // Filtrar por juzgado si el rol es JUZGADO
  if (rol === "JUZGADO") {
    solicitudesQuery = solicitudesQuery.eq("nombre_juzgado", session.user.nombreJuzgado || juzgadoFiltro || "")
  } else if (juzgadoFiltro) {
    solicitudesQuery = solicitudesQuery.ilike("nombre_juzgado", `%${juzgadoFiltro}%`)
  }

  const { data: solicitudes, error } = await solicitudesQuery

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const rows = (solicitudes || []) as any[]

  // ── Indicador 1: Monto pendiente por juzgado ──
  const montoMap: Record<string, { juzgado: string; monto_pendiente: number; casos: number }> = {}
  for (const s of rows) {
    if (s.estado === "RADICADA_EN_GCC") continue
    const juz = s.nombre_juzgado || "Sin asignar"
    if (!montoMap[juz]) montoMap[juz] = { juzgado: juz, monto_pendiente: 0, casos: 0 }
    montoMap[juz].casos++
    montoMap[juz].monto_pendiente += extraerMonto(s.etapa_preliminar?.cantidad)
  }
  const montoPorJuzgado = Object.values(montoMap).sort((a, b) => b.monto_pendiente - a.monto_pendiente)

  // ── Indicador 2: Sancionados por juzgado ──
  const sancMap: Record<string, { juzgado: string; total_sancionados: number }> = {}
  for (const s of rows) {
    if (s.estado === "RADICADA_EN_GCC") continue
    const juz = s.nombre_juzgado || "Sin asignar"
    if (!sancMap[juz]) sancMap[juz] = { juzgado: juz, total_sancionados: 0 }
    sancMap[juz].total_sancionados += (s.sancionados || []).length
  }
  const sancionadosPorJuzgado = Object.values(sancMap).sort((a, b) => b.total_sancionados - a.total_sancionados)

  // ── Indicador 3: Radicaciones por juzgado ──
  const radMap: Record<string, { juzgado: string; total_radicadas: number; pendientes: number; asignadas_abogado: number }> = {}
  for (const s of rows) {
    const juz = s.nombre_juzgado || "Sin asignar"
    if (!radMap[juz]) radMap[juz] = { juzgado: juz, total_radicadas: 0, pendientes: 0, asignadas_abogado: 0 }
    radMap[juz].total_radicadas++
    // Pendientes: total de solicitudes realizadas por el juzgado
    radMap[juz].pendientes++
    // Asignadas a abogado: las que ya tienen abogado_asignado_id
    if (s.abogado_asignado_id) {
      radMap[juz].asignadas_abogado++
    }
  }
  const radicacionesPorJuzgado = Object.values(radMap).sort((a, b) => b.total_radicadas - a.total_radicadas)

  // ── Indicador 4: Análisis por clase_proceso y asunto ──
  const claseProcesoMap: Record<string, { clase: string; total: number; activos: number; monto: number }> = {}
  const asuntoMap: Record<string, { asunto: string; total: number; activos: number }> = {}
  for (const s of rows) {
    const clase = s.clase_proceso || "SIN_CLASIFICAR"
    const asunto = s.asunto || "SIN_CLASIFICAR"
    const esActivo = s.estado !== "RADICADA_EN_GCC"

    if (!claseProcesoMap[clase]) claseProcesoMap[clase] = { clase, total: 0, activos: 0, monto: 0 }
    claseProcesoMap[clase].total++
    if (esActivo) {
      claseProcesoMap[clase].activos++
      claseProcesoMap[clase].monto += extraerMonto(s.etapa_preliminar?.cantidad)
    }

    if (!asuntoMap[asunto]) asuntoMap[asunto] = { asunto, total: 0, activos: 0 }
    asuntoMap[asunto].total++
    if (esActivo) asuntoMap[asunto].activos++
  }
  const distribucionConcepto = Object.values(claseProcesoMap).sort((a, b) => b.total - a.total)
  const distribucionNaturaleza = Object.values(asuntoMap).sort((a, b) => b.total - a.total)

  // ── Indicador 5: Tiempo promedio radicado → asignación abogado ──
  const conAsignacion = rows.filter((s) => s.fecha_asignacion && s.fecha_solicitud)
  let sumaDias = 0
  const porMes: Record<string, { total: number; count: number }> = {}
  for (const s of conAsignacion) {
    const diff = (new Date(s.fecha_asignacion).getTime() - new Date(s.fecha_solicitud).getTime()) / (1000 * 60 * 60 * 24)
    sumaDias += diff
    const mes = s.fecha_solicitud?.substring(0, 7) || "unknown"
    if (!porMes[mes]) porMes[mes] = { total: 0, count: 0 }
    porMes[mes].total += diff
    porMes[mes].count++
  }
  const casosSinAsignar = rows.filter((s) => !s.fecha_asignacion && s.estado !== "RADICADA_EN_GCC").length
  const tiempoPromedioAsignacion = {
    promedio_dias: conAsignacion.length > 0 ? Math.round((sumaDias / conAsignacion.length) * 10) / 10 : 0,
    por_mes: Object.entries(porMes).map(([mes, v]) => ({
      mes,
      promedio: Math.round((v.total / v.count) * 10) / 10,
    })).sort((a, b) => a.mes.localeCompare(b.mes)),
    casos_sin_asignar: casosSinAsignar,
  }

  // ── Indicador 6: Eficiencia por rol ──
  const { data: logsRaw } = await supabase
    .from("logs_auditoria")
    .select("usuario_id, tipo_accion")

  const { data: usuarios } = await supabase
    .from("usuarios")
    .select("id, rol")

  const rolPorUsuario: Record<string, string> = {}
  for (const u of (usuarios || [])) {
    rolPorUsuario[u.id] = u.rol
  }

  const eficienciaPorRol: Record<string, any> = {
    JUZGADO: { total_acciones: 0, roles_especificos: {} as Record<string, number> },
    GESTOR: { total_acciones: 0, roles_especificos: {} as Record<string, number> },
    ABOGADO: { total_acciones: 0, roles_especificos: {} as Record<string, number> },
    ADMIN: { total_acciones: 0, roles_especificos: {} as Record<string, number> },
  }

  for (const log of (logsRaw || [])) {
    const r = rolPorUsuario[log.usuario_id] || "DESCONOCIDO"
    if (eficienciaPorRol[r]) {
      eficienciaPorRol[r].total_acciones++
      const accion = String(log.tipo_accion || "OTRO")
      eficienciaPorRol[r].roles_especificos[accion] = (eficienciaPorRol[r].roles_especificos[accion] || 0) + 1
    }
  }

  // ── KPIs globales ──
  const activas = rows.filter((s) => s.estado !== "RADICADA_EN_GCC")
  const cerradas = rows.filter((s) => s.estado === "RADICADA_EN_GCC")
  const totalSancionados = rows.reduce((sum, s) => sum + (s.sancionados || []).length, 0)
  const montoTotalPendiente = activas.reduce((sum, s) => sum + extraerMonto(s.etapa_preliminar?.cantidad), 0)
  const montoTotalCerrado = cerradas.reduce((sum, s) => sum + extraerMonto(s.etapa_preliminar?.cantidad), 0)

  // ── Valor total de sanciones convertido a COP (SMMLV → COP) ──
  const valorTotalSancionesCOP = rows.reduce((sum, s) => {
    const ejecutoria = s.etapa_preliminar?.ejecutoria
    return sum + (s.sancionados || []).reduce((acc: number, san: any) =>
      acc + convertirSancionACOP(san.cantidad_sancion, san.tipo_sancion, ejecutoria), 0
    )
  }, 0)

  const valorSancionesPendienteCOP = activas.reduce((sum, s) => {
    const ejecutoria = s.etapa_preliminar?.ejecutoria
    return sum + (s.sancionados || []).reduce((acc: number, san: any) =>
      acc + convertirSancionACOP(san.cantidad_sancion, san.tipo_sancion, ejecutoria), 0
    )
  }, 0)

  const valorSancionesCerradoCOP = cerradas.reduce((sum, s) => {
    const ejecutoria = s.etapa_preliminar?.ejecutoria
    return sum + (s.sancionados || []).reduce((acc: number, san: any) =>
      acc + convertirSancionACOP(san.cantidad_sancion, san.tipo_sancion, ejecutoria), 0
    )
  }, 0)

  // ── Solicitudes y sancionados por estado ──
  const solicitudesPorEstado: Record<string, number> = {}
  const sancionadosPorEstado: Record<string, number> = {}
  for (const s of rows) {
    solicitudesPorEstado[s.estado] = (solicitudesPorEstado[s.estado] || 0) + 1
    const count = (s.sancionados || []).length
    if (count > 0) {
      sancionadosPorEstado[s.estado] = (sancionadosPorEstado[s.estado] || 0) + count
    }
  }

  // Tiempo promedio de cierre
  const cerradasConFechas = cerradas.filter((s: any) => s.fecha_solicitud)
  let sumaDiasCierre = 0
  for (const s of cerradasConFechas) {
    const diff = (new Date().getTime() - new Date(s.fecha_solicitud).getTime()) / (1000 * 60 * 60 * 24)
    sumaDiasCierre += diff
  }

  const kpi = {
    montoTotalPendiente,
    totalSancionados,
    totalRadicaciones: rows.length,
    totalActivas: activas.length,
    totalCerradas: cerradas.length,
    valorTotalSancionesCOP,
    valorSancionesPendienteCOP,
    valorSancionesCerradoCOP,
    tiempoPromedioCierre: cerradasConFechas.length > 0
      ? Math.round((sumaDiasCierre / cerradasConFechas.length) * 10) / 10
      : 0,
    tasaRecaudo: montoTotalCerrado + montoTotalPendiente > 0
      ? Math.round((montoTotalCerrado / (montoTotalCerrado + montoTotalPendiente)) * 1000) / 10
      : 0,
  }

  return NextResponse.json({
    montoPorJuzgado,
    sancionadosPorJuzgado,
    radicacionesPorJuzgado,
    distribucionConcepto,
    distribucionNaturaleza,
    tiempoPromedioAsignacion,
    eficienciaPorRol,
    kpi,
    solicitudesPorEstado,
    sancionadosPorEstado,
  })
}
