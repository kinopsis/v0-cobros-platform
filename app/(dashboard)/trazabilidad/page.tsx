'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, FileText } from 'lucide-react'

const casosTrazabilidad = [
  {
    id: '2024-001245',
    deudor: 'Carlos Rodríguez López',
    valor: '$2.500.000',
    eventos: [
      { fecha: '2024-06-15 14:30', estado: 'Asignado', actor: 'Sistema', descripcion: 'Caso asignado a Juan García (Gestor)' },
      { fecha: '2024-06-14 10:15', estado: 'Radicado', actor: 'Juzgado Administrativo 1', descripcion: 'Solicitud radicada en el sistema' },
    ]
  },
  {
    id: '2024-001244',
    deudor: 'María González Pérez',
    valor: '$1.250.000',
    eventos: [
      { fecha: '2024-06-15 09:00', estado: 'Pago Parcial', actor: 'Deudor', descripcion: 'Se registró abono de $500.000' },
      { fecha: '2024-06-10 16:45', estado: 'En Coactiva', actor: 'Juan García', descripcion: 'Caso escalado a procesos coactivos' },
      { fecha: '2024-06-01 11:30', estado: 'En Gestión', actor: 'María López', descripcion: 'Asignado a abogada para gestión' },
      { fecha: '2024-05-20 14:00', estado: 'Radicado', actor: 'Juzgado Laboral 1', descripcion: 'Solicitud radicada en el sistema' },
    ]
  },
  {
    id: '2024-001243',
    deudor: 'Roberto Martínez García',
    valor: '$5.200.000',
    eventos: [
      { fecha: '2024-06-14 15:20', estado: 'Pagado', actor: 'Deudor', descripcion: 'Caso cerrado - deuda pagada en su totalidad' },
      { fecha: '2024-06-08 10:30', estado: 'En Coactiva', actor: 'Pedro Rodríguez', descripcion: 'Proceso coactivo iniciado' },
      { fecha: '2024-05-25 09:00', estado: 'En Gestión', actor: 'Ana Martínez', descripcion: 'Bajo gestión de abogada' },
      { fecha: '2024-05-15 13:45', estado: 'Radicado', actor: 'Juzgado Administrativo 2', descripcion: 'Solicitud radicada en el sistema' },
    ]
  }
]

export default function TrazabilidadPage() {
  const [busqueda, setBusqueda] = useState('')
  const [casoSeleccionado, setCasoSeleccionado] = useState<string | null>(null)

  const casosFiltrados = casosTrazabilidad.filter(caso =>
    caso.id.includes(busqueda) ||
    caso.deudor.toLowerCase().includes(busqueda.toLowerCase())
  )

  const caso = casoSeleccionado 
    ? casosTrazabilidad.find(c => c.id === casoSeleccionado)
    : null

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Radicado':
        return 'bg-blue-100 text-blue-800'
      case 'En Gestión':
        return 'bg-yellow-100 text-yellow-800'
      case 'En Coactiva':
        return 'bg-orange-100 text-orange-800'
      case 'Pago Parcial':
        return 'bg-purple-100 text-purple-800'
      case 'Pagado':
        return 'bg-green-100 text-green-800'
      case 'Asignado':
        return 'bg-indigo-100 text-indigo-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Trazabilidad de Casos</h1>
        <p className="text-muted-foreground mt-2">Seguimiento completo del histórico de cada caso</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Lista de Casos */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Búsqueda de Casos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar caso o deudor..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {casosFiltrados.map((caso) => (
                  <button
                    key={caso.id}
                    onClick={() => setCasoSeleccionado(caso.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      casoSeleccionado === caso.id
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border hover:bg-secondary'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{caso.id}</p>
                        <p className="text-xs truncate">{caso.deudor}</p>
                        <p className="text-xs font-medium mt-1">{caso.valor}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detalle del Caso */}
        <div className="lg:col-span-2">
          {caso ? (
            <Card>
              <CardHeader>
                <CardTitle>Caso #{caso.id}</CardTitle>
                <CardDescription>
                  {caso.deudor} - {caso.valor}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {caso.eventos.map((evento, index) => (
                    <div key={index} className="flex gap-4">
                      {/* Línea de tiempo */}
                      <div className="flex flex-col items-center">
                        <div className={`h-3 w-3 rounded-full ${getEstadoColor(evento.estado).split(' ')[0].replace('bg-', 'bg-')}`} />
                        {index !== caso.eventos.length - 1 && (
                          <div className="w-0.5 h-12 bg-border mt-2 mb-2" />
                        )}
                      </div>

                      {/* Evento */}
                      <div className="flex-1 pb-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getEstadoColor(evento.estado)}`}>
                            {evento.estado}
                          </span>
                          <span className="text-xs text-muted-foreground">{evento.fecha}</span>
                        </div>
                        <p className="text-sm font-medium">{evento.descripcion}</p>
                        <p className="text-xs text-muted-foreground mt-1">Por: {evento.actor}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t">
                  <Button className="w-full" variant="outline">
                    Ver Documentos del Caso
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                <p className="text-muted-foreground">Selecciona un caso para ver su trazabilidad completa</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
