"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  CLASE_PROCESO_LABELS,
  DISPONIBILIDAD_LABELS,
  DISPONIBILIDAD_COLORS
} from "@/lib/types"
import { Users, Briefcase, DollarSign, UserCheck, Loader2 } from "lucide-react"

const formatMonto = (monto: number): string => {
  if (monto >= 1_000_000) return `$${(monto / 1_000_000).toFixed(1)}M`
  if (monto >= 1_000) return `$${(monto / 1_000).toFixed(0)}K`
  return `$${monto.toLocaleString("es-CO")}`
}

export default function AbogadosPage() {
  const [abogados, setAbogados] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/abogados")
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then(d => setAbogados(d.data || []))
      .catch(() => setAbogados([]))
      .finally(() => setLoading(false))
  }, [])

  const totalCasos = useMemo(() => abogados.reduce((s, a) => s + (a.casos_asignados || 0), 0), [abogados])
  const totalSancionados = useMemo(() => abogados.reduce((s, a) => s + (a.total_sancionados || 0), 0), [abogados])
  const totalMonto = useMemo(() => abogados.reduce((s, a) => s + (a.monto_recaudar || 0), 0), [abogados])

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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-blue-50/50 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Abogados
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold text-blue-900 break-words">{abogados.length}</div>
            <p className="text-xs text-blue-600/70">Activos en el sistema</p>
          </CardContent>
        </Card>
        <Card className="bg-indigo-50/50 border-indigo-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Casos Asignados
            </CardTitle>
            <Briefcase className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold text-indigo-900 break-words">{totalCasos}</div>
            <p className="text-xs text-indigo-600/70">Total en gestión</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50/50 border-amber-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sancionados
            </CardTitle>
            <UserCheck className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold text-amber-900 break-words">{totalSancionados}</div>
            <p className="text-xs text-amber-600/70">Personas en procesos</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50/50 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monto a Recaudar
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold text-green-900 break-words">{formatMonto(totalMonto)}</div>
            <p className="text-xs text-green-600/70">Pendiente de cobro</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de abogados */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : abogados.length === 0 ? (
        <div className="flex justify-center py-12">
          <p className="text-muted-foreground">No hay abogados activos registrados</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {abogados.map((abogado) => (
            <Card key={abogado.id} className="flex flex-col overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1" />
                  <Badge className={(DISPONIBILIDAD_COLORS as Record<string, string>)[abogado.disponibilidad || 'DISPONIBLE'] + ' shrink-0 text-xs whitespace-nowrap'}>
                    {(DISPONIBILIDAD_LABELS as Record<string, string>)[abogado.disponibilidad || 'DISPONIBLE']}
                  </Badge>
                </div>
                <div className="flex flex-col items-center text-center pt-1">
                  <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mb-2">
                    <Users className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
                  </div>
                  <CardTitle className="text-base sm:text-lg truncate max-w-full">{abogado.nombre}</CardTitle>
                  <CardDescription className="truncate text-xs sm:text-sm max-w-full">{abogado.email}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 flex-1 min-w-0">
                {/* Especialidades */}
                {(abogado.especialidades || []).length > 0 && (
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground mb-1.5 sm:mb-2">Especialidades</p>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {abogado.especialidades?.map((esp: string) => (
                        <Badge key={esp} variant="outline" className="text-xs max-w-[150px] truncate">
                          {(CLASE_PROCESO_LABELS as Record<string, string>)[esp] || esp}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3 Indicadores principales */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                  <div className="bg-blue-50 rounded-lg py-2 sm:py-3 px-1 min-w-0">
                    <p className="text-base sm:text-xl font-bold text-primary break-words">{abogado.casos_asignados || 0}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Asignados</p>
                  </div>
                  <div className="bg-amber-50 rounded-lg py-2 sm:py-3 px-1 min-w-0">
                    <p className="text-base sm:text-xl font-bold text-amber-600 break-words">{abogado.total_sancionados || 0}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Sancionados</p>
                  </div>
                  <div className="bg-green-50 rounded-lg py-2 sm:py-3 px-1 min-w-0">
                    <p className="text-sm sm:text-lg font-bold text-green-600 break-words">{formatMonto(abogado.monto_recaudar || 0)}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Recaudar</p>
                  </div>
                </div>

                {/* Barra de carga */}
                <div className="space-y-1.5 sm:space-y-2">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-muted-foreground">Carga de trabajo</span>
                    <span className="font-medium">{abogado.carga_porcentaje || 0}%</span>
                  </div>
                  <Progress
                    value={abogado.carga_porcentaje || 0}
                    className={`h-2 ${(abogado.carga_porcentaje || 0) > 80 ? '[&>div]:bg-destructive' : (abogado.carga_porcentaje || 0) > 60 ? '[&>div]:bg-yellow-500' : ''}`}
                  />
                  <p className="text-[11px] sm:text-xs text-muted-foreground">
                    {abogado.casos_activos || 0} activos de {abogado.capacidad_maxima || 20} máximo
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
