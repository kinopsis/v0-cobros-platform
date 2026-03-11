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
  Calendar
} from "lucide-react"
import { mockSolicitudes, mockEstadisticas, mockProductividadAbogados, mockUsuarios } from "@/lib/mock-data"
import { ESTADO_LABELS, ESTADO_COLORS, CLASE_PROCESO_LABELS, PRIORIDAD_COLORS, PRIORIDAD_LABELS } from "@/lib/types"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export function DashboardGestor() {
  // Solicitudes pendientes de validación
  const pendientesValidar = mockSolicitudes.filter(
    s => s.estado === "RECIBIDA" || s.estado === "EN_VALIDACION"
  )
  
  const radicadasHoy = mockSolicitudes.filter(
    s => s.fechaSolicitud.toDateString() === new Date().toDateString()
  )

  const abogados = mockUsuarios.filter(u => u.rol === "ABOGADO")

  const stats = [
    {
      title: "Pendientes Validar",
      value: pendientesValidar.length,
      icon: Clock,
      description: "Requieren revisión",
      color: "text-yellow-600"
    },
    {
      title: "Procesos Activos",
      value: mockEstadisticas.totalProcesosActivos,
      icon: FileText,
      description: "En todos los estados",
      color: "text-blue-600"
    },
    {
      title: "Cerrados este mes",
      value: mockEstadisticas.cerradosEnPeriodo,
      icon: CheckCircle2,
      description: "Marzo 2026",
      color: "text-green-600"
    },
    {
      title: "Alertas Inactividad",
      value: mockEstadisticas.alertasInactividad,
      icon: AlertTriangle,
      description: "+15 días sin actuación",
      color: "text-red-600"
    }
  ]

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

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
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
              {pendientesValidar.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No hay solicitudes pendientes de validación
                </p>
              ) : (
                pendientesValidar.slice(0, 4).map((solicitud) => (
                  <div
                    key={solicitud.id}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{solicitud.id}</p>
                        <Badge 
                          variant="secondary" 
                          className={PRIORIDAD_COLORS[solicitud.prioridad]}
                        >
                          {PRIORIDAD_LABELS[solicitud.prioridad]}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {CLASE_PROCESO_LABELS[solicitud.claseProceso]} - {solicitud.nombreJuzgado}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(solicitud.fechaSolicitud, "d MMM yyyy", { locale: es })}
                        <span className="text-yellow-600 font-medium">
                          SLA: {solicitud.diasSLA} días
                        </span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/gestion/${solicitud.id}`}>
                        Revisar
                      </Link>
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Carga de abogados */}
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
              {mockProductividadAbogados.map((abogado) => (
                <div key={abogado.abogadoId} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{abogado.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        {abogado.casosAsignados} casos activos
                      </p>
                    </div>
                    <span className="text-sm font-medium">
                      {abogado.cargaPorcentaje}%
                    </span>
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
      </div>

      {/* Métricas rápidas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Tasa de Devolución
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockEstadisticas.tasaDevolucion}%</div>
            <p className="text-xs text-muted-foreground">Solicitudes devueltas vs total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Radicados Hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockEstadisticas.radicadosHoy}</div>
            <p className="text-xs text-muted-foreground">Nuevas solicitudes recibidas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Abogados Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{abogados.length}</div>
            <p className="text-xs text-muted-foreground">Disponibles para asignación</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
