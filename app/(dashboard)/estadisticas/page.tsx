'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  Users, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  AlertCircle,
  BarChart3,
  PieChart as PieChartIcon,
  DollarSign,
  Loader2
} from 'lucide-react'
import { useDashboardData } from '@/components/dashboards/use-dashboard-data'
import { formatCOP } from '@/lib/utils'
import { ESTADO_LABELS, ESTADO_COLORS } from '@/lib/types'

const formatMonto = (monto: number): string => {
  if (monto >= 1_000_000) return `$${(monto / 1_000_000).toFixed(1)}M`
  if (monto >= 1_000) return `$${(monto / 1_000).toFixed(0)}K`
  return `$${monto.toLocaleString('es-CO')}`
}

export default function EstadisticasPage() {
  const { data, loading } = useDashboardData()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const kpi = (data?.kpi || {}) as any
  const solicitudesPorEstado = (data?.solicitudesPorEstado || {}) as Record<string, number>

  const kpis = [
    {
      title: 'Total Sancionados',
      value: kpi.totalSancionados || 0,
      icon: Users,
      color: 'bg-amber-500/10 text-amber-600'
    },
    {
      title: 'Total Solicitudes',
      value: kpi.totalRadicaciones || 0,
      icon: FileText,
      color: 'bg-blue-500/10 text-blue-600'
    },
    {
      title: 'Valor Total Sanciones',
      value: formatCOP(kpi.valorTotalSancionesCOP || 0),
      icon: DollarSign,
      color: 'bg-green-500/10 text-green-600'
    },
    {
      title: 'Solicitudes Activas',
      value: kpi.totalActivas || 0,
      icon: AlertCircle,
      color: 'bg-orange-500/10 text-orange-600'
    },
    {
      title: 'Radicadas en GCC',
      value: kpi.totalCerradas || 0,
      icon: CheckCircle,
      color: 'bg-emerald-500/10 text-emerald-600'
    },
    {
      title: 'Tasa de Recaudo',
      value: `${kpi.tasaRecaudo || 0}%`,
      icon: TrendingUp,
      color: 'bg-violet-500/10 text-violet-600'
    }
  ]

  const ordenEstados: Array<[string, string]> = [
    ["EN_VALIDACION", "En Validación"],
    ["RADICADA_EN_SIGOBIUS", "Radicada SIGOBIUS"],
    ["ASIGNADA_A_ABOGADO", "Asignada a Abogado"],
    ["DEVUELTA_POR_GESTOR", "Devuelta por Gestor"],
    ["DEVUELTA_POR_ABOGADO", "Devuelta por Abogado"],
    ["RADICADA_EN_GCC", "Radicada en GCC"]
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard de Indicadores</h1>
        <p className="text-muted-foreground mt-2">KPIs y métricas clave del sistema de cobro coactivo</p>
      </div>

      {/* KPIs Principales */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((kpiItem, index) => {
          const Icon = kpiItem.icon
          return (
            <Card key={index}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">{kpiItem.title}</CardTitle>
                  <div className={`p-2 rounded-lg ${kpiItem.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-2xl font-bold break-words">{kpiItem.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Distribución por Estado */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Distribución por Estado
            </CardTitle>
            <CardDescription>Solicitudes agrupadas por estado actual</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {ordenEstados.map(([estado, label]) => {
                const count = solicitudesPorEstado[estado] || 0
                const pct = kpi.totalRadicaciones > 0 ? Math.round((count / kpi.totalRadicaciones) * 100) : 0
                const colorClass = (ESTADO_COLORS as Record<string, string>)[estado] || "bg-gray-100 text-gray-800"
                return (
                  <div key={estado} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={`text-xs ${colorClass}`}>
                        {label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">{pct}%</span>
                      <span className="font-bold text-lg w-12 text-right">{count}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Métricas de Eficiencia */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Métricas de Eficiencia
            </CardTitle>
            <CardDescription>Indicadores de gestión del sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Monto Pendiente (Etapa Preliminar)</span>
                  <span className="font-bold text-lg">{formatMonto(kpi.montoTotalPendiente || 0)}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Valor Sanciones Pendiente</span>
                  <span className="font-bold text-lg">{formatCOP(kpi.valorSancionesPendienteCOP || 0)}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Valor Sanciones Cerrado (GCC)</span>
                  <span className="font-bold text-green-600 text-lg">{formatCOP(kpi.valorSancionesCerradoCOP || 0)}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Tiempo Promedio de Cierre</span>
                  <span className="font-bold text-lg">{kpi.tiempoPromedioCierre || 0} días</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Tasa de Recaudo</span>
                  <span className="font-bold text-lg">{kpi.tasaRecaudo || 0}%</span>
                </div>
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all bg-emerald-500"
                    style={{ width: `${Math.min(kpi.tasaRecaudo || 0, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Juzgados */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Top Juzgados por Monto Pendiente
            </CardTitle>
            <CardDescription>Juzgados con mayor valor en etapa preliminar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(data?.montoPorJuzgado || []).slice(0, 5).map((j: any, i: number) => (
                <div key={j.juzgado} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-muted-foreground w-6">{i + 1}</span>
                    <span className="text-sm font-medium truncate max-w-[200px]">{j.juzgado}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-green-700">{formatMonto(j.monto_pendiente)}</span>
                    <p className="text-xs text-muted-foreground">{j.casos} casos</p>
                  </div>
                </div>
              ))}
              {(!data?.montoPorJuzgado || data.montoPorJuzgado.length === 0) && (
                <p className="text-center text-muted-foreground py-4">Sin datos disponibles</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-primary" />
              Distribución por Concepto
            </CardTitle>
            <CardDescription>Volumen de casos por tipo de asunto</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(data?.distribucionNaturaleza || []).slice(0, 5).map((c: any) => {
                const pct = kpi.totalRadicaciones > 0 ? Math.round((c.total / kpi.totalRadicaciones) * 100) : 0
                return (
                  <div key={c.asunto} className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate max-w-[200px]">
                      {c.asunto.replace(/_/g, " ")}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{pct}%</span>
                      <span className="font-bold">{c.total}</span>
                    </div>
                  </div>
                )
              })}
              {(!data?.distribucionNaturaleza || data.distribucionNaturaleza.length === 0) && (
                <p className="text-center text-muted-foreground py-4">Sin datos disponibles</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
