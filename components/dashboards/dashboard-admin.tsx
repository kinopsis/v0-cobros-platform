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
  const { data, loading } = useDashboardData()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const kpi = (data?.kpi || {}) as any
  const topJuzgados = (data?.montoPorJuzgado || []).slice(0, 8)
  const maxMonto = topJuzgados[0]?.monto_pendiente || 1
  const solicitudesPorEstado = (data?.solicitudesPorEstado || {}) as Record<string, number>

  // 3 KPIs principales (prioridad del usuario)
  const kpisPrincipales = [
    {
      title: "Sancionados",
      value: kpi.totalSancionados || 0,
      icon: Users,
      description: "Personas en procesos activos",
      color: "text-amber-600",
      bg: "bg-amber-50 dark:bg-amber-950/20"
    },
    {
      title: "Solicitudes",
      value: kpi.totalRadicaciones || 0,
      icon: FileText,
      description: `${kpi.totalActivas || 0} activas · ${kpi.totalCerradas || 0} cerradas`,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950/20"
    },
    {
      title: "Valor Total Sanciones",
      value: formatCOP(kpi.valorTotalSancionesCOP || 0),
      icon: DollarSign,
      description: "Suma convertida a COP",
      color: "text-green-600",
      bg: "bg-green-50 dark:bg-green-950/20"
    }
  ]

  // KPIs secundarios
  const kpisSecundarios = [
    {
      title: "Monto Pendiente",
      value: formatMonto(kpi.montoTotalPendiente || 0),
      icon: DollarSign,
      description: "Total etapa preliminar a recaudar",
      color: "text-emerald-600"
    },
    {
      title: "Solicitudes Activas",
      value: kpi.totalActivas || 0,
      icon: FileText,
      description: "En todos los estados intermedios",
      color: "text-indigo-600"
    },
    {
      title: "Tasa Recaudo",
      value: `${kpi.tasaRecaudo || 0}%`,
      icon: TrendingUp,
      description: "Monto cerrado vs total",
      color: "text-violet-600"
    },
    {
      title: "Tiempo Asignación",
      value: `${kpi.tiempoPromedioCierre || 0} días`,
      icon: Clock,
      description: "Promedio radicación → cierre",
      color: "text-cyan-600"
    }
  ]

  // Orden de estados para la tabla
  const ordenEstados = [
    "EN_VALIDACION",
    "RADICADA_EN_SIGOBIUS", 
    "ASIGNADA_A_ABOGADO",
    "DEVUELTA_POR_GESTOR",
    "DEVUELTA_POR_ABOGADO",
    "RADICADA_EN_GCC"
  ] as const

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-balance">
            Dashboard Ejecutivo
          </h1>
          <p className="text-muted-foreground">
            Métricas estratégicas del área de Cobro Coactivo
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
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

      {/* 3 KPIs Principales */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {kpisPrincipales.map((stat) => (
          <Card key={stat.title} className={stat.bg}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <span className="text-lg sm:text-2xl md:text-3xl font-bold break-words">{stat.value}</span>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* KPIs Secundarios */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpisSecundarios.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
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
        {/* Top Juzgados por Monto */}
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

        {/* Solicitudes por Estado */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Solicitudes por Estado
            </CardTitle>
            <CardDescription>Distribución actual del flujo</CardDescription>
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
                      <Badge variant="secondary" className={`text-xs ${colorClass}`}>
                        {label}
                      </Badge>
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

      {/* Distribución por Concepto */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Distribución por Concepto
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
    </div>
  )
}
