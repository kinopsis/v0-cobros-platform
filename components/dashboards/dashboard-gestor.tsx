"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { 
  FileText, 
  Clock, 
  ArrowRight, 
  Users,
  TrendingUp,
  Calendar,
  DollarSign,
  Loader2,
  Undo2
} from "lucide-react"
import { ESTADO_LABELS, ESTADO_COLORS, CLASE_PROCESO_LABELS, PRIORIDAD_COLORS, PRIORIDAD_LABELS } from "@/lib/types"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useDashboardData } from "./use-dashboard-data"
import { formatCOP } from "@/lib/utils"

const formatMonto = (monto: number): string => {
  if (monto >= 1_000_000) return `$${(monto / 1_000_000).toFixed(1)}M`
  if (monto >= 1_000) return `$${(monto / 1_000).toFixed(0)}K`
  return `$${monto.toLocaleString("es-CO")}`
}

export function DashboardGestor() {
  const { data: biData, loading: biLoading } = useDashboardData()
  const [solicitudes, setSolicitudes] = useState<any[]>([])
  const [abogados, setAbogados] = useState<any[]>([])
  const [loadingExtra, setLoadingExtra] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch("/api/solicitudes?limit=5").then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() }),
      fetch("/api/abogados").then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() }),
    ]).then(([sol, abo]) => {
      setSolicitudes((sol.data || []).filter((s: any) => s.estado === "EN_VALIDACION"))
      setAbogados(abo.data || [])
    }).finally(() => setLoadingExtra(false))
  }, [])

  if (biLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const kpi = (biData?.kpi || {}) as any
  const solicitudesPorEstado = (biData?.solicitudesPorEstado || {}) as Record<string, number>

  // 3 KPIs principales
  const kpisPrincipales = [
    {
      title: "Sancionados",
      value: kpi.totalSancionados || 0,
      icon: Users,
      description: "Personas en procesos",
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

  // KPIs secundarios específicos del GESTOR
  const enValidacion = solicitudesPorEstado["EN_VALIDACION"] || 0
  const radicadasSigobius = solicitudesPorEstado["RADICADA_EN_SIGOBIUS"] || 0
  const devueltas = (solicitudesPorEstado["DEVUELTA_POR_GESTOR"] || 0) + (solicitudesPorEstado["DEVUELTA_POR_ABOGADO"] || 0)

  const kpisSecundarios = [
    { title: "Pendientes Validar", value: enValidacion, icon: Clock, description: "Requieren revisión", color: "text-yellow-600" },
    { title: "Radicadas SIGOBIUS", value: radicadasSigobius, icon: FileText, description: "Sin asignar a abogado", color: "text-emerald-600" },
    { title: "Devueltas", value: devueltas, icon: Undo2, description: "Requieren corrección", color: "text-red-600" },
    { title: "Tasa Recaudo", value: `${kpi.tasaRecaudo || 0}%`, icon: TrendingUp, description: "Monto cerrado vs total", color: "text-violet-600" }
  ]

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
            Panel de Gestión
          </h1>
          <p className="text-muted-foreground">
            Gestión centralizada de solicitudes de cobro coactivo
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/gestion">
              <FileText className="mr-2 h-4 w-4" />
              Bandeja de Entrada
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
              <div className="text-base sm:text-xl lg:text-2xl font-bold break-words">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Solicitudes pendientes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  Pendientes de Validación
                </CardTitle>
                <CardDescription>
                  Solicitudes que requieren revisión y asignación
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/gestion">
                  Ver todas
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {solicitudes.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No hay solicitudes pendientes de validación
                </p>
              ) : (
                solicitudes.slice(0, 4).map((sol: any) => (
                  <div
                    key={sol.id}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{sol.id}</p>
                        <Badge 
                          variant="secondary" 
                          className={(PRIORIDAD_COLORS as Record<string, string>)[sol.prioridad || 'MEDIA']}
                        >
                          {(PRIORIDAD_LABELS as Record<string, string>)[sol.prioridad || 'MEDIA']}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {(CLASE_PROCESO_LABELS as Record<string, string>)[sol.clase_proceso || sol.claseProceso || ''] || 'Sin clasificar'} - {sol.nombre_juzgado || sol.nombreJuzgado}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {sol.fecha_solicitud ? format(new Date(sol.fecha_solicitud), "d MMM yyyy", { locale: es }) : "Sin fecha"}
                        <span className="text-yellow-600 font-medium">
                          SLA: {sol.dias_sla || sol.diasSLA || 10} días
                        </span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/gestion/${sol.id}`}>
                        Revisar
                      </Link>
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Carga de abogados + Distribución por estado */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Carga de Abogados
                  </CardTitle>
                  <CardDescription>
                    Distribución actual de casos por abogado
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/abogados">
                    Ver todos
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {abogados.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No hay abogados activos</p>
                ) : (
                  abogados.slice(0, 4).map((a: any) => (
                    <div key={a.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{a.nombre}</p>
                          <p className="text-xs text-muted-foreground">{a.casos_asignados || 0} casos activos</p>
                        </div>
                        <span className="text-sm font-medium">{a.carga_porcentaje || 0}%</span>
                      </div>
                      <Progress value={a.carga_porcentaje || 0} className="h-2" />
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Distribución por estado */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Solicitudes por Estado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {ordenEstados.map((estado) => {
                  const count = solicitudesPorEstado[estado] || 0
                  const label = (ESTADO_LABELS as Record<string, string>)[estado] || estado
                  const colorClass = (ESTADO_COLORS as Record<string, string>)[estado] || "bg-gray-100 text-gray-800"
                  return (
                    <div key={estado} className="flex items-center justify-between text-sm">
                      <Badge variant="secondary" className={`text-xs ${colorClass}`}>
                        {label}
                      </Badge>
                      <span className="font-bold">{count}</span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
