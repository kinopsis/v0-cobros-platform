'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Search, Filter } from 'lucide-react'

const auditLogs = [
  {
    id: 1,
    timestamp: '2024-06-15 14:30:22',
    usuario: 'Juan García (Gestor 01)',
    accion: 'Asignación de caso',
    entidad: 'Caso #2024-001234',
    descripcion: 'Asignado a abogado María López',
    estado: 'exitoso',
    detalles: 'Caso administrativo transferido con éxito'
  },
  {
    id: 2,
    timestamp: '2024-06-15 13:45:10',
    usuario: 'María López (Abogada)',
    accion: 'Actualización de estado',
    entidad: 'Caso #2024-001233',
    descripcion: 'Estado cambió a "En Coactiva"',
    estado: 'exitoso',
    detalles: 'Proceso de cobro coactivo iniciado'
  },
  {
    id: 3,
    timestamp: '2024-06-15 11:20:55',
    usuario: 'Juzgado Administrativo 1',
    accion: 'Radicación de solicitud',
    entidad: 'Solicitud #2024-000567',
    descripcion: 'Nueva solicitud registrada',
    estado: 'exitoso',
    detalles: 'Deuda de $2.500.000'
  },
  {
    id: 4,
    timestamp: '2024-06-15 10:15:33',
    usuario: 'Pedro Rodríguez (Gestor 02)',
    accion: 'Cambio de asignación',
    entidad: 'Caso #2024-001232',
    descripcion: 'Reassignado a Juan García',
    estado: 'exitoso',
    detalles: 'Cambio de gestor por demanda de trabajo'
  },
  {
    id: 5,
    timestamp: '2024-06-15 09:30:12',
    usuario: 'Admin Sistema',
    accion: 'Backup de datos',
    entidad: 'Base de Datos',
    descripcion: 'Backup automático completado',
    estado: 'exitoso',
    detalles: '2.3 GB respaldados'
  },
  {
    id: 6,
    timestamp: '2024-06-14 16:45:22',
    usuario: 'Ana Martínez (Gestora 03)',
    accion: 'Intento de acceso',
    entidad: 'Caso #2024-001200',
    descripcion: 'Intento de acceso denegado',
    estado: 'fallido',
    detalles: 'Permisos insuficientes'
  }
]

export default function AuditoriaPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [filtroEstado, setFiltroEstado] = useState('todos')

  const logsFiltered = auditLogs.filter(log => {
    const matchSearch = log.usuario.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       log.accion.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       log.entidad.toLowerCase().includes(searchTerm.toLowerCase())
    const matchTipo = filtroTipo === 'todos' || log.accion.includes(filtroTipo)
    const matchEstado = filtroEstado === 'todos' || log.estado === filtroEstado
    
    return matchSearch && matchTipo && matchEstado
  })

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Auditoría del Sistema</h1>
        <p className="text-muted-foreground mt-2">Registro de todas las operaciones y accesos al sistema</p>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[250px]">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar usuario, acción o entidad..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los tipos</SelectItem>
                  <SelectItem value="Radicación">Radicación</SelectItem>
                  <SelectItem value="Asignación">Asignación</SelectItem>
                  <SelectItem value="Actualización">Actualización</SelectItem>
                  <SelectItem value="Acceso">Acceso</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
              <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  <SelectItem value="exitoso">Exitoso</SelectItem>
                  <SelectItem value="fallido">Fallido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Aplicar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Registro de Auditoría ({logsFiltered.length})</CardTitle>
          <CardDescription>Últimas operaciones registradas en el sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold">Fecha y Hora</th>
                  <th className="text-left py-3 px-4 font-semibold">Usuario</th>
                  <th className="text-left py-3 px-4 font-semibold">Acción</th>
                  <th className="text-left py-3 px-4 font-semibold">Entidad</th>
                  <th className="text-left py-3 px-4 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody>
                {logsFiltered.map((log) => (
                  <tr key={log.id} className="border-b hover:bg-secondary/50 transition-colors">
                    <td className="py-3 px-4 text-xs text-muted-foreground">{log.timestamp}</td>
                    <td className="py-3 px-4 font-medium text-sm">{log.usuario}</td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-sm">{log.accion}</p>
                        <p className="text-xs text-muted-foreground">{log.descripcion}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm">{log.entidad}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        log.estado === 'exitoso' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {log.estado === 'exitoso' ? '✓ Exitoso' : '✗ Fallido'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {logsFiltered.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron registros que coincidan con los filtros aplicados
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
