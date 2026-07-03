"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/auth-context"
import { 
  ESTADO_LABELS, 
  ESTADO_COLORS, 
  EstadoSolicitud,
  Naturaleza,
  Concepto
} from "@/lib/types"

// Labels que coinciden con CHECK constraints de la BD
const CLASE_PROCESO_LABELS: Record<string, string> = {
  ARANCEL: "ARANCEL - ARANCEL",
  INCAPACIDADES: "INCAPACIDAD - INCAPACIDADES",
  MULTA_CAMARA_COMERCIO: "MULTA - CAMARA DE COMERCIO",
  MULTA_CAUCIONES: "MULTA - CAUCIONES",
  MULTA_COMISARIAS_FAMILIA: "MULTA - COMISARIAS DE FAMILIA",
  MULTA_CONVERSION_DEPOSITO_JUDICIAL: "MULTA - CONVERSION DEPOSITO JUDICIAL",
  MULTA_CORRECCIONAL: "MULTA - CORRECCIONAL",
  MULTA_INCIDENTE_DESACATO: "MULTA - INCIDENTE DE DESACATO",
  MULTA_INCUMPLIMIENTO_CONTRACTUAL: "MULTA - INCUMPLIMIENTO CONTRACTUAL",
  MULTA_INDEMNIZACION_CAUCIONES: "MULTA - INDEMNIZACION POR CAUCIONES",
  MULTA_JUECES_PAZ: "MULTA - JUECES DE PAZ",
  MULTA_JURAMENTO_ESTIMATORIO: "MULTA - JURAMENTO ESTIMATORIO",
  MULTA_JURISDICCION_ADMINISTRATIVA: "MULTA - JURISDICCION ADMINISTRATIVA",
  MULTA_JURISDICCION_CIVIL: "MULTA - JURISDICCION CIVIL",
  MULTA_JURISDICCION_FAMILIA: "MULTA - JURISDICCION FAMILIA",
  MULTA_JURISDICCION_LABORAL: "MULTA - JURISDICCION LABORAL",
}

const ASUNTO_LABELS: Record<string, string> = {
  MULTAS_ADMINISTRATIVAS: "Multas administrativas",
  ARANCEL: "ARANCEL (Obligaciones tributarias)",
  MULTAS: "MULTAS (Incumplimientos contractuales)",
  REINTEGRO: "REINTEGRO (Pagos indebidos, Subsidios)",
  INCAPACIDAD: "INCAPACIDAD",
  POLIZA: "POLIZA",
}
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
  Calendar,
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
  UserPlus,
  Pencil
} from "lucide-react"

interface SolicitudUI {
  id: string
  fechaSolicitud: Date
  radicadoOrigen: string
  naturaleza: Naturaleza
  concepto: Concepto
  estado: EstadoSolicitud
  sancionados: Array<{ nombreCompleto: string; tipoDocumento: string; numeroDocumento: string }>
}

const ESTADO_TABS = [
  { id: "todas", label: "Todas", icon: FileText },
  { id: "pendientes", label: "Pendientes", icon: Clock },
  { id: "radicadas", label: "Radicadas", icon: CheckCircle2 },
  { id: "asignadas", label: "Asignadas", icon: UserPlus },
  { id: "devueltas", label: "Devueltas", icon: XCircle },
]

export default function SolicitudesPage() {
  const { user } = useAuth()
  const [solicitudes, setSolicitudes] = useState<SolicitudUI[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [claseFilter, setClaseFilter] = useState<string>("all")
  const [estadoFilter, setEstadoFilter] = useState<string>("all")
  const [activeTab, setActiveTab] = useState<string>("todas")
  const isGestor = user?.rol === "GESTOR"
  const isJuzgado = user?.rol === "JUZGADO"

  // Cargar solicitudes desde el API
  useEffect(() => {
    async function fetchSolicitudes() {
      try {
        const res = await fetch("/api/solicitudes")
        if (!res.ok) throw new Error("Error al cargar solicitudes")
        const json = await res.json()
        // Mapear snake_case del API a camelCase para la UI
        const mapped = (json.data || []).map((s: any) => ({
          id: s.id,
          fechaSolicitud: new Date(s.fecha_solicitud),
          radicadoOrigen: s.radicado_origen,
          naturaleza: (s.naturaleza || s.clase_proceso) as Naturaleza,
          concepto: (s.concepto || s.asunto) as Concepto,
          estado: s.estado as EstadoSolicitud,
          sancionados: (s.sancionados || []).map((san: any) => ({
            nombreCompleto: san.nombre_completo,
            tipoDocumento: san.tipo_documento,
            numeroDocumento: san.numero_documento,
          })),
        }))
        setSolicitudes(mapped)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchSolicitudes()
  }, [])

  // Contadores por tab
  const pendientesCount = solicitudes.filter(s => s.estado === "EN_VALIDACION").length
  const radicadasCount = solicitudes.filter(s => s.estado === "RADICADA_EN_SIGOBIUS").length
  const asignadasCount = solicitudes.filter(s => s.estado === "ASIGNADA_A_ABOGADO").length
  const devueltasCount = solicitudes.filter(s => s.estado === "DEVUELTA_POR_GESTOR" || s.estado === "DEVUELTA_POR_ABOGADO").length

  const getTabCount = (tabId: string) => {
    switch (tabId) {
      case "pendientes": return pendientesCount
      case "radicadas": return radicadasCount
      case "asignadas": return asignadasCount
      case "devueltas": return devueltasCount
      default: return solicitudes.length
    }
  }

  // Aplicar filtros
  const filteredSolicitudes = solicitudes.filter(s => {
    const matchesSearch = 
      s.radicadoOrigen.includes(searchQuery) ||
      s.sancionados.some(san => 
        san.nombreCompleto.toLowerCase().includes(searchQuery.toLowerCase()) ||
        san.numeroDocumento.includes(searchQuery)
      )
    
    const matchesClase = claseFilter === "all" || s.naturaleza === claseFilter
    const matchesEstado = estadoFilter === "all" || s.estado === estadoFilter

    // Filtro por tab (solo para GESTOR)
    let matchesTab = true
    if (isGestor && activeTab !== "todas") {
      switch (activeTab) {
        case "pendientes":
          matchesTab = s.estado === "EN_VALIDACION"
          break
        case "radicadas":
          matchesTab = s.estado === "RADICADA_EN_SIGOBIUS"
          break
        case "asignadas":
          matchesTab = s.estado === "ASIGNADA_A_ABOGADO"
          break
        case "devueltas":
          matchesTab = s.estado === "DEVUELTA_POR_GESTOR" || s.estado === "DEVUELTA_POR_ABOGADO"
          break
      }
    }

    return matchesSearch && matchesClase && matchesEstado && matchesTab
  })

  const canCreateNew = user?.rol === "JUZGADO"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isGestor
              ? "Bandeja de Entrada"
              : user?.rol === "JUZGADO"
                ? "Mis Solicitudes"
                : "Todas las Solicitudes"
            }
          </h1>
          <p className="text-muted-foreground">
            {isGestor
              ? "Validación, radicación y asignación de solicitudes"
              : user?.rol === "JUZGADO" 
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

      {/* Contadores rápidos + Tabs (solo GESTOR) */}
      {isGestor && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {ESTADO_TABS.filter(t => t.id !== "todas").map((tab) => (
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
                  <div className="text-lg sm:text-2xl font-bold break-words">{getTabCount(tab.id)}</div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="-mx-1 px-1 pb-1">
            <TabsList className="grid w-full grid-cols-5 min-w-[400px]">
              {ESTADO_TABS.map((tab) => (
                <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                  <tab.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <Badge variant="secondary" className="ml-1">
                    {getTabCount(tab.id)}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>
            </div>
          </Tabs>
        </div>
      )}

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
                placeholder="Buscar por radicado, nombre o cédula del sancionado..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={claseFilter} onValueChange={setClaseFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Clase de proceso" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las clases</SelectItem>
                {Object.entries(CLASE_PROCESO_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={estadoFilter} onValueChange={setEstadoFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="EN_VALIDACION">En Validación</SelectItem>
                <SelectItem value="DEVUELTA_POR_GESTOR">Devuelta por Gestor</SelectItem>
                <SelectItem value="DEVUELTA_POR_ABOGADO">Devuelta por Abogado</SelectItem>
                <SelectItem value="RADICADA_EN_SIGOBIUS">Radicada en SIGOBIUS</SelectItem>
                <SelectItem value="ASIGNADA_A_ABOGADO">Asignada a Abogado</SelectItem>
                <SelectItem value="RADICADA_EN_GCC">Radicada en GCC</SelectItem>
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
          {loading ? (
            <div className="flex items-center justify-center h-24">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Radicado</TableHead>
                  <TableHead>Fecha de Radicación</TableHead>
                  <TableHead>Asunto</TableHead>
                  <TableHead>Sancionado</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSolicitudes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No se encontraron solicitudes.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSolicitudes.map((solicitud) => (
                    <TableRow key={solicitud.id}>
                        <TableCell className="font-mono font-medium">
                          <Link 
                            href={`/solicitudes/${solicitud.id}`}
                            className="hover:underline text-primary"
                          >
                            {solicitud.radicadoOrigen}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {format(solicitud.fechaSolicitud, "d MMM yyyy", { locale: es })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <Badge variant="outline" className="w-fit">
                              {CLASE_PROCESO_LABELS[solicitud.naturaleza] || solicitud.naturaleza}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {ASUNTO_LABELS[solicitud.concepto] || solicitud.concepto}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {solicitud.sancionados.length > 0 ? (
                            <div className="text-sm">
                              <div className="font-medium truncate max-w-[120px] sm:max-w-[180px]">
                                {solicitud.sancionados[0].nombreCompleto}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {solicitud.sancionados[0].tipoDocumento === "CC" ? "CC" : solicitud.sancionados[0].tipoDocumento} {solicitud.sancionados[0].numeroDocumento}
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Sin sancionados</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-xs ${ESTADO_COLORS[solicitud.estado]}`}>
                            {ESTADO_LABELS[solicitud.estado]}
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
                                <Link href={`/solicitudes/${solicitud.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Ver detalle
                                </Link>
                              </DropdownMenuItem>
                              {solicitud.estado === "BORRADOR" && (
                                <DropdownMenuItem asChild>
                                  <Link href={`/solicitudes/nueva?edit=${solicitud.id}`}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Editar borrador
                                  </Link>
                                </DropdownMenuItem>
                              )}
                              {isJuzgado && (solicitud.estado === "DEVUELTA_POR_GESTOR" || solicitud.estado === "DEVUELTA_POR_ABOGADO") && (
                                <DropdownMenuItem asChild>
                                  <Link href={`/solicitudes/nueva?edit=${solicitud.id}&corregir=1`}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Editar y Corregir
                                  </Link>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => window.print()}>
                                <Download className="mr-2 h-4 w-4" />
                                Descargar comprobante
                              </DropdownMenuItem>
                              {isGestor && solicitud.estado === "EN_VALIDACION" && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem asChild>
                                    <Link href={`/solicitudes/${solicitud.id}?action=aprobar`}>
                                      <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                                      Aprobar y Radicar
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <Link href={`/solicitudes/${solicitud.id}?action=devolver`}>
                                      <XCircle className="mr-2 h-4 w-4 text-red-600" />
                                      Devolver
                                    </Link>
                                  </DropdownMenuItem>
                                </>
                              )}
                              {isGestor && solicitud.estado === "RADICADA_EN_SIGOBIUS" && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem asChild>
                                    <Link href={`/solicitudes/${solicitud.id}?action=asignar`}>
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}
