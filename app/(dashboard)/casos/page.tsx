"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  CLASE_PROCESO_LABELS,
  PRIORIDAD_LABELS,
  PRIORIDAD_COLORS
} from "@/lib/types"
import { format, differenceInDays } from "date-fns"
import { es } from "date-fns/locale"
import { 
  Search, 
  MoreHorizontal, 
  Eye, 
  Briefcase,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  RefreshCw,
  Loader2
} from "lucide-react"

export default function CasosPage() {
  const { user } = useAuth()
  const [solicitudes, setSolicitudes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("todos")

  // Cargar casos desde API
  useEffect(() => {
    async function fetchCasos() {
      try {
        const res = await fetch("/api/solicitudes")
        if (!res.ok) throw new Error("Error al cargar")
        const json = await res.json()
        setSolicitudes(json.data || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchCasos()
  }, [])

  // Filtrar casos del abogado actual (el API ya filtra por rol ABOGADO)
  const misCasos = solicitudes

  const casosActivos = misCasos.filter(
    (s: any) => s.estado !== "RADICADA_EN_GCC"
  )
  const casosCerrados = misCasos.filter(
    (s: any) => s.estado === "RADICADA_EN_GCC"
  )
  const casosConAlerta = casosActivos.filter((s: any) => {
    const fechaRef = s.fecha_asignacion || s.fecha_solicitud
    if (!fechaRef) return false
    const diasTranscurridos = differenceInDays(new Date(), new Date(fechaRef))
    return diasTranscurridos > 15
  })

  // Filtrar según tab y búsqueda
  const getCasosByTab = () => {
    let casos = misCasos
    switch (activeTab) {
      case "activos":
        casos = casosActivos
        break
      case "cerrados":
        casos = casosCerrados
        break
      case "alertas":
        casos = casosConAlerta
        break
    }
    
    return casos.filter((s: any) => 
      (s.id || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.radicado_origen || "").includes(searchQuery) ||
      (s.nombre_juzgado || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.sancionados || []).some((san: any) => 
        (san.nombre_completo || "").toLowerCase().includes(searchQuery.toLowerCase())
      )
    )
  }

  const filteredCasos = getCasosByTab()

  const tabs = [
    { id: "todos", label: "Todos", count: misCasos.length, icon: Briefcase },
    { id: "activos", label: "Activos", count: casosActivos.length, icon: Clock },
    { id: "cerrados", label: "Cerrados", count: casosCerrados.length, icon: CheckCircle2 },
    { id: "alertas", label: "Alertas", count: casosConAlerta.length, icon: AlertTriangle },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Mis Casos
          </h1>
          <p className="text-muted-foreground">
            Gestión de casos asignados - {user?.nombre}
          </p>
        </div>
      </div>

      {/* Contadores */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
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
              <tab.icon className={`h-4 w-4 ${
                tab.id === "alertas" && tab.count > 0 
                  ? 'text-destructive' 
                  : activeTab === tab.id 
                    ? 'text-primary' 
                    : 'text-muted-foreground'
              }`} />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold break-words">{tab.count}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Búsqueda y Tabs */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
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
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar casos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
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
                  <TableHead>Caso</TableHead>
                  <TableHead>Asignación</TableHead>
                  <TableHead>Clase</TableHead>
                  <TableHead>Sancionado</TableHead>
                  <TableHead>Juzgado</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Días</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCasos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      No hay casos en esta categoría.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCasos.map((caso: any) => {
                    const fechaRef = caso.fecha_asignacion || caso.fecha_solicitud
                    const diasTranscurridos = fechaRef ? differenceInDays(new Date(), new Date(fechaRef)) : 0
                    const tieneAlerta = diasTranscurridos > 15

                    return (
                      <TableRow key={caso.id} className={tieneAlerta ? 'bg-destructive/5' : ''}>
                        <TableCell>
                          <div className="space-y-1">
                            <Link 
                              href={`/casos/${caso.id}`}
                              className="font-medium hover:underline text-primary"
                            >
                              {caso.id}
                            </Link>
                            {caso.radicado_sigobius && (
                              <p className="text-xs text-muted-foreground font-mono">
                                {caso.radicado_sigobius}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {format(new Date(fechaRef), "d MMM", { locale: es })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {CLASE_PROCESO_LABELS[caso.clase_proceso as keyof typeof CLASE_PROCESO_LABELS] || caso.clase_proceso}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[120px] truncate text-sm">
                            {caso.sancionados?.[0]?.nombre_completo || "—"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[120px] truncate text-sm text-muted-foreground">
                            {caso.nombre_juzgado || "—"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-xs ${ESTADO_COLORS[caso.estado as keyof typeof ESTADO_COLORS] || ''}`}>
                            {ESTADO_LABELS[caso.estado as keyof typeof ESTADO_LABELS] || caso.estado}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={tieneAlerta ? "destructive" : "outline"}
                            className="text-xs"
                          >
                            {diasTranscurridos}d
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
                                <Link href={`/casos/${caso.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Ver / Gestionar
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem asChild>
                                <Link href={`/casos/${caso.id}?action=actualizar`}>
                                  <RefreshCw className="mr-2 h-4 w-4" />
                                  Actualizar Estado
                                </Link>
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}
