import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { auth } from "@/lib/auth"
import { biLimiter } from "@/lib/rate-limit"
import { convertirSancionACOP } from "@/lib/utils"

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const supabase = createAdminClient()
  const rl = await biLimiter.limit(`bi:${session.user.usuarioId}`)
  if (!rl.success) return NextResponse.json({ error: "Demasiadas consultas" }, { status: 429 })
  const { searchParams } = new URL(request.url)
  const rol = session.user.rol; const juzgadoFiltro = searchParams.get("juzgado")
  const extraerMonto = (c: unknown): number => { if (!c) return 0; const n = parseFloat(String(c).replace(/[^0-9.]/g, "")); return isNaN(n) ? 0 : n }
  let sq = supabase.from("solicitudes").select("id, estado, nombre_juzgado, clase_proceso, asunto, fecha_solicitud, fecha_asignacion, etapa_preliminar, abogado_asignado_id, sancionados(cantidad_sancion, tipo_sancion)")
  if (rol === "JUZGADO") sq = sq.eq("nombre_juzgado", session.user.nombreJuzgado || juzgadoFiltro || "")
  else if (juzgadoFiltro) sq = sq.ilike("nombre_juzgado", `%${juzgadoFiltro}%`)
  const { data: solicitudes, error } = await sq
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const rows = (solicitudes || []) as any[]
  const mm: Record<string, any> = {}; const sm: Record<string, any> = {}; const rm: Record<string, any> = {}
  for (const s of rows) { if (s.estado === "RADICADA_EN_GCC") continue; const j = s.nombre_juzgado || "Sin asignar"; if (!mm[j]) mm[j] = { juzgado: j, monto_pendiente: 0, casos: 0 }; mm[j].casos++; mm[j].monto_pendiente += extraerMonto(s.etapa_preliminar?.cantidad); if (!sm[j]) sm[j] = { juzgado: j, total_sancionados: 0 }; sm[j].total_sancionados += (s.sancionados || []).length; if (!rm[j]) rm[j] = { juzgado: j, total_radicadas: 0, pendientes: 0, asignadas_abogado: 0 }; rm[j].total_radicadas++; rm[j].pendientes++; if (s.abogado_asignado_id) rm[j].asignadas_abogado++ }
  const montoPorJuzgado = Object.values(mm).sort((a: any, b: any) => b.monto_pendiente - a.monto_pendiente)
  const sancionadosPorJuzgado = Object.values(sm).sort((a: any, b: any) => b.total_sancionados - a.total_sancionados)
  const radicacionesPorJuzgado = Object.values(rm).sort((a: any, b: any) => b.total_radicadas - a.total_radicadas)
  const cpm: Record<string, any> = {}; const am: Record<string, any> = {}
  for (const s of rows) { const c = s.clase_proceso || "SIN_CLASIFICAR"; const a = s.asunto || "SIN_CLASIFICAR"; const ea = s.estado !== "RADICADA_EN_GCC"; if (!cpm[c]) cpm[c] = { clase: c, total: 0, activos: 0, monto: 0 }; cpm[c].total++; if (ea) { cpm[c].activos++; cpm[c].monto += extraerMonto(s.etapa_preliminar?.cantidad) }; if (!am[a]) am[a] = { asunto: a, total: 0, activos: 0 }; am[a].total++; if (ea) am[a].activos++ }
  const dc = Object.values(cpm).sort((a: any, b: any) => b.total - a.total); const dn = Object.values(am).sort((a: any, b: any) => b.total - a.total)
  const ca = rows.filter((s: any) => s.fecha_asignacion && s.fecha_solicitud); let sd = 0
  for (const s of ca) sd += (new Date(s.fecha_asignacion).getTime() - new Date(s.fecha_solicitud).getTime()) / 86400000
  const ta = { promedio_dias: ca.length > 0 ? Math.round((sd / ca.length) * 10) / 10 : 0, por_mes: [] as any[], casos_sin_asignar: rows.filter((s: any) => !s.fecha_asignacion && s.estado !== "RADICADA_EN_GCC").length }
  const se: Record<string, number> = {}; const spe: Record<string, number> = {}
  for (const s of rows) { se[s.estado] = (se[s.estado] || 0) + 1; const c = (s.sancionados || []).length; if (c > 0) spe[s.estado] = (spe[s.estado] || 0) + c }
  const activas = rows.filter((s: any) => s.estado !== "RADICADA_EN_GCC"); const cerradas = rows.filter((s: any) => s.estado === "RADICADA_EN_GCC")
  const ts = rows.reduce((sum: number, s: any) => sum + (s.sancionados || []).length, 0)
  const mtp = activas.reduce((sum: number, s: any) => sum + extraerMonto(s.etapa_preliminar?.cantidad), 0)
  const mtc = cerradas.reduce((sum: number, s: any) => sum + extraerMonto(s.etapa_preliminar?.cantidad), 0)
  const vts = rows.reduce((sum: number, s: any) => sum + (s.sancionados || []).reduce((a: number, san: any) => a + convertirSancionACOP(san.cantidad_sancion, san.tipo_sancion, s.etapa_preliminar?.ejecutoria), 0), 0)
  const vsp = activas.reduce((sum: number, s: any) => sum + (s.sancionados || []).reduce((a: number, san: any) => a + convertirSancionACOP(san.cantidad_sancion, san.tipo_sancion, s.etapa_preliminar?.ejecutoria), 0), 0)
  const vsc = cerradas.reduce((sum: number, s: any) => sum + (s.sancionados || []).reduce((a: number, san: any) => a + convertirSancionACOP(san.cantidad_sancion, san.tipo_sancion, s.etapa_preliminar?.ejecutoria), 0), 0)
  const ccf = cerradas.filter((s: any) => s.fecha_solicitud); let sdc = 0
  for (const s of ccf) sdc += (Date.now() - new Date(s.fecha_solicitud).getTime()) / 86400000
  const kpi = { montoTotalPendiente: mtp, totalSancionados: ts, totalRadicaciones: rows.length, totalActivas: activas.length, totalCerradas: cerradas.length, valorTotalSancionesCOP: vts, valorSancionesPendienteCOP: vsp, valorSancionesCerradoCOP: vsc, tiempoPromedioCierre: ccf.length > 0 ? Math.round((sdc / ccf.length) * 10) / 10 : 0, tasaRecaudo: mtc + mtp > 0 ? Math.round((mtc / (mtc + mtp)) * 1000) / 10 : 0 }
  const sanMap: Record<string, any> = {}
  for (const s of rows) { const ej = s.etapa_preliminar?.ejecutoria; for (const san of (s.sancionados || [])) { const k = `${san.numero_documento || "x"}_${(san.nombre_completo || "").trim()}`; if (!sanMap[k]) sanMap[k] = { nombre: san.nombre_completo || "Sin nombre", documento: san.numero_documento || "", tipoDoc: san.tipo_documento || "CC", montoCOP: 0, solicitudes: 0 }; sanMap[k].montoCOP += convertirSancionACOP(san.cantidad_sancion, san.tipo_sancion, ej); sanMap[k].solicitudes++ } }
  const topSancionados = Object.values(sanMap).sort((a: any, b: any) => b.montoCOP - a.montoCOP).slice(0, 10)
  return NextResponse.json({ montoPorJuzgado, sancionadosPorJuzgado, radicacionesPorJuzgado, distribucionConcepto: dc, distribucionNaturaleza: dn, tiempoPromedioAsignacion: ta, eficienciaPorRol: {}, kpi, solicitudesPorEstado: se, sancionadosPorEstado: spe, topSancionados })
}
