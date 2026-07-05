import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { auth } from "@/lib/auth"
import { biLimiter } from "@/lib/rate-limit"
import { convertirSancionACOP } from "@/lib/utils"

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) { return NextResponse.json({ error: "No autorizado" }, { status: 401 }) }
  const supabase = createAdminClient()
  const rateLimitResult = await biLimiter.limit(`bi:${session.user.usuarioId}`)
  if (!rateLimitResult.success) { return NextResponse.json({ error: "Demasiadas consultas" }, { status: 429 }) }
  const { searchParams } = new URL(request.url)
  const rol = session.user.rol; const juzgadoFiltro = searchParams.get("juzgado")
  const extraerMonto = (cantidad: unknown): number => { if (!cantidad) return 0; const num = parseFloat(String(cantidad).replace(/[^0-9.]/g, "")); return isNaN(num) ? 0 : num }
  let solicitudesQuery = supabase.from("solicitudes").select("id, estado, nombre_juzgado, clase_proceso, asunto, fecha_solicitud, fecha_asignacion, etapa_preliminar, abogado_asignado_id, sancionados(cantidad_sancion, tipo_sancion, nombre_completo, numero_documento, tipo_documento)")
  if (rol === "JUZGADO") {
    if (!session.user.nombreJuzgado) { return NextResponse.json({ error: "Juzgado no asignado al usuario" }, { status: 403 }) }
    solicitudesQuery = solicitudesQuery.eq("nombre_juzgado", session.user.nombreJuzgado)
  } else if (juzgadoFiltro) { solicitudesQuery = solicitudesQuery.ilike("nombre_juzgado", `%${juzgadoFiltro}%`) }
  const { data: solicitudes, error } = await solicitudesQuery
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const rows = (solicitudes || []) as any[]
  const montoMap: Record<string, any> = {}
  for (const s of rows) { if (s.estado === "RADICADA_EN_GCC") continue; const juz = s.nombre_juzgado || "Sin asignar"; if (!montoMap[juz]) montoMap[juz] = { juzgado: juz, monto_pendiente: 0, casos: 0 }; montoMap[juz].casos++; montoMap[juz].monto_pendiente += extraerMonto(s.etapa_preliminar?.cantidad) }
  const montoPorJuzgado = Object.values(montoMap).sort((a: any, b: any) => b.monto_pendiente - a.monto_pendiente)
  const sancMap: Record<string, any> = {}; const radMap: Record<string, any> = {}
  for (const s of rows) { if (s.estado === "RADICADA_EN_GCC") continue; const juz = s.nombre_juzgado || "Sin asignar"; if (!sancMap[juz]) sancMap[juz] = { juzgado: juz, total_sancionados: 0 }; sancMap[juz].total_sancionados += (s.sancionados || []).length }
  for (const s of rows) { const juz = s.nombre_juzgado || "Sin asignar"; if (!radMap[juz]) radMap[juz] = { juzgado: juz, total_radicadas: 0, pendientes: 0, asignadas_abogado: 0 }; radMap[juz].total_radicadas++; if (s.estado !== "RADICADA_EN_GCC") { radMap[juz].pendientes++ }; if (s.abogado_asignado_id) radMap[juz].asignadas_abogado++ }
  const sancionadosPorJuzgado = Object.values(sancMap).sort((a: any, b: any) => b.total_sancionados - a.total_sancionados)
  const radicacionesPorJuzgado = Object.values(radMap).sort((a: any, b: any) => b.total_radicadas - a.total_radicadas)
  const cpm: Record<string, any> = {}; const am: Record<string, any> = {}
  for (const s of rows) { const c = s.clase_proceso || "SIN_CLASIFICAR"; const a = s.asunto || "SIN_CLASIFICAR"; const ea = s.estado !== "RADICADA_EN_GCC"; if (!cpm[c]) cpm[c] = { clase: c, total: 0, activos: 0, monto: 0 }; cpm[c].total++; if (ea) { cpm[c].activos++; cpm[c].monto += extraerMonto(s.etapa_preliminar?.cantidad) }; if (!am[a]) am[a] = { asunto: a, total: 0, activos: 0 }; am[a].total++; if (ea) am[a].activos++ }
  const distribucionConcepto = Object.values(cpm).sort((a: any, b: any) => b.total - a.total)
  const distribucionNaturaleza = Object.values(am).sort((a: any, b: any) => b.total - a.total)
  const conAsignacion = rows.filter((s: any) => s.fecha_asignacion && s.fecha_solicitud); let sd = 0; for (const s of conAsignacion) { sd += (new Date(s.fecha_asignacion).getTime() - new Date(s.fecha_solicitud).getTime()) / 86400000 }
  const ta = { promedio_dias: conAsignacion.length > 0 ? Math.round((sd / conAsignacion.length) * 10) / 10 : 0, por_mes: [] as any[], casos_sin_asignar: rows.filter((s: any) => !s.fecha_asignacion && s.estado !== "RADICADA_EN_GCC").length }
  let eficienciaPorRol: Record<string, any> | undefined
  if (rol === "ADMIN") { const { data: logsRaw } = await supabase.from("logs_auditoria").select("usuario_id, tipo_accion"); const { data: usuarios } = await supabase.from("usuarios").select("id, rol"); const rolPorUsuario: Record<string, string> = {}; for (const u of (usuarios || [])) { rolPorUsuario[u.id] = u.rol }; eficienciaPorRol = { JUZGADO: { total_acciones: 0, roles_especificos: {} }, GESTOR: { total_acciones: 0, roles_especificos: {} }, ABOGADO: { total_acciones: 0, roles_especificos: {} }, ADMIN: { total_acciones: 0, roles_especificos: {} } }; for (const log of (logsRaw || [])) { const r = rolPorUsuario[log.usuario_id] || "DESCONOCIDO"; if ((eficienciaPorRol as any)[r]) { (eficienciaPorRol as any)[r].total_acciones++; const accion = String(log.tipo_accion || "OTRO"); (eficienciaPorRol as any)[r].roles_especificos[accion] = ((eficienciaPorRol as any)[r].roles_especificos[accion] || 0) + 1 } } }
  const activas = rows.filter((s: any) => s.estado !== "RADICADA_EN_GCC"); const cerradas = rows.filter((s: any) => s.estado === "RADICADA_EN_GCC")
  const totalSancionados = rows.reduce((sum: number, s: any) => sum + (s.sancionados || []).length, 0)
  const montoTotalPendiente = activas.reduce((sum: number, s: any) => sum + extraerMonto(s.etapa_preliminar?.cantidad), 0)
  const valorTotalSancionesCOP = rows.reduce((sum: number, s: any) => { const ej = s.etapa_preliminar?.ejecutoria; return sum + (s.sancionados || []).reduce((acc: number, san: any) => acc + convertirSancionACOP(san.cantidad_sancion, san.tipo_sancion, ej), 0) }, 0)
  const valorSancionesPendienteCOP = activas.reduce((sum: number, s: any) => { const ej = s.etapa_preliminar?.ejecutoria; return sum + (s.sancionados || []).reduce((acc: number, san: any) => acc + convertirSancionACOP(san.cantidad_sancion, san.tipo_sancion, ej), 0) }, 0)
  const valorSancionesCerradoCOP = cerradas.reduce((sum: number, s: any) => { const ej = s.etapa_preliminar?.ejecutoria; return sum + (s.sancionados || []).reduce((acc: number, san: any) => acc + convertirSancionACOP(san.cantidad_sancion, san.tipo_sancion, ej), 0) }, 0)
  const solicitudesPorEstado: Record<string, number> = {}; const sancionadosPorEstado: Record<string, number> = {}
  for (const s of rows) { solicitudesPorEstado[s.estado] = (solicitudesPorEstado[s.estado] || 0) + 1; const c = (s.sancionados || []).length; if (c > 0) sancionadosPorEstado[s.estado] = (sancionadosPorEstado[s.estado] || 0) + c }
  const cerradasConFechas = cerradas.filter((s: any) => s.fecha_cierre); let sdc = 0
  for (const s of cerradasConFechas) { sdc += (new Date(s.fecha_cierre).getTime() - new Date(s.fecha_solicitud).getTime()) / 86400000 }
  const kpi = { montoTotalPendiente, totalSancionados, totalRadicaciones: rows.length, totalActivas: activas.length, totalCerradas: cerradas.length, valorTotalSancionesCOP, valorSancionesPendienteCOP, valorSancionesCerradoCOP, tiempoPromedioCierre: cerradasConFechas.length > 0 ? Math.round((sdc / cerradasConFechas.length) * 10) / 10 : 0, tasaRecaudo: valorSancionesCerradoCOP + valorSancionesPendienteCOP > 0 ? Math.round((valorSancionesCerradoCOP / (valorSancionesCerradoCOP + valorSancionesPendienteCOP)) * 1000) / 10 : 0 }
  const sancionadoMap: Record<string, any> = {}
  for (const s of rows) { const ej = s.etapa_preliminar?.ejecutoria; for (const san of (s.sancionados || [])) { const k = `${san.numero_documento || "x"}_${(san.nombre_completo || "").trim()}`; if (!sancionadoMap[k]) sancionadoMap[k] = { nombre: san.nombre_completo || "Sin nombre", documento: san.numero_documento || "", tipoDoc: san.tipo_documento || "CC", montoCOP: 0, solicitudes: 0 }; sancionadoMap[k].montoCOP += convertirSancionACOP(san.cantidad_sancion, san.tipo_sancion, ej); sancionadoMap[k].solicitudes++ } }
  const topSancionados = Object.values(sancionadoMap).sort((a: any, b: any) => b.montoCOP - a.montoCOP).slice(0, 10)
  return NextResponse.json({ montoPorJuzgado, sancionadosPorJuzgado, radicacionesPorJuzgado, distribucionConcepto, distribucionNaturaleza, tiempoPromedioAsignacion: ta, eficienciaPorRol, kpi, solicitudesPorEstado, sancionadosPorEstado, topSancionados })
}