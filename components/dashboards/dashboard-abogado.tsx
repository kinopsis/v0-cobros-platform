"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { 
  Briefcase, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight,
  Calendar,
  TrendingUp
} from "lucide-react"
import { mockSolicitudes } from "@/lib/mock-data"
import { useAuth } from "@/lib/auth-context"
import { ESTADO_LABELS, ESTADO_COLORS, CLASE_PROCESO_LABELS, PRIORIDAD_COLORS, PRIORIDAD_LABELS } from "@/lib/types"
import { format, differenceInDays } from "date-fns"
import { es } from "date-fns/locale"

export function DashboardAbogado() {
  const { user } = useAuth()
  
  if (!user) return null

  // Filtrar casos asignados al abogado actual
  const misCasos = mockSolicitudes.filter(
    s => s.abogadoAsignadoId === user.id
  )
  
  const casosActivos = misCasos.filter(
    s => !["CERRADA", "TERMINADA_SIN_PAGO"].includes(s.estado)
  )
  const casosCerrados = misCasos.filter(
    s => ["CERRADA", "TERMINADA_SIN_PAGO"].includes(s.estado)
  )
  const casosConAlerta = casosActivos.filter(s => {
    const diasTranscurridos = differenceInDays(new Date(), s.fechaAsignacion || s.fechaSolicitud)
    return diasTranscurridos > 15
  })
  const casosEnProceso = casosActivos.filter(
    s => s.estado === "EN_PROCESO"
  )

  // Calcular tiempo promedio
  const tiemposGestion = casosCerrados.map(c => {
    if (c.fechaCierre && c.fechaAsignacion) {
      return differenceInDays(c.fechaCierre, c.fechaAsignacion)
    }
    return 0
  }).filter(t => t > 0)
  
  const tiempoPromedio = tiemposGestion.length > 0 
    ? Math.round(tiemposGestion.reduce((a, b) => a + b, 0) / tiemposGestion.length) 
    : 0

  const stats = [
    {
      title: "Casos Activos",
      value: casosActivos.length,
      icon: Briefcase,
      description: "Asignados actualmente",
      color: "text-blue-600"
    },
    {
      title: "En Proceso",
      value: casosEnProceso.length,
      icon: Clock,
      description: "Trabajando activamente",
      color: "text-cyan-600"
    },
    {
      title: "Cerrados este mes",
      value: casosCerrados.length,
      icon: CheckCircle2,
      description: "Finalizados",
      color: "text-green-600"
    },
    {
      title: "Alertas",
      value: casosConAlerta.length,
      icon: AlertTriangle,
      description: "+15 días sin actuación",
      color: "text-red-600"
    }
  ]

  // Capacidad
  const capacidadUsada = user.capacidadMaxima 
    ? Math.round((casosActivos.length / user.capacidadMaxima) * 100) 
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-balance">
            Mi Bandeja de Casos
          </h1>
          <p className="text-muted-foreground">
            {user.nombre} - {user.especialidades?.join(", ")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/casos">
              <Briefcase className="mr-2 h-4 w-4" />
              Ver todos mis casos
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

      {/* Alertas de inactividad */}
      {casosConAlerta.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Casos con Alerta de Inactividad
            </CardTitle>
            <CardDescription>
              Los siguientes casos llevan más de 15 días sin actuación registrada
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {casosConAlerta.map((caso) => {
                const diasTranscurridos = differenceInDays(new Date(), caso.fechaAsignacion || caso.fechaSolicitud)
                return (
                  <div
                    key={caso.id}
                    className="flex items-center justify-between rounded-lg border border-destructive/20 bg-background p-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{caso.id}</p>
                        <Badge variant="destructive" className="text-xs">
                          {diasTranscurridos} días
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {CLASE_PROCESO_LABELS[caso.claseProceso]} - {caso.sancionados[0]?.nombreCompleto}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/casos/${caso.id}`}>
                        Actualizar
                      </Link>
                    </Button>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Casos activos */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  Mis Casos Activos
                </CardTitle>
                <CardDescription>
                  Casos que requieren gestión
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/casos">
                  Ver todos
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {casosActivos.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No tienes casos activos asignados
                </p>
              ) : (
                casosActivos.slice(0, 5).map((caso) => (
                  <div
                    key={caso.id}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">{caso.id}</p>
                        <Badge 
                          variant="secondary" 
                          className={ESTADO_COLORS[caso.estado]}
                        >
                          {ESTADO_LABELS[caso.estado]}
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={PRIORIDAD_COLORS[caso.prioridad]}
                        >
                          {PRIORIDAD_LABELS[caso.prioridad]}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {CLASE_PROCESO_LABELS[caso.claseProceso]} - {caso.sancionados[0]?.nombreCompleto}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        Asignado: {format(caso.fechaAsignacion || caso.fechaSolicitud, "d MMM yyyy", { locale: es })}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/casos/${caso.id}`}>
                        Gestionar
                      </Link>
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Métricas personales */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Capacidad de Trabajo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold">{casosActivos.length} / {user.capacidadMaxima || 20}</span>
                <span className="text-sm font-medium">{capacidadUsada}%</span>
              </div>
              <Progress value={capacidadUsada} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                Casos activos sobre capacidad máxima
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Tiempo Promedio de Gestión
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tiempoPromedio} días</div>
              <p className="text-xs text-muted-foreground">Desde asignación hasta cierre</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Especialidades
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {user.especialidades?.map((esp) => (
                  <Badge key={esp} variant="secondary">
                    {CLASE_PROCESO_LABELS[esp]}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
