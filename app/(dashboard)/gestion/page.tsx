"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { mockSolicitudes, mockUsuarios } from "@/lib/mock-data"
import { 
  ESTADO_LABELS, 
  ESTADO_COLORS, 
  CLASE_PROCESO_LABELS,
  PRIORIDAD_LABELS,
  PRIORIDAD_COLORS
} from "@/lib/types"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { 
  Search, 
  MoreHorizontal, 
  Eye, 
  CheckCircle2,
  XCircle,
  UserPlus,
  Clock,
  FileText,
  AlertTriangle,
  Calendar,
  ArrowUpRight
} from "lucide-react"

export default function GestionPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("pendientes")

  // Clasificar solicitudes por estado
  const pendientesValidar = mockSolicitudes.filter(
    s => s.estado === "RECIBIDA" || s.estado === "EN_VALIDACION"
  )
  const radicadas = mockSolicitudes.filter(
    s => s.estado === "RADICADA_EN_SIGOBIUS"
  )
  const asignadas = mockSolicitudes.filter(
    s => s.estado === "ASIGNADA_A_ABOGADO" || s.estado === "EN_PROCESO"
  )
  const devueltas = mockSolicitudes.filter(
    s => s.estado === "DEVUELTA"
  )

  // Filtrar según búsqueda
  const filterSolicitudes = (solicitudes: typeof mockSolicitudes) => {
    return solicitudes.filter(s => 
      s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.radicadoOrigen.includes(searchQuery) ||
      s.nombreJuzgado.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.sancionados.some(san => san.nombreCompleto.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  }

  const tabs = [
    { id: "pendientes", label: "Pendientes", count: pendientesValidar.length, icon: Clock },
    { id: "radicadas", label: "Radicadas", count: radicadas.length, icon: FileText },
    { id: "asignadas", label: "Asignadas", count: asignadas.length, icon: CheckCircle2 },
    { id: "devueltas", label: "Devueltas", count: devueltas.length, icon: XCircle },
  ]

  const getCurrentSolicitudes = () => {
    switch (activeTab) {
      case "pendientes":
        return filterSolicitudes(pendientesValidar)
      case "radicadas":
        return filterSolicitudes(radicadas)
      case "asignadas":
        return filterSolicitudes(asignadas)
      case "devueltas":
        return filterSolicitudes(devueltas)
      default:
        return filterSolicitudes(pendientesValidar)
    }
  }

  const currentSolicitudes = getCurrentSolicitudes()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Bandeja de Gestión
          </h1>
          <p className="text-muted-foreground">
            Validación, radicación y asignación de solicitudes
          </p>
        </div>
      </div>

      {/* Contadores rápidos */}
      <div className="grid gap-4 md:grid-cols-4">
        {tabs.map((tab) => (
          <Card 
            key={tab.id} 
            className={`cursor-pointer transition-all hover:border-primary/50 ${activeTab === tab.id ? 'border-primary bg-primary/5' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {tab.label}
              </CardTitle>
              <tab.icon className={`h-4 w-4 ${activeTab === tab.id ? 'text-primary' : 'text-muted-foreground'}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tab.count}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por ID, radicado, juzgado o sancionado..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Tabs con tabla */}
      <Card>
        <CardHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              {tabs.map((tab) => (
                <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                  <tab.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <Badge variant="secondary" className="ml-1">
                    {tab.count}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID / Radicado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Despacho</TableHead>
                  <TableHead>Clase</TableHead>
                  <TableHead>Sancionado</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Prioridad</TableHead>
                  <TableHead>SLA</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentSolicitudes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center">
                      No hay solicitudes en esta categoría.
                    </TableCell>
                  </TableRow>
                ) : (
                  currentSolicitudes.map((solicitud) => (
                    <TableRow key={solicitud.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <Link 
                            href={`/gestion/${solicitud.id}`}
                            className="font-medium hover:underline text-primary"
                          >
                            {solicitud.id}
                          </Link>
                          <p className="text-xs text-muted-foreground font-mono">
                            {solicitud.radicadoOrigen}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {format(solicitud.fechaSolicitud, "d MMM", { locale: es })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[150px] truncate text-sm">
                          {solicitud.nombreJuzgado}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {CLASE_PROCESO_LABELS[solicitud.claseProceso]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[120px] truncate text-sm">
                          {solicitud.sancionados[0]?.nombreCompleto}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${ESTADO_COLORS[solicitud.estado]}`}>
                          {ESTADO_LABELS[solicitud.estado]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${PRIORIDAD_COLORS[solicitud.prioridad]}`}
                        >
                          {PRIORIDAD_LABELS[solicitud.prioridad]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={solicitud.diasSLA <= 3 ? "destructive" : solicitud.diasSLA <= 7 ? "secondary" : "outline"}
                          className="text-xs"
                        >
                          {solicitud.diasSLA}d
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/gestion/${solicitud.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver / Validar
                              </Link>
                            </DropdownMenuItem>
                            {activeTab === "pendientes" && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                  <Link href={`/gestion/${solicitud.id}?action=aprobar`}>
                                    <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                                    Aprobar y Radicar
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href={`/gestion/${solicitud.id}?action=devolver`}>
                                    <XCircle className="mr-2 h-4 w-4 text-red-600" />
                                    Devolver
                                  </Link>
                                </DropdownMenuItem>
                              </>
                            )}
                            {activeTab === "radicadas" && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                  <Link href={`/gestion/${solicitud.id}?action=asignar`}>
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Asignar Abogado
                                  </Link>
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
