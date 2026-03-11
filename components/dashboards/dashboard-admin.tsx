"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Users,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Download
} from "lucide-react"
import { mockSolicitudes, mockEstadisticas, mockProductividadAbogados, mockDistribucionProcesos } from "@/lib/mock-data"
import { CLASE_PROCESO_LABELS } from "@/lib/types"

export function DashboardAdmin() {
  const stats = [
    {
      title: "Total Procesos Activos",
      value: mockEstadisticas.totalProcesosActivos,
      icon: FileText,
      description: "En todos los estados",
      trend: "+12%",
      trendUp: true
    },
    {
      title: "Radicados Hoy",
      value: mockEstadisticas.radicadosHoy,
      icon: Clock,
      description: "Nuevas solicitudes",
      trend: "+3",
      trendUp: true
    },
    {
      title: "Cerrados en el Período",
      value: mockEstadisticas.cerradosEnPeriodo,
      icon: CheckCircle2,
      description: "Marzo 2026",
      trend: "+8%",
      trendUp: true
    },
    {
      title: "Alertas Inactividad",
      value: mockEstadisticas.alertasInactividad,
      icon: AlertTriangle,
      description: "+15 días sin actuación",
      trend: "-2",
      trendUp: false
    }
  ]

  // Top despachos remitentes
  const topDespachos = [
    { nombre: "Juzgado 1 Civil del Circuito", cantidad: 12, trend: "+3" },
    { nombre: "Juzgado 2 Penal del Circuito", cantidad: 9, trend: "+2" },
    { nombre: "Tribunal Administrativo", cantidad: 7, trend: "+1" },
    { nombre: "Juzgado 3 Laboral", cantidad: 5, trend: "0" },
    { nombre: "Juzgado 4 Familia", cantidad: 4, trend: "-1" },
  ]

  // Calcular total de casos cerrados y tiempo promedio
  const tiempoPromedioGestion = 12.4
  const cumplimientoSLA = 87

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-balance">
            Dashboard Ejecutivo
          </h1>
          <p className="text-muted-foreground">
            Métricas estratégicas del área de Cobro Coactivo - Marzo 2026
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

      {/* KPIs principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{stat.value}</span>
                <span className={`flex items-center text-xs font-medium ${stat.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.trendUp ? <TrendingUp className="h-3 w-3 mr-0.5" /> : <TrendingDown className="h-3 w-3 mr-0.5" />}
                  {stat.trend}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Métricas de eficiencia */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tiempo Promedio de Gestión
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tiempoPromedioGestion} días</div>
            <p className="text-xs text-muted-foreground">Desde radicación hasta cierre</p>
            <div className="mt-2 flex items-center text-xs text-green-600">
              <TrendingDown className="h-3 w-3 mr-1" />
              -1.2 días vs mes anterior
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cumplimiento de SLA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cumplimientoSLA}%</div>
            <Progress value={cumplimientoSLA} className="h-2 mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              Casos cerrados dentro del tiempo acordado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tasa de Devolución
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockEstadisticas.tasaDevolucion}%</div>
            <Progress value={mockEstadisticas.tasaDevolucion} className="h-2 mt-2 [&>div]:bg-yellow-500" />
            <p className="text-xs text-muted-foreground mt-2">
              Solicitudes devueltas vs total recibido
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Productividad por abogado */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Productividad por Abogado
                </CardTitle>
                <CardDescription>
                  Desempeño individual del equipo
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/abogados">
                  Ver detalle
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockProductividadAbogados.map((abogado) => (
                <div key={abogado.abogadoId} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{abogado.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        {abogado.casosAsignados} asignados | {abogado.casosCerrados} cerrados | {abogado.diasPromedio} días prom.
                      </p>
                    </div>
                    <Badge variant={abogado.cargaPorcentaje > 80 ? "destructive" : abogado.cargaPorcentaje > 60 ? "secondary" : "outline"}>
                      {abogado.cargaPorcentaje}%
                    </Badge>
                  </div>
                  <Progress 
                    value={abogado.cargaPorcentaje} 
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Distribución por tipo de proceso */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Distribución por Tipo de Proceso
                </CardTitle>
                <CardDescription>
                  Volumen de casos por clase de proceso
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockDistribucionProcesos.map((proceso) => (
                <div key={proceso.claseProceso} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">
                        {CLASE_PROCESO_LABELS[proceso.claseProceso]}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {proceso.activos} activos | {proceso.cerrados} cerrados
                      </p>
                    </div>
                    <span className="text-sm font-medium">{proceso.cantidad} ({proceso.porcentaje}%)</span>
                  </div>
                  <Progress 
                    value={proceso.porcentaje} 
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top despachos remitentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Top 5 Despachos por Volumen de Solicitudes
          </CardTitle>
          <CardDescription>
            Juzgados con mayor cantidad de solicitudes radicadas este período
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            {topDespachos.map((despacho, index) => (
              <div key={despacho.nombre} className="text-center p-4 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold text-primary">#{index + 1}</div>
                <p className="text-sm font-medium mt-1 line-clamp-2">{despacho.nombre}</p>
                <div className="flex items-center justify-center gap-1 mt-2">
                  <span className="text-lg font-bold">{despacho.cantidad}</span>
                  <span className={`text-xs ${despacho.trend.startsWith('+') ? 'text-green-600' : despacho.trend.startsWith('-') ? 'text-red-600' : 'text-muted-foreground'}`}>
                    {despacho.trend}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">solicitudes</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
