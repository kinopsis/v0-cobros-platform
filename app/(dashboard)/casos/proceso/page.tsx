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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Clock, Search, AlertCircle } from 'lucide-react'
import { mockCasos } from '@/lib/mock-data'

export default function CasosProcesoPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [prioridad, setPrioridad] = useState('TODOS')

  const casosEnProceso = mockCasos.filter(caso => 
    caso.estado === 'EN_PROCESO' || caso.estado === 'ASIGNADA_A_ABOGADO'
  )

  const filteredCasos = casosEnProceso.filter(caso => {
    const matchesSearch = 
      caso.numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caso.solicitante.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesPriority = prioridad === 'TODOS' || caso.prioridad === prioridad

    return matchesSearch && matchesPriority
  })

  const prioridadColors: Record<string, string> = {
    ALTA: 'bg-destructive/20 text-destructive',
    MEDIA: 'bg-warning/20 text-warning',
    BAJA: 'bg-success/20 text-success',
  }

  const estadoColors: Record<string, string> = {
    EN_PROCESO: 'bg-blue-100 text-blue-800',
    ASIGNADA_A_ABOGADO: 'bg-purple-100 text-purple-800',
  }

  const getTimeRemaining = () => {
    return Math.floor(Math.random() * 45) + 5 + ' días'
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Clock className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Casos en Proceso</h1>
        </div>
        <p className="text-muted-foreground">
          Monitorea el progreso de tus casos activos
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por número de caso o sancionado..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={prioridad} onValueChange={setPrioridad}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todas las Prioridades</SelectItem>
            <SelectItem value="ALTA">Alta</SelectItem>
            <SelectItem value="MEDIA">Media</SelectItem>
            <SelectItem value="BAJA">Baja</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Cases Table */}
      <Card>
        <CardHeader>
          <CardTitle>Casos Activos</CardTitle>
          <CardDescription>
            {filteredCasos.length} caso{filteredCasos.length !== 1 ? 's' : ''} en proceso
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número de Caso</TableHead>
                  <TableHead>Sancionado</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Prioridad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Tiempo Restante</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCasos.map((caso) => (
                  <TableRow key={caso.id}>
                    <TableCell className="font-medium text-primary">
                      {caso.numero}
                    </TableCell>
                    <TableCell>{caso.solicitante.nombreCompleto}</TableCell>
                    <TableCell>
                      ${caso.monto?.toLocaleString('es-CO') || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge className={prioridadColors[caso.prioridad]}>
                        {caso.prioridad}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={estadoColors[caso.estado] || 'bg-gray-100 text-gray-800'}>
                        {caso.estado === 'EN_PROCESO' ? 'En Proceso' : 'Asignado'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-1">
                        <AlertCircle className="h-4 w-4 text-warning" />
                        {getTimeRemaining()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        Ver Detalle
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
        </CardContent>
      </Card>

      {/* Alerts */}
      {filteredCasos.some(c => c.prioridad === 'ALTA') && (
        <Card className="border-warning/50 bg-warning/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <AlertCircle className="h-5 w-5" />
              Casos de Alta Prioridad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Tienes {filteredCasos.filter(c => c.prioridad === 'ALTA').length} caso{filteredCasos.filter(c => c.prioridad === 'ALTA').length !== 1 ? 's' : ''} de alta prioridad que requieren atención inmediata.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
