"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { 
  FileText, Clock, CheckCircle2, AlertCircle, ArrowRight, Plus, Loader2,
  Users, DollarSign, Undo2
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { ESTADO_LABELS, ESTADO_COLORS } from "@/lib/types"
import type { EstadoSolicitud } from "@/lib/types"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { convertirSancionACOP, formatCOP } from "@/lib/utils"

export function DashboardJuzgado() {
  const { user } = useAuth()
  const [solicitudesRaw, setSolicitudesRaw] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    async function fetchSolicitudes() {
      try {
        const res = await fetch("/api/solicitudes?limit=100")
        if (!res.ok) throw new Error("Error al cargar solicitudes")
        const json = await res.json()
        setSolicitudesRaw(json.data || [])
      } catch (err: any) {
        console.error(err)
        setError(err.message || "Error al cargar datos")
      } finally {
        setLoading(false)
      }
    }
    fetchSolicitudes()
  }, [])
  
  if (!user) return null
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">Error al cargar datos</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>
          Reintentar
        </Button>
      </div>
    )
  }

  // Calcular KPIs desde datos reales
  const totalSancionados = solicitudesRaw.reduce(
    (sum: number, s: any) => sum + (s.sancionados || []).length, 0
  )
  const valorTotalSancionesCOP = solicitudesRaw.reduce((sum: number, s: any) => {
    const ejecutoria = s.etapa_preliminar?.ejecutoria
    return sum + (s.sancionados || []).reduce((acc: number, san: any) =>
      acc + convertirSancionACOP(san.cantidad_sancion, san.tipo_sancion, ejecutoria), 0
    )
  }, 0)

  const solicitudesEnProceso = solicitudesRaw.filter(
    (s: any) => !["RADICADA_EN_GCC", "DEVUELTA_POR_GESTOR", "DEVUELTA_POR_ABOGADO"].includes(s.estado)
  )
  const solicitudesCerradas = solicitudesRaw.filter(
    (s: any) => s.estado === "RADICADA_EN_GCC"
  )
  const solicitudesDevueltas = solicitudesRaw.filter(
    (s: any) => s.estado === "DEVUELTA_POR_GESTOR" || s.estado === "DEVUELTA_POR_ABOGADO"
  )
  const enValidacion = solicitudesRaw.filter((s: any) => s.estado === "EN_VALIDACION").length

  // 3 KPIs principales
  const kpisPrincipales = [
    {
      title: "Sancionados",
      value: totalSancionados,
      icon: Users,
      description: "Personas en mis solicitudes",
      color: "text-amber-600",
      bg: "bg-amber-50 dark:bg-amber-950/20"
    },
    {
      title: "Solicitudes",
      value: solicitudesRaw.length,
      icon: FileText,
      description: `${solicitudesEnProceso.length} en proceso · ${solicitudesCerradas.length} cerradas`,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950/20"
    },
    {
      title: "Valor Total Sanciones",
      value: formatCOP(valorTotalSancionesCOP),
      icon: DollarSign,
      description: "Suma convertida a COP",
      color: "text-green-600",
      bg: "bg-green-50 dark:bg-green-950/20"
    }
  ]

  // KPIs secundarios
  const kpisSecundarios = [
    {
      title: "En Proceso",
      value: solicitudesEnProceso.length,
      icon: Clock,
      description: "En trámite activo",
      color: "text-cyan-600"
    },
    {
      title: "En Validación",
      value: enValidacion,
      icon: FileText,
      description: "Pendientes de revisión",
      color: "text-yellow-600"
    },
    {
      title: "Cerradas (GCC)",
      value: solicitudesCerradas.length,
      icon: CheckCircle2,
      description: "Radicadas en GCC",
      color: "text-green-600"
    },
    {
      title: "Devueltas",
      value: solicitudesDevueltas.length,
      icon: Undo2,
      description: "Requieren corrección",
      color: "text-red-600"
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
            {user.nombreJuzgado || user.codigoDespacho || "Portal Juzgado"}
          </p>
        </div>
        <Button asChild>
          <Link href="/solicitudes/nueva">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Solicitud
          </Link>
        </Button>
      </div>

      {/* 3 KPIs Principales */}
      <div className="grid gap-4 md:grid-cols-3">
        {kpisPrincipales.map((stat) => (
          <Card key={stat.title} className={stat.bg}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <span className="text-3xl font-bold">{stat.value}</span>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* KPIs Secundarios */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpisSecundarios.map((stat) => (
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

      {/* Empty state */}
      {solicitudesRaw.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No hay solicitudes registradas</h3>
            <p className="text-muted-foreground text-center mb-4 max-w-md">
              Comience radicando su primera solicitud de cobro coactivo desde el portal.
            </p>
            <Button asChild>
              <Link href="/solicitudes/nueva">
                <Plus className="mr-2 h-4 w-4" />
                Nueva Solicitud
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

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
              {solicitudesDevueltas.map((solicitud: any) => (
                <div
                  key={solicitud.id}
                  className="flex items-center justify-between rounded-lg border border-destructive/20 bg-background p-3"
                >
                  <div>
                    <p className="font-medium">{solicitud.id}</p>
                    <p className="text-sm text-muted-foreground">
                      {solicitud.motivo_devolucion || "Sin motivo especificado"}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/solicitudes/${solicitud.id}/editar`}>
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
      {solicitudesRaw.length > 0 && (
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
              {solicitudesRaw.slice(0, 5).map((solicitud: any) => (
                <div
                  key={solicitud.id}
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-3">
                      <p className="font-medium">{solicitud.id}</p>
                      <Badge 
                        variant="secondary" 
                        className={(ESTADO_COLORS as Record<string, string>)[solicitud.estado]}
                      >
                        {(ESTADO_LABELS as Record<string, string>)[solicitud.estado]}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {solicitud.clase_proceso?.replace(/_/g, " ")}{solicitud.sancionados?.[0]?.nombre_completo ? ` - ${solicitud.sancionados[0].nombre_completo}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Radicado: {solicitud.fecha_solicitud ? format(new Date(solicitud.fecha_solicitud), "d 'de' MMMM 'de' yyyy", { locale: es }) : "Sin fecha"}
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
      )}
    </div>
  )
}
