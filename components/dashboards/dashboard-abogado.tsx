"use client"

import { useState, useEffect } from "react"
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
  TrendingUp,
  Users,
  FileText,
  DollarSign,
  Loader2,
  Undo2
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { ESTADO_LABELS, ESTADO_COLORS, CLASE_PROCESO_LABELS, PRIORIDAD_COLORS, PRIORIDAD_LABELS } from "@/lib/types"
import { format, differenceInDays } from "date-fns"
import { es } from "date-fns/locale"
import { convertirSancionACOP, formatCOP } from "@/lib/utils"

export function DashboardAbogado() {
  const { user } = useAuth()
  const [misCasos, setMisCasos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/solicitudes?limit=100")
      .then(r => r.json())
      .then(res => setMisCasos(res.data || []))
      .finally(() => setLoading(false))
  }, [])

  if (!user) return null

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const casosActivos = misCasos.filter(
    (s: any) => s.estado !== "RADICADA_EN_GCC"
  )
  const casosCerrados = misCasos.filter(
    (s: any) => s.estado === "RADICADA_EN_GCC"
  )
  const casosEnProceso = casosActivos.filter(
    (s: any) => s.estado === "ASIGNADA_A_ABOGADO"
  )
  const casosDevueltos = casosActivos.filter(
    (s: any) => s.estado === "DEVUELTA_POR_ABOGADO"
  )
  const casosConAlerta = casosActivos.filter((s: any) => {
    const fechaRef = s.fecha_asignacion || s.fecha_solicitud
    if (!fechaRef) return false
    const diasTranscurridos = differenceInDays(new Date(), new Date(fechaRef))
    return diasTranscurridos > 15
  })

  // Calcular # Sancionados y Valor Total de Sanciones (mis casos)
  const totalSancionados = misCasos.reduce(
    (sum: number, s: any) => sum + (s.sancionados || []).length, 0
  )
  const valorTotalSancionesCOP = misCasos.reduce((sum: number, s: any) => {
    const ejecutoria = s.etapa_preliminar?.ejecutoria
    return sum + (s.sancionados || []).reduce((acc: number, san: any) =>
      acc + convertirSancionACOP(san.cantidad_sancion, san.tipo_sancion, ejecutoria), 0
    )
  }, 0)

  // Capacidad
  const capacidadUsada = user.capacidadMaxima 
    ? Math.round((casosActivos.length / user.capacidadMaxima) * 100) 
    : 0

  // 3 KPIs principales
  const kpisPrincipales = [
    {
      title: "Sancionados",
      value: totalSancionados,
      icon: Users,
      description: "Personas en mis casos",
      color: "text-amber-600",
      bg: "bg-amber-50 dark:bg-amber-950/20"
    },
    {
      title: "Mis Solicitudes",
      value: misCasos.length,
      icon: FileText,
      description: `${casosActivos.length} activas · ${casosCerrados.length} cerradas`,
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
      value: casosEnProceso.length,
      icon: Briefcase,
      description: "Trabajando activamente",
      color: "text-cyan-600"
    },
    {
      title: "Radicados GCC",
      value: casosCerrados.length,
      icon: CheckCircle2,
      description: "Finalizados",
      color: "text-green-600"
    },
    {
      title: "Devueltos",
      value: casosDevueltos.length,
      icon: Undo2,
      description: "Requieren corrección",
      color: "text-orange-600"
    },
    {
      title: "Alertas",
      value: casosConAlerta.length,
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
              {casosConAlerta.slice(0, 5).map((caso: any) => {
                const diasTranscurridos = differenceInDays(new Date(), new Date(caso.fecha_asignacion || caso.fecha_solicitud))
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
                        {caso.clase_proceso?.replace(/_/g, " ")} - {caso.sancionados?.[0]?.nombre_completo}
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
                casosActivos.slice(0, 5).map((caso: any) => (
                  <div
                    key={caso.id}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">{caso.id}</p>
                        <Badge 
                          variant="secondary" 
                          className={(ESTADO_COLORS as Record<string, string>)[caso.estado]}
                        >
                          {(ESTADO_LABELS as Record<string, string>)[caso.estado]}
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={(PRIORIDAD_COLORS as Record<string, string>)[caso.prioridad || 'MEDIA']}
                        >
                          {(PRIORIDAD_LABELS as Record<string, string>)[caso.prioridad || 'MEDIA']}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {caso.clase_proceso?.replace(/_/g, " ")} - {caso.sancionados?.[0]?.nombre_completo}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        Asignado: {caso.fecha_asignacion ? format(new Date(caso.fecha_asignacion), "d MMM yyyy", { locale: es }) : "Sin fecha"}
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
                Resumen de Casos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total asignados</span>
                  <span className="font-bold">{misCasos.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">En proceso (asignados)</span>
                  <span className="font-bold">{casosEnProceso.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Radicados en GCC</span>
                  <span className="font-bold text-green-600">{casosCerrados.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Valor sanciones gestionado</span>
                  <span className="font-bold text-green-600">{formatCOP(valorTotalSancionesCOP)}</span>
                </div>
              </div>
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
                    {(CLASE_PROCESO_LABELS as Record<string, string>)[esp] || esp}
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
