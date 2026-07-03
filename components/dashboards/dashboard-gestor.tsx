"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { FileText, Clock, ArrowRight, Users, TrendingUp, Calendar, DollarSign, Loader2, Undo2 } from "lucide-react"
import { ESTADO_LABELS, ESTADO_COLORS, CLASE_PROCESO_LABELS, PRIORIDAD_COLORS, PRIORIDAD_LABELS } from "@/lib/types"
import { format } from "date-fns"; import { es } from "date-fns/locale"
import { useDashboardData } from "./use-dashboard-data"
import { formatCOP } from "@/lib/utils"

const formatMonto = (m: number): string => { if (m >= 1_000_000) return `$${(m / 1_000_000).toFixed(1)}M`; if (m >= 1_000) return `$${(m / 1_000).toFixed(0)}K`; return `$${m.toLocaleString("es-CO")}` }

export function DashboardGestor() {
  const { data: biData, loading: biLoading } = useDashboardData()
  const [solicitudes, setSolicitudes] = useState<any[]>([])
  const [abogados, setAbogados] = useState<any[]>([])
  const [loadingExtra, setLoadingExtra] = useState(true)
  useEffect(() => { Promise.all([fetch("/api/solicitudes?limit=5").then(r => r.json()), fetch("/api/abogados").then(r => r.json())]).then(([sol, abo]) => { setSolicitudes((sol.data || []).filter((s: any) => s.estado === "EN_VALIDACION")); setAbogados(abo.data || []) }).finally(() => setLoadingExtra(false)) }, [])
  if (biLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
  const kpi = (biData?.kpi || {}) as any; const spe = (biData?.solicitudesPorEstado || {}) as Record<string, number>
  const kpisPrincipales = [
    { title: "Sancionados", value: kpi.totalSancionados || 0, icon: Users, description: "Personas en procesos", color: "text-amber-600", bg: "bg-amber-50" },
    { title: "Solicitudes", value: kpi.totalRadicaciones || 0, icon: FileText, description: `${kpi.totalActivas || 0} activas - ${kpi.totalCerradas || 0} cerradas`, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Valor Total", value: formatCOP(kpi.valorTotalSancionesCOP || 0), icon: DollarSign, description: "Suma convertida a COP", color: "text-green-600", bg: "bg-green-50" }
  ]
  const ev = spe["EN_VALIDACION"] || 0; const rs = spe["RADICADA_EN_SIGOBIUS"] || 0; const dev = (spe["DEVUELTA_POR_GESTOR"] || 0) + (spe["DEVUELTA_POR_ABOGADO"] || 0)
  const kps = [
    { title: "Pendientes", value: ev, icon: Clock, description: "Requieren revision", color: "text-yellow-600" },
    { title: "Radicadas", value: rs, icon: FileText, description: "Sin asignar", color: "text-emerald-600" },
    { title: "Devueltas", value: dev, icon: Undo2, description: "Requieren correccion", color: "text-red-600" },
    { title: "Tasa Recaudo", value: `${kpi.tasaRecaudo || 0}%`, icon: TrendingUp, description: "Cerrado vs total", color: "text-violet-600" }
  ]
  const oe = ["EN_VALIDACION","RADICADA_EN_SIGOBIUS","ASIGNADA_A_ABOGADO","DEVUELTA_POR_GESTOR","DEVUELTA_POR_ABOGADO","RADICADA_EN_GCC"] as const
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><h1 className="text-2xl font-bold">Panel de Gestion</h1><p className="text-muted-foreground">Gestion de solicitudes de cobro coactivo</p></div><div className="flex gap-2"><Button variant="outline" asChild><Link href="/gestion"><FileText className="mr-2 h-4 w-4" />Bandeja</Link></Button></div></div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">{kpisPrincipales.map(s => (<Card key={s.title} className={s.bg}><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{s.title}</CardTitle><s.icon className={`h-5 w-5 ${s.color}`} /></CardHeader><CardContent><span className="text-lg sm:text-2xl font-bold break-words">{s.value}</span><p className="text-xs text-muted-foreground mt-1">{s.description}</p></CardContent></Card>))}</div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{kps.map(s => (<Card key={s.title}><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{s.title}</CardTitle><s.icon className={`h-4 w-4 ${s.color}`} /></CardHeader><CardContent><div className="text-base sm:text-xl font-bold break-words">{s.value}</div><p className="text-xs text-muted-foreground">{s.description}</p></CardContent></Card>))}</div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-yellow-600" />Pendientes de Validacion</CardTitle><CardDescription>Solicitudes que requieren revision</CardDescription></CardHeader><CardContent><div className="space-y-4">{solicitudes.length === 0 ? <p className="text-center py-8">No hay pendientes</p> : solicitudes.slice(0, 4).map((sol: any) => (<div key={sol.id} className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50"><div className="flex-1 space-y-1"><div className="flex items-center gap-2"><p className="font-medium text-sm">{sol.id}</p><Badge variant="secondary" className={(PRIORIDAD_COLORS as Record<string, string>)[sol.prioridad || "MEDIA"]}>{(PRIORIDAD_LABELS as Record<string, string>)[sol.prioridad || "MEDIA"]}</Badge></div><p className="text-xs text-muted-foreground">{(CLASE_PROCESO_LABELS as Record<string, string>)[sol.clase_proceso || ""] || "Sin clasificar"} - {sol.nombre_juzgado || ""}</p><div className="flex items-center gap-2 text-xs text-muted-foreground"><Calendar className="h-3 w-3" />{sol.fecha_solicitud ? format(new Date(sol.fecha_solicitud), "d MMM yyyy", { locale: es }) : "Sin fecha"}<span className="text-yellow-600 font-medium">SLA: {sol.dias_sla || 10}d</span></div></div><Button variant="outline" size="sm" asChild><Link href={`/gestion/${sol.id}`}>Revisar</Link></Button></div>))}</div></CardContent></Card>
        <div className="space-y-6">
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Carga de Abogados</CardTitle></CardHeader><CardContent><div className="space-y-4">{abogados.length === 0 ? <p className="text-center py-4">Sin abogados</p> : abogados.slice(0, 4).map((a: any) => (<div key={a.id} className="space-y-2"><div className="flex items-center justify-between"><div><p className="font-medium text-sm">{a.nombre}</p><p className="text-xs text-muted-foreground">{a.casos_asignados || 0} casos</p></div><span className="text-sm font-medium">{a.carga_porcentaje || 0}%</span></div><Progress value={a.carga_porcentaje || 0} className="h-2" /></div>))}</div></CardContent></Card>
          <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Solicitudes por Estado</CardTitle></CardHeader><CardContent><div className="space-y-2">{oe.map(estado => { const c = spe[estado] || 0; const l = (ESTADO_LABELS as Record<string, string>)[estado] || estado; const cl = (ESTADO_COLORS as Record<string, string>)[estado] || ""; return <div key={estado} className="flex items-center justify-between text-sm"><Badge variant="secondary" className={`text-xs ${cl}`}>{l}</Badge><span className="font-bold">{c}</span></div> })}</div></CardContent></Card>
        </div>
      </div>
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-amber-600" />Top 10 Sancionados por Monto</CardTitle><CardDescription>Mayor valor acumulado en COP</CardDescription></CardHeader><CardContent><div className="space-y-3">{(biData?.topSancionados || []).length === 0 ? <p className="text-center py-4">Sin datos</p> : (biData?.topSancionados || []).map((san, i) => (<div key={san.documento || i} className="flex items-center justify-between rounded-lg border p-3"><div className="flex items-center gap-3 min-w-0"><Badge variant="secondary" className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs">{i + 1}</Badge><div className="min-w-0"><p className="font-medium text-sm truncate max-w-[200px]">{san.nombre}</p><p className="text-xs text-muted-foreground">{san.tipoDoc === "CC" ? "CC" : san.tipoDoc} {san.documento} - {san.solicitudes} sol.</p></div></div><span className="font-bold text-green-700 text-sm shrink-0 ml-2">{formatCOP(san.montoCOP)}</span></div>))}</div></CardContent></Card>
    </div>
  )
}
