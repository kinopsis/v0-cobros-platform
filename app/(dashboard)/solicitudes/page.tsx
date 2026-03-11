"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/auth-context"
import { mockSolicitudes, getUsuarioById } from "@/lib/mock-data"
import { 
  ESTADO_LABELS, 
  ESTADO_COLORS, 
  CLASE_PROCESO_LABELS,
  PRIORIDAD_LABELS,
  PRIORIDAD_COLORS,
  EstadoSolicitud,
  ClaseProceso
} from "@/lib/types"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  Download, 
  FileText,
  Calendar
} from "lucide-react"

export default function SolicitudesPage() {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [estadoFilter, setEstadoFilter] = useState<string>("all")
  const [claseFilter, setClaseFilter] = useState<string>("all")

  // Filtrar solicitudes según el rol del usuario
  let solicitudes = mockSolicitudes
  
  if (user?.rol === "JUZGADO") {
    solicitudes = solicitudes.filter(s => s.codigoDespacho === user.codigoDespacho)
  } else if (user?.rol === "ABOGADO") {
    solicitudes = solicitudes.filter(s => s.abogadoAsignadoId === user.id)
  }

  // Aplicar filtros
  const filteredSolicitudes = solicitudes.filter(s => {
    const matchesSearch = 
      s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.radicadoOrigen.includes(searchQuery) ||
      s.sancionados.some(san => san.nombreCompleto.toLowerCase().includes(searchQuery.toLowerCase())) ||
      s.nombreJuzgado.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesEstado = estadoFilter === "all" || s.estado === estadoFilter
    const matchesClase = claseFilter === "all" || s.claseProceso === claseFilter

    return matchesSearch && matchesEstado && matchesClase
  })

  const canCreateNew = user?.rol === "JUZGADO"

  const ESTADOS_JUZGADO: EstadoSolicitud[] = ["EN_PROCESO", "RADICADA_EN_SIGOBIUS", "DEVUELTA"]

  const estadosDisponibles = user?.rol === "JUZGADO"
    ? Object.entries(ESTADO_LABELS).filter(([value]) =>
        ESTADOS_JUZGADO.includes(value as EstadoSolicitud)
      )
    : Object.entries(ESTADO_LABELS)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {user?.rol === "JUZGADO" ? "Mis Solicitudes" : "Todas las Solicitudes"}
          </h1>
          <p className="text-muted-foreground">
            {user?.rol === "JUZGADO" 
              ? "Solicitudes de cobro coactivo radicadas por su despacho"
              : "Listado completo de solicitudes de cobro coactivo"
            }
          </p>
        </div>
        {canCreateNew && (
          <Button asChild>
            <Link href="/solicitudes/nueva">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Solicitud
            </Link>
          </Button>
        )}
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por ID, radicado, sancionado o juzgado..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={estadoFilter} onValueChange={setEstadoFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {estadosDisponibles.map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={claseFilter} onValueChange={setClaseFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Clase de proceso" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las clases</SelectItem>
                {Object.entries(CLASE_PROCESO_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de solicitudes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Solicitudes
            <Badge variant="secondary" className="ml-2">
              {filteredSolicitudes.length}
            </Badge>
          </CardTitle>
          <CardDescription>
            {filteredSolicitudes.length === 0 
              ? "No se encontraron solicitudes con los filtros aplicados"
              : `Mostrando ${filteredSolicitudes.length} solicitud${filteredSolicitudes.length !== 1 ? 'es' : ''}`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Solicitud</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Clase</TableHead>
                  <TableHead>Sancionado</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Prioridad</TableHead>
                  {user?.rol !== "JUZGADO" && <TableHead>Despacho</TableHead>}
                  {user?.rol !== "JUZGADO" && user?.rol !== "ABOGADO" && <TableHead>Abogado</TableHead>}
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSolicitudes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center">
                      No se encontraron solicitudes.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSolicitudes.map((solicitud) => {
                    const abogado = solicitud.abogadoAsignadoId 
                      ? getUsuarioById(solicitud.abogadoAsignadoId) 
                      : null
                    
                    return (
                      <TableRow key={solicitud.id}>
                        <TableCell className="font-medium">
                          <Link 
                            href={`/solicitudes/${solicitud.id}`}
                            className="hover:underline text-primary"
                          >
                            {solicitud.id}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {format(solicitud.fechaSolicitud, "d MMM yyyy", { locale: es })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {CLASE_PROCESO_LABELS[solicitud.claseProceso]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[150px] truncate">
                            {solicitud.sancionados[0]?.nombreCompleto}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={ESTADO_COLORS[solicitud.estado]}>
                            {ESTADO_LABELS[solicitud.estado]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={PRIORIDAD_COLORS[solicitud.prioridad]}
                          >
                            {PRIORIDAD_LABELS[solicitud.prioridad]}
                          </Badge>
                        </TableCell>
                        {user?.rol !== "JUZGADO" && (
                          <TableCell>
                            <div className="max-w-[120px] truncate text-sm">
                              {solicitud.nombreJuzgado}
                            </div>
                          </TableCell>
                        )}
                        {user?.rol !== "JUZGADO" && user?.rol !== "ABOGADO" && (
                          <TableCell>
                            <div className="text-sm">
                              {abogado?.nombre || "-"}
                            </div>
                          </TableCell>
                        )}
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/solicitudes/${solicitud.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Ver detalle
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Download className="mr-2 h-4 w-4" />
                                Descargar comprobante
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
