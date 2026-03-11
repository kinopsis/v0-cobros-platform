'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CheckCircle2, Search, Download, BarChart3 } from 'lucide-react'
import { mockCasos } from '@/lib/mock-data'

export default function CasosCerradosPage() {
  const [searchTerm, setSearchTerm] = useState('')

  const casosCerrados = mockCasos.filter(caso => 
    caso.estado === 'CERRADA' || caso.estado === 'TERMINADA_SIN_PAGO'
  )

  const filteredCasos = casosCerrados.filter(caso =>
    caso.numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    caso.solicitante.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const estadoColors: Record<string, string> = {
    CERRADA: 'bg-success/20 text-success',
    TERMINADA_SIN_PAGO: 'bg-destructive/20 text-destructive',
  }

  const totalRecaudado = casosCerrados.reduce((sum, caso) => sum + (caso.monto || 0), 0)
  const casosCobrados = casosCerrados.filter(caso => caso.estado === 'CERRADA').length

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-6 w-6 text-success" />
          <h1 className="text-3xl font-bold text-foreground">Casos Cerrados</h1>
        </div>
        <p className="text-muted-foreground">
          Historial de casos finalizados y su resultado final
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Casos Cerrados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{casosCerrados.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {casosCobrados} cobrados exitosamente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Recaudación Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalRecaudado.toLocaleString('es-CO')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Valor total de casos cerrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Tasa de Éxito</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((casosCobrados / casosCerrados.length) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              De los casos cerrados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por número de caso o sancionado..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Cases Table */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Casos</CardTitle>
          <CardDescription>
            {filteredCasos.length} caso{filteredCasos.length !== 1 ? 's' : ''} encontrado{filteredCasos.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número de Caso</TableHead>
                  <TableHead>Sancionado</TableHead>
                  <TableHead>Monto Inicial</TableHead>
                  <TableHead>Resultado</TableHead>
                  <TableHead>Fecha de Cierre</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCasos.map((caso) => (
                  <TableRow key={caso.id}>
                    <TableCell className="font-medium">{caso.numero}</TableCell>
                    <TableCell>{caso.solicitante.nombreCompleto}</TableCell>
                    <TableCell>
                      ${caso.monto?.toLocaleString('es-CO') || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge className={estadoColors[caso.estado]}>
                        {caso.estado === 'CERRADA' ? 'Cobrado' : 'Sin Pago'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toLocaleDateString('es-CO')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          Ver
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Export Button */}
      <div className="flex justify-end gap-2">
        <Button variant="outline">
          <BarChart3 className="mr-2 h-4 w-4" />
          Generar Reporte
        </Button>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Exportar a Excel
        </Button>
      </div>
    </div>
  )
}
