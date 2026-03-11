"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { mockUsuarios, mockProductividadAbogados } from "@/lib/mock-data"
import { 
  CLASE_PROCESO_LABELS,
  DISPONIBILIDAD_LABELS,
  DISPONIBILIDAD_COLORS
} from "@/lib/types"
import { Users, Briefcase, Clock, CheckCircle2, TrendingUp } from "lucide-react"

export default function AbogadosPage() {
  const abogados = mockUsuarios.filter(u => u.rol === "ABOGADO" && u.activo)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Abogados Ejecutores
          </h1>
          <p className="text-muted-foreground">
            Gestión de carga y disponibilidad del equipo de abogados
          </p>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Abogados
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{abogados.length}</div>
            <p className="text-xs text-muted-foreground">Activos en el sistema</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Casos Activos Total
            </CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockProductividadAbogados.reduce((sum, a) => sum + a.casosAsignados, 0)}
            </div>
            <p className="text-xs text-muted-foreground">En gestión</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Casos Cerrados (Mes)
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockProductividadAbogados.reduce((sum, a) => sum + a.casosCerrados, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Este período</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tiempo Promedio
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(mockProductividadAbogados.reduce((sum, a) => sum + a.diasPromedio, 0) / mockProductividadAbogados.length).toFixed(1)} días
            </div>
            <p className="text-xs text-muted-foreground">Por caso cerrado</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de abogados */}
      <div className="grid gap-6 md:grid-cols-2">
        {mockProductividadAbogados.map((prod) => {
          const abogado = abogados.find(a => a.id === prod.abogadoId)
          if (!abogado) return null

          return (
            <Card key={prod.abogadoId}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{abogado.nombre}</CardTitle>
                      <CardDescription>{abogado.email}</CardDescription>
                    </div>
                  </div>
                  <Badge className={DISPONIBILIDAD_COLORS[abogado.disponibilidad || 'DISPONIBLE']}>
                    {DISPONIBILIDAD_LABELS[abogado.disponibilidad || 'DISPONIBLE']}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Especialidades */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Especialidades</p>
                  <div className="flex flex-wrap gap-2">
                    {abogado.especialidades?.map((esp) => (
                      <Badge key={esp} variant="outline">
                        {CLASE_PROCESO_LABELS[esp]}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Estadísticas */}
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-primary">{prod.casosAsignados}</p>
                    <p className="text-xs text-muted-foreground">Asignados</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{prod.casosEnProceso}</p>
                    <p className="text-xs text-muted-foreground">En proceso</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">{prod.casosCerrados}</p>
                    <p className="text-xs text-muted-foreground">Cerrados</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{prod.diasPromedio}</p>
                    <p className="text-xs text-muted-foreground">Días prom.</p>
                  </div>
                </div>

                {/* Barra de carga */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Carga de trabajo</span>
                    <span className="font-medium">{prod.cargaPorcentaje}%</span>
                  </div>
                  <Progress 
                    value={prod.cargaPorcentaje} 
                    className={`h-2 ${prod.cargaPorcentaje > 80 ? '[&>div]:bg-destructive' : prod.cargaPorcentaje > 60 ? '[&>div]:bg-yellow-500' : ''}`}
                  />
                  <p className="text-xs text-muted-foreground">
                    {abogado.casosActivos} de {abogado.capacidadMaxima} casos máximos
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
