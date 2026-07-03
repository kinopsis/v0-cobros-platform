"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { FileText, CheckCircle2, ArrowRight, Users, TrendingUp, BarChart3, Download, DollarSign, Loader2, Clock } from "lucide-react"
import { ESTADO_LABELS, ESTADO_COLORS } from "@/lib/types"
import { useDashboardData } from "./use-dashboard-data"
import { formatCOP } from "@/lib/utils"

const formatMonto = (monto: number): string => {
  if (monto >= 1_000_000) return `$${(monto / 1_000_000).toFixed(1)}M`
  if (monto >= 1_000) return `$${(monto / 1_000).toFixed(0)}K`
  return `$${monto.toLocaleString("es-CO")}`
}

export function DashboardAdmin() {
  const { data, loading } = useDashboardData()
  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  const kpi = (data?.kpi || {}) as any
  const topJuzgados = (data?.montoPorJuzgado || []).slice(0, 8)
  const maxMonto = topJuzgados[0]?.monto_pendiente || 1
  const solicitudesPorEstado = (data?.solicitudesPorEstado || {}) as Record<string, number>
  const kpisPrincipales = [
    { title: "Sancionados", value: kpi.totalSancionados || 0, icon: Users, description: "Personas en procesos activos", color: "text-amber-600", bg: "bg-amber-50" },
    { title: "Solicitudes", value: kpi.totalRadicaciones || 0, icon: FileText, description: `${kpi.totalActivas || 0} activas - ${kpi.totalCerradas || 0} cerradas`, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Valor Total Sanciones", value: formatCOP(kpi.valorTotalSancionesCOP || 0), icon: DollarSign, description: "Suma convertida a COP", color: "text-green-600", bg: "bg-green-50" }
  ]
  const kpisSecundarios = [
    { title: "Monto Pendiente", value: formatMonto(kpi.montoTotalPendiente || 0), icon: DollarSign, description: "Total a recaudar", color: "text-emerald-600" },
    { title: "Solicitudes Activas", value: kpi.totalActivas || 0, icon: FileText, description: "Estados intermedios", color: "text-indigo-600" },
    { title: "Tasa Recaudo", value: `${kpi.tasaRecaudo || 0}%`, icon: TrendingUp, description: "Cerrado vs total", color: "text-violet-600" },
    { title: "Tiempo", value: `${kpi.tiempoPromedioCierre || 0}d`, icon: Clock, description: "Promedio a cierre", color: "text-cyan-600" }
  ]
  const ordenEstados = ["EN_VALIDACION","RADICADA_EN_SIGOBIUS","ASIGNADA_A_ABOGADO","DEVUELTA_POR_GESTOR","DEVUELTA_POR_ABOGADO","RADICADA_EN_GCC"] as const
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><h1 className="text-2xl font-bold">Dashboard Ejecutivo</h1><p className="text-muted-foreground">Metricas de Cobro Coactivo</p></div><div className="flex gap-2"><Button variant="outline"><Download className="mr-2 h-4 w-4" />Exportar</Button><Button asChild><Link href="/reportes"><BarChart3 className="mr-2 h-4 w-4" />Reportes</Link></Button></div></div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">{kpisPrincipales.map(s => (<Card key={s.title} className={s.bg}><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{s.title}</CardTitle><s.icon className={`h-5 w-5 ${s.color}`} /></CardHeader><CardContent><span className="text-lg sm:text-2xl font-bold break-words">{s.value}</span><p className="text-xs text-muted-foreground mt-1">{s.description}</p></CardContent></Card>))}</div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{kpisSecundarios.map(s => (<Card key={s.title}><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{s.title}</CardTitle><s.icon className={`h-4 w-4 ${s.color}`} /></CardHeader><CardContent><span className="text-base sm:text-xl font-bold break-words">{s.value}</span><p className="text-xs text-muted-foreground">{s.description}</p></CardContent></Card>))}</div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2"><CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5 text-green-600" />Top Juzgados</CardTitle><CardDescription>Mayor valor a recaudar</CardDescription></CardHeader><CardContent><div className="space-y-4">{topJuzgados.length === 0 ? <p className="text-center py-4">Sin datos</p> : topJuzgados.map((j: any) => (<div key={j.juzgado} className="space-y-1"><div className="flex items-center justify-between text-sm"><span className="font-medium truncate max-w-[180px]">{j.juzgado}</span><span className="font-bold text-green-700">{formatMonto(j.monto_pendiente)}</span></div><div className="flex items-center gap-2 text-xs text-muted-foreground"><span>{j.casos} casos</span><div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-green-500 rounded-full" style={{ width: `${(j.monto_pendiente / maxMonto) * 100}%` }} /></div></div></div>))}</div></CardContent></Card>
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />Por Estado</CardTitle></CardHeader><CardContent><div className="space-y-3">{ordenEstados.map(estado => { const count = solicitudesPorEstado[estado] || 0; const pct = kpi.totalRadicaciones > 0 ? Math.round((count / kpi.totalRadicaciones) * 100) : 0; const label = (ESTADO_LABELS as Record<string, string>)[estado] || estado; const cls = (ESTADO_COLORS as Record<string, string>)[estado] || ""; return (<div key={estado} className="space-y-1"><div className="flex items-center justify-between text-sm"><Badge variant="secondary" className={`text-xs ${cls}`}>{label}</Badge><span className="font-bold">{count} <span className="text-xs font-normal">({pct}%)</span></span></div><Progress value={pct} className="h-1.5" /></div>) })}</div></CardContent></Card>
      </div>
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />Distribucion por Concepto</CardTitle><CardDescription>Volumen por tipo de asunto</CardDescription></CardHeader><CardContent><div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{(data?.distribucionNaturaleza || []).slice(0, 6).map((c: any) => { const pct = kpi.totalRadicaciones > 0 ? Math.round((c.total / kpi.totalRadicaciones) * 100) : 0; return (<div key={c.asunto} className="space-y-1"><div className="flex items-center justify-between text-sm"><span className="font-medium truncate max-w-[180px]">{c.asunto.replace(/_/g, " ")}</span><span className="text-xs">{c.total} ({pct}%)</span></div><Progress value={pct} className="h-1.5" /></div>) })}</div></CardContent></Card>
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-amber-600" />Top 10 Sancionados por Monto</CardTitle><CardDescription>Mayor valor acumulado en COP</CardDescription></CardHeader><CardContent><div className="space-y-3">{(data?.topSancionados || []).length === 0 ? <p className="text-center py-4">Sin datos</p> : (data?.topSancionados || []).map((san, i) => (<div key={san.documento || i} className="flex items-center justify-between rounded-lg border p-3"><div className="flex items-center gap-3 min-w-0"><Badge variant="secondary" className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs">{i + 1}</Badge><div className="min-w-0"><p className="font-medium text-sm truncate max-w-[200px]">{san.nombre}</p><p className="text-xs text-muted-foreground">{san.tipoDoc === "CC" ? "CC" : san.tipoDoc} {san.documento} - {san.solicitudes} sol.</p></div></div><span className="font-bold text-green-700 text-sm shrink-0 ml-2">{formatCOP(san.montoCOP)}</span></div>))}</div></CardContent></Card>
    </div>
  )
}
