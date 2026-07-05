"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { 
  FileText, 
  CheckCircle2, 
  AlertTriangle,
  AlertCircle, 
  ArrowRight, 
  Users,
  TrendingUp,
  BarChart3,
  Download,
  DollarSign,
  Loader2,
  Clock,
  Undo2
} from "lucide-react"
import { ESTADO_LABELS, ESTADO_COLORS } from "@/lib/types"
import { useDashboardData } from "./use-dashboard-data"
import { formatCOP } from "@/lib/utils"

const formatMonto = (monto: number): string => {
  if (monto >= 1_000_000) return `$${(monto / 1_000_000).toFixed(1)}M`
  if (monto >= 1_000) return `$${(monto / 1_000).toFixed(0)}K`
  return `$${monto.toLocaleString("es-CO")}`
}

export function DashboardAdmin() {
  const { data, loading, error } = useDashboardData()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2">
        <AlertCircle className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Error al cargar datos del dashboard</p>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>Reintentar</Button>
      </div>
    )
  }

  const kpi = (data?.kpi || {}) as any
  const topJuzgados = (data?.montoPorJuzgado || []).slice(0, 8)
  const maxMonto = topJuzgados[0]?.monto_pendiente || 1
  const solicitudesPorEstado = (data?.solicitudesPorEstado || {}) as Record<string, number>

  const kpisPrincipales = [
    { title: "Sancionados", value: kpi.totalSancionados || 0, icon: Users, description: "Personas en procesos activos", color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/20" },
    { title: "Solicitudes", value: kpi.totalRadicaciones || 0, icon: FileText, description: `${kpi.totalActivas || 0} activas \u00b7 ${kpi.totalCerradas || 0} cerradas`, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/20" },
    { title: "Valor Total Sanciones", value: formatCOP(kpi.valorTotalSancionesCOP || 0), icon: DollarSign, description: "Suma convertida a COP", color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/20" }
  ]

  const kpisSecundarios = [
    { title: "Monto Pendiente", value: formatMonto(kpi.montoTotalPendiente || 0), icon: DollarSign, description: "Total etapa preliminar a recaudar", color: "text-emerald-600" },
    { title: "Solicitudes Activas", value: kpi.totalActivas || 0, icon: FileText, description: "En todos los estados intermedios", color: "text-indigo-600" },
    { title: "Tasa Recaudo", value: `${kpi.tasaRecaudo || 0}%`, icon: TrendingUp, description: "Monto cerrado vs total", color: "text-violet-600" },
    { title: "Tiempo Asignaci\u00f3n", value: `${kpi.tiempoPromedioCierre != null ? kpi.tiempoPromedioCierre : "\u2014"} d\u00edas`, icon: Clock, description: "Promedio radicaci\u00f3n \u2192 cierre", color: "text-cyan-600" }
  ]

  const ordenEstados = ["EN_VALIDACION","RADICADA_EN_SIGOBIUS","ASIGNADA_A_ABOGADO","DEVUELTA_POR_GESTOR","DEVUELTA_POR_ABOGADO","RADICADA_EN_GCC"] as const

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-balance">Dashboard Ejecutivo</h1>
          <p className="text-muted-foreground">M\u00e9tricas estrat\u00e9gicas del \u00e1rea de Cobro Coactivo</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { try { window.print() } catch (e) { console.error("[DashboardAdmin] window.print failed:", e) } }}>
            <Download className="mr-2 h-4 w-4" />
            Exportar Reporte
          </Button>
          <Button asChild>
            <Link href="/reportes">
              <BarChart3 className="mr-2 h-4 w-4" />
              Reportes
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {kpisPrincipales.map((stat) => (
          <Card key={stat.title} className={stat.bg}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <span className="text-lg sm:text-2xl md:text-3xl font-bold break-words">{stat.value}</span>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpisSecundarios.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <span className="text-base sm:text-xl lg:text-2xl font-bold break-words">{stat.value}</span>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Top Juzgados por Monto Pendiente
                </CardTitle>
                <CardDescription>Juzgados con mayor valor a recaudar (etapa preliminar)</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topJuzgados.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">Sin datos disponibles</p>
              ) : (
                topJuzgados.map((j: any) => (
                  <div key={j.juzgado} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium truncate max-w-[150px] sm:max-w-[220px]">{j.juzgado}</span>
                      <span className="font-bold text-green-700">{formatMonto(j.monto_pendiente)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{j.casos} casos</span>
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: `${(j.monto_pendiente / maxMonto) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Solicitudes por Estado
            </CardTitle>
            <CardDescription>Distribuci\u00f3n actual del flujo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {ordenEstados.map((estado) => {
                const count = solicitudesPorEstado[estado] || 0
                const pct = kpi.totalRadicaciones > 0 ? Math.round((count / kpi.totalRadicaciones) * 100) : 0
                const label = (ESTADO_LABELS as Record<string, string>)[estado] || estado
                const colorClass = (ESTADO_COLORS as Record<string, string>)[estado] || "bg-gray-100 text-gray-800"
                return (
                  <div key={estado} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <Badge variant="secondary" className={`text-xs ${colorClass}`}>{label}</Badge>
                      <span className="font-bold">{count} <span className="text-xs font-normal text-muted-foreground">({pct}%)</span></span>
                    </div>
                    <Progress value={pct} className="h-1.5" />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Distribuci\u00f3n por Concepto
              </CardTitle>
              <CardDescription>Volumen de casos por tipo de asunto</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {(data?.distribucionNaturaleza || []).slice(0, 6).map((c: any) => {
              const pct = kpi.totalRadicaciones > 0 ? Math.round((c.total / kpi.totalRadicaciones) * 100) : 0
              return (
                <div key={c.asunto} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium truncate max-w-[150px] sm:max-w-[200px] md:max-w-[250px]">{c.asunto.replace(/_/g, " ")}</span>
                    <span className="text-xs">{c.total} ({pct}%)</span>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-amber-600" />
                Top 10 Sancionados por Monto Acumulado
              </CardTitle>
              <CardDescription>Personas con mayor valor acumulado en sanciones (COP)</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(data?.topSancionados || []).length === 0 ? (
              <p className="text-center text-muted-foreground py-4">Sin datos disponibles</p>
            ) : (
              (data?.topSancionados || []).map((san: any, i: number) => (
                <div key={san.documento || i} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Badge variant="secondary" className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs">{i + 1}</Badge>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate max-w-[180px] sm:max-w-[280px]">{san.nombre}</p>
                      <p className="text-xs text-muted-foreground">{san.tipoDoc === 'CC' ? 'CC' : san.tipoDoc} {san.documento} \u00b7 {san.solicitudes} solicitud{san.solicitudes !== 1 ? 'es' : ''}</p>
                    </div>
                  </div>
                  <span className="font-bold text-green-700 text-sm shrink-0 ml-2">{formatCOP(san.montoCOP)}</span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}