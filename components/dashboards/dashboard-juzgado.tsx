"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { FileText, Clock, CheckCircle2, AlertCircle, ArrowRight, Plus } from "lucide-react"
import { mockSolicitudes } from "@/lib/mock-data"
import { useAuth } from "@/lib/auth-context"
import { ESTADO_LABELS, ESTADO_COLORS, CLASE_PROCESO_LABELS } from "@/lib/types"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export function DashboardJuzgado() {
  const { user } = useAuth()
  
  if (!user) return null
  
  // Filtrar solicitudes del juzgado actual
  const misSolicitudes = mockSolicitudes.filter(
    s => s.codigoDespacho === user.codigoDespacho
  )
  
  const solicitudesEnProceso = misSolicitudes.filter(
    s => !["CERRADA", "TERMINADA_SIN_PAGO", "DEVUELTA"].includes(s.estado)
  )
  const solicitudesCerradas = misSolicitudes.filter(
    s => ["CERRADA", "TERMINADA_SIN_PAGO"].includes(s.estado)
  )
  const solicitudesDevueltas = misSolicitudes.filter(
    s => s.estado === "DEVUELTA"
  )

  const stats = [
    {
      title: "Total Radicadas",
      value: misSolicitudes.length,
      icon: FileText,
      description: "Solicitudes enviadas"
    },
    {
      title: "En Proceso",
      value: solicitudesEnProceso.length,
      icon: Clock,
      description: "En trámite activo"
    },
    {
      title: "Cerradas",
      value: solicitudesCerradas.length,
      icon: CheckCircle2,
      description: "Finalizadas"
    },
    {
      title: "Devueltas",
      value: solicitudesDevueltas.length,
      icon: AlertCircle,
      description: "Requieren corrección"
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-balance">
            Bienvenido, {user.nombre}
          </h1>
          <p className="text-muted-foreground">
            {user.nombreJuzgado}
          </p>
        </div>
        <Button asChild>
          <Link href="/solicitudes/nueva">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Solicitud
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
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
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alertas de devoluciones */}
      {solicitudesDevueltas.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Solicitudes que requieren atención
            </CardTitle>
            <CardDescription>
              Las siguientes solicitudes han sido devueltas y requieren corrección
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {solicitudesDevueltas.map((solicitud) => (
                <div
                  key={solicitud.id}
                  className="flex items-center justify-between rounded-lg border border-destructive/20 bg-background p-3"
                >
                  <div>
                    <p className="font-medium">{solicitud.id}</p>
                    <p className="text-sm text-muted-foreground">
                      {solicitud.motivoDevolucion}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/solicitudes/${solicitud.id}/corregir`}>
                      Corregir
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Solicitudes recientes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Mis Solicitudes Recientes</CardTitle>
              <CardDescription>
                Últimas solicitudes radicadas por su despacho
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/solicitudes">
                Ver todas
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {misSolicitudes.slice(0, 5).map((solicitud) => (
              <div
                key={solicitud.id}
                className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-3">
                    <p className="font-medium">{solicitud.id}</p>
                    <Badge 
                      variant="secondary" 
                      className={ESTADO_COLORS[solicitud.estado]}
                    >
                      {ESTADO_LABELS[solicitud.estado]}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {CLASE_PROCESO_LABELS[solicitud.claseProceso]} - {solicitud.sancionados[0]?.nombreCompleto}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Radicado: {format(solicitud.fechaSolicitud, "d 'de' MMMM 'de' yyyy", { locale: es })}
                  </p>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/solicitudes/${solicitud.id}`}>
                    Ver detalle
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
