"use client"

import { use, useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { 
  ESTADO_LABELS, 
  ESTADO_COLORS, 
  CLASE_PROCESO_LABELS,
  ASUNTO_LABELS,
  TIPO_DOCUMENTO_LABELS,
  TIPO_PERSONA_LABELS,
  PRIORIDAD_LABELS,
  PRIORIDAD_COLORS,
  DISPONIBILIDAD_COLORS,
  DISPONIBILIDAD_LABELS,
  EstadoSolicitud
} from "@/lib/types"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"
import { DocumentViewerDialog } from "@/components/pdf-viewer/document-viewer-dialog"
import { 
  ArrowLeft, 
  Building2, 
  FileText, 
  User, 
  Clock,
  Download,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  Scale,
  UserPlus,
  Loader2,
  Sparkles
} from "lucide-react"

// Tipo para la solicitud mapeada desde la API
interface SolicitudData {
  id: string
  fechaSolicitud: Date
  nombreJuzgado: string
  funcionarioRemitente: string
  correoInstitucional: string
  telefonoDespacho: string
  ciudadDespacho: string
  radicadoOrigen: string
  claseProceso: string
  asunto: string
  juzgadoConocimiento: string
  descripcionProceso: string | null
  sancionados: Array<{ id: number; nombreCompleto: string; tipoDocumento: string; numeroDocumento: string; tipoPersona: string }>
  documentosAdjuntos: Array<{ id: number; nombre: string; tipo: string; url: string; fechaCarga: Date; esObligatorio: boolean }>
  estado: EstadoSolicitud
  radicadoSIGOBIUS: string | null
  abogadoAsignadoId: string | null
  abogadoAsignado: { id: string; nombre: string; email: string } | null
  fechaRadicacion: Date | null
  fechaAsignacion: Date | null
  prioridad: string
  diasSLA: number
  motivoDevolucion: string | null
}

// Tipo para abogados desde la API
interface AbogadoData {
  id: string
  nombre: string
  email: string
  especialidades: string[]
  capacidadMaxima: number
  disponibilidad: string
  casosActivos: number
  casosAsignados: number
  cargaPorcentaje: number
}

function mapSolicitudFromAPI(apiData: any): SolicitudData {
  return {
    id: apiData.id,
    fechaSolicitud: new Date(apiData.fecha_solicitud),
    nombreJuzgado: apiData.nombre_juzgado || "",
    funcionarioRemitente: apiData.funcionario_remitente || "",
    correoInstitucional: apiData.correo_institucional || "",
    telefonoDespacho: apiData.telefono_despacho || "",
    ciudadDespacho: apiData.ciudad_despacho || "",
    radicadoOrigen: apiData.radicado_origen || "",
    claseProceso: apiData.clase_proceso || "",
    asunto: apiData.asunto || "",
    juzgadoConocimiento: apiData.juzgado_conocimiento || "",
    descripcionProceso: apiData.descripcion_proceso || null,
    sancionados: (apiData.sancionados || []).map((s: any) => ({
      id: s.id,
      nombreCompleto: s.nombre_completo,
      tipoDocumento: s.tipo_documento,
      numeroDocumento: s.numero_documento,
      tipoPersona: s.tipo_persona,
    })),
    documentosAdjuntos: (apiData.documentos_adjuntos || []).map((d: any) => ({
      id: d.id,
      nombre: d.nombre,
      tipo: d.tipo,
      url: d.url,
      fechaCarga: new Date(d.fecha_carga),
      esObligatorio: d.es_obligatorio,
    })),
    estado: apiData.estado as EstadoSolicitud,
    radicadoSIGOBIUS: apiData.radicado_sigobius || null,
    abogadoAsignadoId: apiData.abogado_asignado_id || null,
    abogadoAsignado: apiData.abogado || null,
    fechaRadicacion: apiData.fecha_radicacion ? new Date(apiData.fecha_radicacion) : null,
    fechaAsignacion: apiData.fecha_asignacion ? new Date(apiData.fecha_asignacion) : null,
    prioridad: apiData.prioridad || "MEDIA",
    diasSLA: apiData.dias_sla || 0,
    motivoDevolucion: apiData.motivo_devolucion || null,
  }
}

export default function GestionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  
  // Estados de datos
  const [solicitud, setSolicitud] = useState<SolicitudData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [abogados, setAbogados] = useState<AbogadoData[]>([])
  
  // Estados de UI
  const [isApproving, setIsApproving] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)
  const [showRadicacionDialog, setShowRadicacionDialog] = useState(false)
  const [showDevolucionDialog, setShowDevolucionDialog] = useState(false)
  const [showAsignacionDialog, setShowAsignacionDialog] = useState(false)
  const [motivoDevolucion, setMotivoDevolucion] = useState("")
  const [abogadoSeleccionado, setAbogadoSeleccionado] = useState("")
  const [radicadoSIGOBIUS, setRadicadoSIGOBIUS] = useState("")
  const [radicadoError, setRadicadoError] = useState("")
  const [viewingDoc, setViewingDoc] = useState<{ nombre: string; url: string; tipo?: string } | null>(null)

  // Cargar solicitud desde API
  const fetchSolicitud = useCallback(async () => {
    try {
      setError(null)
      const res = await fetch(`/api/solicitudes/${id}`)
      if (!res.ok) {
        if (res.status === 404) {
          setError("not_found")
        } else if (res.status === 403) {
          setError("forbidden")
        } else {
          const json = await res.json()
          setError(json.error || "Error al cargar la solicitud")
        }
        return
      }
      const json = await res.json()
      setSolicitud(mapSolicitudFromAPI(json.data))
    } catch (err) {
      console.error("Error fetching solicitud:", err)
      setError("Error de conexión al cargar la solicitud")
    } finally {
      setLoading(false)
    }
  }, [id])

  // Cargar abogados desde API
  const fetchAbogados = useCallback(async () => {
    try {
      const res = await fetch("/api/abogados")
      if (res.ok) {
        const json = await res.json()
        const mapped: AbogadoData[] = (json.data || []).map((a: any) => ({
          id: a.id,
          nombre: a.nombre,
          email: a.email,
          especialidades: a.especialidades || [],
          capacidadMaxima: a.capacidad_maxima || 20,
          disponibilidad: a.disponibilidad || "DISPONIBLE",
          casosActivos: a.casos_activos || 0,
          casosAsignados: a.casos_asignados || 0,
          cargaPorcentaje: a.carga_porcentaje || 0,
        }))
        setAbogados(mapped)
      }
    } catch (err) {
      console.error("Error fetching abogados:", err)
    }
  }, [])

  useEffect(() => {
    fetchSolicitud()
    fetchAbogados()
  }, [fetchSolicitud, fetchAbogados])

  // Estado de carga
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Cargando solicitud...</p>
      </div>
    )
  }

  // Estado de error: no encontrada
  if (error === "not_found" || (!loading && !solicitud)) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">Solicitud no encontrada</h2>
        <p className="text-muted-foreground mb-4">
          La solicitud {id} no existe o ha sido eliminada.
        </p>
        <Button asChild>
          <Link href="/gestion">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a gestión
          </Link>
        </Button>
      </div>
    )
  }

  // Estado de error: acceso denegado
  if (error === "forbidden") {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold">Acceso denegado</h2>
        <p className="text-muted-foreground mb-4">
          No tienes permisos para ver esta solicitud.
        </p>
        <Button asChild>
          <Link href="/gestion">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a gestión
          </Link>
        </Button>
      </div>
    )
  }

  // Error genérico
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold">Error</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button asChild>
          <Link href="/gestion">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a gestión
          </Link>
        </Button>
      </div>
    )
  }

  // Si llegamos aquí, solicitud está garantizada
  const s = solicitud!

  // Sugerencia de abogado basada en especialidad y carga
  const abogadoSugerido = abogados
    .filter(a => a.especialidades?.includes(s.claseProceso))
    .sort((a, b) => (a.casosActivos || 0) - (b.casosActivos || 0))[0]

  const handleAprobar = () => {
    setRadicadoSIGOBIUS("")
    setRadicadoError("")
    setShowRadicacionDialog(true)
  }

  const handleConfirmarRadicacion = async () => {
    if (!radicadoSIGOBIUS.trim()) {
      setRadicadoError("Debe ingresar el radicado SIGOBIUS")
      return
    }
    setIsApproving(true)
    try {
      const res = await fetch(`/api/solicitudes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estado: "RADICADA_EN_SIGOBIUS",
          radicado_sigobius: radicadoSIGOBIUS.trim(),
        }),
      })
      if (!res.ok) {
        const json = await res.json()
        toast.error(json.error || "Error al radicar la solicitud")
        setIsApproving(false)
        return
      }
      toast.success(
        <div className="flex flex-col gap-1">
          <span className="font-medium">Solicitud aprobada y radicada</span>
          <span className="text-sm">Radicado SIGOBIUS: {radicadoSIGOBIUS.trim()}</span>
        </div>
      )
      setIsApproving(false)
      setShowRadicacionDialog(false)
      // Recargar datos
      await fetchSolicitud()
      // Mostrar diálogo de asignación
      setShowAsignacionDialog(true)
    } catch (err) {
      toast.error("Error de conexión al radicar")
      setIsApproving(false)
    }
  }

  const handleDevolver = async () => {
    if (!motivoDevolucion.trim()) {
      toast.error("Debe indicar el motivo de devolución")
      return
    }
    try {
      const res = await fetch(`/api/solicitudes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estado: "DEVUELTA_POR_GESTOR",
          motivo_devolucion: motivoDevolucion.trim(),
        }),
      })
      if (!res.ok) {
        const json = await res.json()
        toast.error(json.error || "Error al devolver la solicitud")
        return
      }
      toast.success("Solicitud devuelta al juzgado")
      setShowDevolucionDialog(false)
      router.push("/gestion")
    } catch (err) {
      toast.error("Error de conexión al devolver")
    }
  }

  const handleAsignar = async () => {
    if (!abogadoSeleccionado) {
      toast.error("Debe seleccionar un abogado")
      return
    }
    setIsAssigning(true)
    try {
      const res = await fetch(`/api/solicitudes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estado: "ASIGNADA_A_ABOGADO",
          abogado_asignado_id: abogadoSeleccionado,
        }),
      })
      if (!res.ok) {
        const json = await res.json()
        toast.error(json.error || "Error al asignar el abogado")
        setIsAssigning(false)
        return
      }
      const abogado = abogados.find(a => a.id === abogadoSeleccionado)
      toast.success(
        <div className="flex flex-col gap-1">
          <span className="font-medium">Caso asignado exitosamente</span>
          <span className="text-sm">Abogado: {abogado?.nombre}</span>
        </div>
      )
      setIsAssigning(false)
      setShowAsignacionDialog(false)
      router.push("/gestion")
    } catch (err) {
      toast.error("Error de conexión al asignar")
      setIsAssigning(false)
    }
  }

  const canValidate = s.estado === "EN_VALIDACION"
  const canAssign = s.estado === "RADICADA_EN_SIGOBIUS"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild className="mt-1">
            <Link href="/gestion">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">
                {s.id}
              </h1>
              <Badge className={ESTADO_COLORS[s.estado]}>
                {ESTADO_LABELS[s.estado]}
              </Badge>
              <Badge variant="outline" className={PRIORIDAD_COLORS[s.prioridad]}>
                {PRIORIDAD_LABELS[s.prioridad]}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              {CLASE_PROCESO_LABELS[s.claseProceso as keyof typeof CLASE_PROCESO_LABELS] || s.claseProceso} - {ASUNTO_LABELS[s.asunto as keyof typeof ASUNTO_LABELS] || s.asunto}
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {canValidate && (
            <>
              <Button 
                variant="outline" 
                className="text-destructive hover:text-destructive"
                onClick={() => setShowDevolucionDialog(true)}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Devolver
              </Button>
              <Button onClick={handleAprobar} disabled={isApproving}>
                {isApproving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                )}
                Aprobar y Radicar
              </Button>
            </>
          )}
          {canAssign && (
            <Button onClick={() => setShowAsignacionDialog(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Asignar Abogado
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Información principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Datos del proceso */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-primary" />
                Datos del Proceso
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Radicado de Origen</p>
                  <p className="font-mono font-medium">{s.radicadoOrigen}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Radicado SIGOBIUS</p>
                  <p className="font-mono font-medium">
                    {s.radicadoSIGOBIUS || <span className="text-muted-foreground">Pendiente</span>}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Clase de Proceso</p>
                  <Badge variant="outline">{CLASE_PROCESO_LABELS[s.claseProceso as keyof typeof CLASE_PROCESO_LABELS] || s.claseProceso}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Asunto</p>
                  <p className="font-medium">{ASUNTO_LABELS[s.asunto as keyof typeof ASUNTO_LABELS] || s.asunto}</p>
                </div>
              </div>
              {s.descripcionProceso && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Descripción</p>
                  <p className="text-sm bg-muted/50 p-3 rounded-md">
                    {s.descripcionProceso}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sancionados */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Sancionados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {s.sancionados.map((sancionado) => (
                  <div key={sancionado.id} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{sancionado.nombreCompleto}</p>
                        <p className="text-sm text-muted-foreground">
                          {TIPO_DOCUMENTO_LABELS[sancionado.tipoDocumento as keyof typeof TIPO_DOCUMENTO_LABELS] || sancionado.tipoDocumento}: {sancionado.numeroDocumento}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {TIPO_PERSONA_LABELS[sancionado.tipoPersona as keyof typeof TIPO_PERSONA_LABELS] || sancionado.tipoPersona}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Documentos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Documentos Adjuntos
              </CardTitle>
              <CardDescription>
                Verifique que los documentos estén completos y legibles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {s.documentosAdjuntos.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-destructive" />
                      <div>
                        <p className="text-sm font-medium">{doc.nombre}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(doc.fechaCarga, "d MMM yyyy", { locale: es })}
                          {doc.esObligatorio && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              Obligatorio
                            </Badge>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="sm" onClick={() => setViewingDoc({ nombre: doc.nombre, url: doc.url, tipo: doc.tipo })}>
                        Ver
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <a href={doc.url} download={doc.nombre} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panel lateral */}
        <div className="space-y-6">
          {/* Despacho remitente */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                Despacho Remitente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">Nombre</p>
                <p className="font-medium">{s.nombreJuzgado}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Funcionario</p>
                <p className="font-medium">{s.funcionarioRemitente}</p>
              </div>
              <Separator />
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs">{s.correoInstitucional}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs">{s.telefonoDespacho}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs">{s.ciudadDespacho}</span>
              </div>
            </CardContent>
          </Card>

          {/* Sugerencia de abogado */}
          {(canValidate || canAssign) && abogadoSugerido && (
            <Card className="border-primary/50 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Sugerencia de Asignación
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{abogadoSugerido.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      Especialidad en {CLASE_PROCESO_LABELS[s.claseProceso as keyof typeof CLASE_PROCESO_LABELS] || s.claseProceso}
                    </p>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Carga actual</span>
                    <span>{abogadoSugerido.casosActivos} / {abogadoSugerido.capacidadMaxima}</span>
                  </div>
                  <Progress 
                    value={abogadoSugerido.cargaPorcentaje} 
                    className="h-2" 
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Fechas */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Tiempos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Recepción</span>
                <span>{format(s.fechaSolicitud, "d MMM yyyy", { locale: es })}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">SLA Restante</span>
                <Badge variant={s.diasSLA <= 3 ? "destructive" : "outline"}>
                  {s.diasSLA} días
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <DocumentViewerDialog
        open={!!viewingDoc}
        onOpenChange={(o) => !o && setViewingDoc(null)}
        document={viewingDoc}
      />

      {/* Dialog de radicación manual SIGOBIUS */}
      <Dialog open={showRadicacionDialog} onOpenChange={(open) => {
        if (!isApproving) setShowRadicacionDialog(open)
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Aprobar y Radicar en SIGOBIUS
            </DialogTitle>
            <DialogDescription>
              Ingrese el número de radicado asignado en SIGOBIUS para esta solicitud. Este número debe ser generado directamente en el sistema SIGOBIUS antes de continuar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-md bg-muted/60 border px-4 py-3 text-sm space-y-1">
              <p className="text-muted-foreground">Solicitud</p>
              <p className="font-mono font-medium">{s.id}</p>
              <p className="text-muted-foreground mt-2">Radicado de origen</p>
              <p className="font-mono font-medium">{s.radicadoOrigen}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="radicado-sigobius">
                Radicado SIGOBIUS <span className="text-destructive">*</span>
              </Label>
              <Input
                id="radicado-sigobius"
                placeholder="Ej: EXT-DESAJ-ME25-00042"
                value={radicadoSIGOBIUS}
                onChange={(e) => {
                  setRadicadoSIGOBIUS(e.target.value)
                  if (radicadoError) setRadicadoError("")
                }}
                className={radicadoError ? "border-destructive focus-visible:ring-destructive" : ""}
                autoFocus
              />
              {radicadoError && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {radicadoError}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                La integración automática con SIGOBIUS estará disponible en una próxima versión.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRadicacionDialog(false)}
              disabled={isApproving}
            >
              Cancelar
            </Button>
            <Button onClick={handleConfirmarRadicacion} disabled={isApproving}>
              {isApproving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              Aprobar y Radicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de devolución */}
      <Dialog open={showDevolucionDialog} onOpenChange={setShowDevolucionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              Devolver Solicitud
            </DialogTitle>
            <DialogDescription>
              Indique el motivo por el cual se devuelve la solicitud al juzgado remitente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo de Devolución *</Label>
              <Textarea
                id="motivo"
                placeholder="Describa las correcciones que debe realizar el juzgado..."
                value={motivoDevolucion}
                onChange={(e) => setMotivoDevolucion(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDevolucionDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDevolver}>
              Confirmar Devolución
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de asignación */}
      <Dialog open={showAsignacionDialog} onOpenChange={setShowAsignacionDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Asignar Abogado
            </DialogTitle>
            <DialogDescription>
              Seleccione el abogado que gestionará este caso de {CLASE_PROCESO_LABELS[s.claseProceso as keyof typeof CLASE_PROCESO_LABELS] || s.claseProceso}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Abogado</Label>
              <Select value={abogadoSeleccionado} onValueChange={setAbogadoSeleccionado}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un abogado..." />
                </SelectTrigger>
                <SelectContent>
                  {abogados.map((abogado) => {
                    const tieneEspecialidad = abogado.especialidades?.includes(s.claseProceso)
                    return (
                      <SelectItem key={abogado.id} value={abogado.id}>
                        <div className="flex items-center gap-2">
                          <span>{abogado.nombre}</span>
                          {tieneEspecialidad && (
                            <Badge variant="secondary" className="text-xs">
                              Especialista
                            </Badge>
                          )}
                          <Badge variant="outline" className={`text-xs ${DISPONIBILIDAD_COLORS[abogado.disponibilidad as keyof typeof DISPONIBILIDAD_COLORS] || ''}`}>
                            {abogado.cargaPorcentaje}% carga
                          </Badge>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Tabla de carga de abogados */}
            <div className="rounded-md border">
              <div className="p-3 bg-muted/50">
                <p className="text-sm font-medium">Distribución de Carga</p>
              </div>
              <div className="divide-y">
                {abogados.map((abogado) => {
                  const tieneEspecialidad = abogado.especialidades?.includes(s.claseProceso)
                  return (
                    <div 
                      key={abogado.id} 
                      className={`p-3 flex items-center justify-between cursor-pointer hover:bg-muted/50 ${abogadoSeleccionado === abogado.id ? 'bg-primary/5' : ''}`}
                      onClick={() => setAbogadoSeleccionado(abogado.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${tieneEspecialidad ? 'bg-primary/10' : 'bg-muted'}`}>
                          <User className={`h-4 w-4 ${tieneEspecialidad ? 'text-primary' : 'text-muted-foreground'}`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium flex items-center gap-2">
                            {abogado.nombre}
                            {tieneEspecialidad && <Sparkles className="h-3 w-3 text-primary" />}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {abogado.especialidades?.map(e => CLASE_PROCESO_LABELS[e as keyof typeof CLASE_PROCESO_LABELS] || e).join(", ")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-4">
                        <div className="text-right shrink-0">
                          <p className="text-sm font-medium">{abogado.casosActivos}/{abogado.capacidadMaxima}</p>
                          <p className="text-xs text-muted-foreground">casos</p>
                        </div>
                        <div className="w-16 sm:w-20 shrink-0">
                          <Progress value={abogado.cargaPorcentaje} className="h-2" />
                        </div>
                        <Badge className={`${DISPONIBILIDAD_COLORS[abogado.disponibilidad as keyof typeof DISPONIBILIDAD_COLORS] || ''} shrink-0`}>
                          {DISPONIBILIDAD_LABELS[abogado.disponibilidad as keyof typeof DISPONIBILIDAD_LABELS] || abogado.disponibilidad}
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAsignacionDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAsignar} disabled={isAssigning || !abogadoSeleccionado}>
              {isAssigning ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              Confirmar Asignación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
