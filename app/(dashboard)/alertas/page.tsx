'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AlertTriangle, AlertCircle, CheckCircle, Clock, Search, Archive } from 'lucide-react'
import { mockAlerts } from '@/lib/mock-data'

export default function AlertasPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [tipoAlerta, setTipoAlerta] = useState('TODOS')
  const [estado, setEstado] = useState('ACTIVAS')

  let filteredAlerts = mockAlerts

  if (estado === 'ACTIVAS') {
    filteredAlerts = filteredAlerts.filter(a => !a.leido)
  } else if (estado === 'ARCHIVADAS') {
    filteredAlerts = filteredAlerts.filter(a => a.leido)
  }

  if (tipoAlerta !== 'TODOS') {
    filteredAlerts = filteredAlerts.filter(a => a.tipo === tipoAlerta)
  }

  filteredAlerts = filteredAlerts.filter(a =>
    a.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const tipoColors: Record<string, string> = {
    CRÍTICA: 'bg-destructive/20 text-destructive',
    URGENTE: 'bg-warning/20 text-warning',
    ADVERTENCIA: 'bg-info/20 text-info',
    INFORMACIÓN: 'bg-success/20 text-success',
  }

  const tipoIcons: Record<string, React.ReactNode> = {
    CRÍTICA: <AlertTriangle className="h-5 w-5" />,
    URGENTE: <AlertCircle className="h-5 w-5" />,
    ADVERTENCIA: <Clock className="h-5 w-5" />,
    INFORMACIÓN: <CheckCircle className="h-5 w-5" />,
  }

  const conteoAlertasPorTipo = mockAlerts.reduce((acc, alert) => {
    acc[alert.tipo] = (acc[alert.tipo] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-warning" />
          <h1 className="text-3xl font-bold text-foreground">Alertas del Sistema</h1>
        </div>
        <p className="text-muted-foreground">
          Recibe notificaciones importantes sobre tus casos y actividades
        </p>
      </div>

      {/* Alert Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Alertas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockAlerts.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {mockAlerts.filter(a => !a.leido).length} sin leer
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Críticas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {conteoAlertasPorTipo['CRÍTICA'] || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Requieren atención inmediata
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Urgentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {conteoAlertasPorTipo['URGENTE'] || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Muy pronto
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Advertencias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-info">
              {conteoAlertasPorTipo['ADVERTENCIA'] || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Próximamente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Información</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {conteoAlertasPorTipo['INFORMACIÓN'] || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Notificaciones generales
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar alertas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={estado} onValueChange={setEstado}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ACTIVAS">Alertas Activas</SelectItem>
            <SelectItem value="ARCHIVADAS">Archivadas</SelectItem>
            <SelectItem value="TODAS">Todas</SelectItem>
          </SelectContent>
        </Select>
        <Select value={tipoAlerta} onValueChange={setTipoAlerta}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todos los Tipos</SelectItem>
            <SelectItem value="CRÍTICA">Crítica</SelectItem>
            <SelectItem value="URGENTE">Urgente</SelectItem>
            <SelectItem value="ADVERTENCIA">Advertencia</SelectItem>
            <SelectItem value="INFORMACIÓN">Información</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert) => (
            <Card key={alert.id} className={alert.leido ? 'opacity-75' : ''}>
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${tipoColors[alert.tipo]}`}>
                      {tipoIcons[alert.tipo]}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-foreground">{alert.titulo}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {alert.descripcion}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {alert.caso}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {alert.fecha}
                          </span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="flex-shrink-0">
                        <Archive className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-success mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">
                  No hay alertas en este momento
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
