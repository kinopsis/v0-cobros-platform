"use client"

import { use, useState, useEffect, Suspense } from "react";
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { DocumentViewerDialog } from "@/components/pdf-viewer/document-viewer-dialog"
import { WorkflowDialogs } from "@/components/solicitudes/workflow-dialogs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/lib/auth-context"
import { Solicitud } from "@/lib/types"
import { 
  ESTADO_LABELS, 
  ESTADO_COLORS, 
  NATURALEZA_LABELS,
  CONCEPTO_LABELS,
  CLASE_PROCESO_LABELS,
  ASUNTO_LABELS,
  TIPO_DOCUMENTO_LABELS,
  TIPO_PERSONA_LABELS,
  PRIORIDAD_LABELS,
  PRIORIDAD_COLORS
} from "@/lib/types"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"
import { convertirSancionACOP, formatCOP } from "@/lib/utils"
import { 
  ArrowLeft, 
  Building2, 
  FileText, 
  User, 
  Clock,
  Download,
  History,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Scale,
  Loader2,
  XCircle,
  UserPlus
} from "lucide-react"

function SolicitudDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const actionParam = searchParams.get("action") as "aprobar" | "devolver" | "asignar" | null

  const [viewingDoc, setViewingDoc] = useState<{ nombre: string; url: string; tipo?: string } | null>(null)
  const [solicitud, setSolicitud] = useState<Solicitud | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Estados para flujo de trabajo (GESTOR y ABOGADO)
  const [workflowDialog, setWorkflowDialog] = useState<"aprobar" | "devolver" | "asignar" | "reasignar" | "radicar_gcc" | "devolver_abogado" | null>(actionParam)
  const [abogados, setAbogados] = useState<any[]>([])

  const isGestor = user?.rol === "GESTOR"
  const isAbogado = user?.rol === "ABOGADO"

  useEffect(() => {
    async function fetchSolicitud() {
      try {
        const res = await fetch(`/api/solicitudes/${id}`)
        if (!res.ok) throw new Error("No encontrada")
        const json = await res.json()
        const d = json.data
        // Mapear snake_case a camelCase
        setSolicitud({
          id: d.id,
          fechaSolicitud: new Date(d.fecha_solicitud),
          codigoDespacho: d.codigo_despacho,
          nombreJuzgado: d.nombre_juzgado,
          funcionarioRemitente: d.funcionario_remitente,
          correoInstitucional: d.correo_institucional,
          telefonoDespacho: d.telefono_despacho,
          ciudadDespacho: d.ciudad_despacho,
          radicadoOrigen: d.radicado_origen,
          naturaleza: d.naturaleza || d.clase_proceso,
          concepto: d.concepto || d.asunto,
          juzgadoConocimiento: d.juzgado_conocimiento,
          descripcionProceso: d.descripcion_proceso,
          estado: d.estado,
          radicadoSIGOBIUS: d.radicado_sigobius,
          abogadoAsignadoId: d.abogado_asignado_id,
          abogadoAsignado: d.abogado ? { id: d.abogado.id, nombre: d.abogado.nombre, email: d.abogado.email, rol: "ABOGADO", activo: true } : undefined,
          fechaRadicacion: d.fecha_radicacion ? new Date(d.fecha_radicacion) : undefined,
          fechaAsignacion: d.fecha_asignacion ? new Date(d.fecha_asignacion) : undefined,
          fechaCierre: d.fecha_cierre ? new Date(d.fecha_cierre) : undefined,
          radicadoSistemaJusticia: d.radicado_sistema_justicia,
          observaciones: d.observaciones,
          motivoDevolucion: d.motivo_devolucion,
          prioridad: d.prioridad || "MEDIA",
          diasSLA: d.dias_sla || 10,
          montoRecuperado: d.monto_recuperado,
          sancionados: (d.sancionados || []).map((s: any) => ({
            id: s.id,
            nombreCompleto: s.nombre_completo,
            tipoDocumento: s.tipo_documento,
            numeroDocumento: s.numero_documento,
            tipoPersona: s.tipo_persona,
            tipoSancion: s.tipo_sancion,
            cantidadSancion: s.cantidad_sancion,
          })),
          documentosAdjuntos: (d.documentos_adjuntos || []).map((doc: any) => ({
            id: doc.id,
            nombre: doc.nombre,
            tipo: doc.tipo,
            url: doc.url,
            fechaCarga: new Date(doc.fecha_carga),
            esObligatorio: doc.es_obligatorio || false,
          })),
        })
      } catch (err: any) {
        setError(err.message || "Error al cargar la solicitud")
      } finally {
        setLoading(false)
      }
    }
    fetchSolicitud()
  }, [id])

  const abogado = solicitud?.abogadoAsignado || null
  const [logs, setLogs] = useState<any[]>([])

  useEffect(() => {
    if (solicitud) {
      fetch(`/api/auditoria?solicitud_id=${solicitud.id}`)
        .then(r => r.json())
        .then(j => setLogs(j.data || []))
        .catch(() => setLogs([]))
    }
  }, [solicitud])

  // Cargar abogados para GESTOR
  useEffect(() => {
    if (isGestor) {
      fetch("/api/abogados")
        .then(r => r.json())
        .then(j => setAbogados(j.data || []))
        .catch(() => setAbogados([]))
    }
  }, [isGestor])

  // Descargar comprobante
  const handleDescargarComprobante = () => {
    if (!solicitud) return
    const docs = solicitud.documentosAdjuntos
    if (docs && docs.length > 0) {
      // Usar el primer documento como comprobante
      const doc = docs[0]
      window.open(doc.url, "_blank", "noopener,noreferrer")
    } else {
      toast.info("Sin comprobante", {
        description: "Esta solicitud no tiene documentos adjuntos para descargar como comprobante.",
      })
    }
  }

  // Corregir y reenviar (JUZGADO)
  const handleCorregirYReenviar = async () => {
    if (!solicitud) return
    const nuevoEstado = "EN_VALIDACION"

    try {
      const res = await fetch(`/api/solicitudes/${solicitud.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estado: nuevoEstado,
          motivo_devolucion: null,
          motivo_devolucion_abogado: null,
          observaciones: "Corregido por el juzgado — enviado a validación del gestor",
        }),
      })
      if (!res.ok) throw new Error("Error al reenviar")
      toast.success("Solicitud enviada a validación del gestor")
      router.refresh()
    } catch (err: any) {
      toast.error("Error al reenviar", { description: err.message })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !solicitud) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">Solicitud no encontrada</h2>
        <p className="text-muted-foreground mb-4">
          La solicitud {id} no existe o ha sido eliminada.
        </p>
        <Button asChild>
          <Link href="/solicitudes">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a solicitudes
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild className="mt-1">
            <Link href="/solicitudes">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">
                {solicitud.id}
              </h1>
              <Badge className={ESTADO_COLORS[solicitud.estado]}>
                {ESTADO_LABELS[solicitud.estado]}
              </Badge>
              <Badge variant="outline" className={PRIORIDAD_COLORS[solicitud.prioridad]}>
                {PRIORIDAD_LABELS[solicitud.prioridad]}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              {NATURALEZA_LABELS[solicitud.naturaleza as keyof typeof NATURALEZA_LABELS] || CLASE_PROCESO_LABELS[solicitud.naturaleza as keyof typeof CLASE_PROCESO_LABELS] || solicitud.naturaleza} - {CONCEPTO_LABELS[solicitud.concepto as keyof typeof CONCEPTO_LABELS] || ASUNTO_LABELS[solicitud.concepto as keyof typeof ASUNTO_LABELS] || solicitud.concepto}
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={handleDescargarComprobante}>
            <Download className="mr-2 h-4 w-4" />
            Descargar Comprobante
          </Button>
          {isGestor && solicitud.estado === "EN_VALIDACION" && (
            <>
              <Button 
                variant="outline" 
                className="text-destructive hover:text-destructive"
                onClick={() => setWorkflowDialog("devolver")}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Devolver
              </Button>
              <Button onClick={() => setWorkflowDialog("aprobar")}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Aprobar y Radicar
              </Button>
            </>
          )}
          {isGestor && solicitud.estado === "RADICADA_EN_SIGOBIUS" && (
            <Button onClick={() => setWorkflowDialog("asignar")}>
              <UserPlus className="mr-2 h-4 w-4" />
              Asignar Abogado
            </Button>
          )}
          {isAbogado && solicitud.estado === "ASIGNADA_A_ABOGADO" && (
            <>
              <Button 
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={() => setWorkflowDialog("devolver_abogado")}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Devolver
              </Button>
              <Button onClick={() => setWorkflowDialog("radicar_gcc")}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Radicar en GCC
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Alerta de devolución */}
      {(solicitud.estado === "DEVUELTA_POR_GESTOR" || solicitud.estado === "DEVUELTA_POR_ABOGADO") && (() => {
        const ultimaDevolucion = logs.find(
          (log: any) => log.tipo_accion === "CAMBIO_ESTADO" && (log.estado_nuevo === "DEVUELTA_POR_GESTOR" || log.estado_nuevo === "DEVUELTA_POR_ABOGADO")
        )
        return (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Solicitud Devuelta {solicitud.estado === "DEVUELTA_POR_ABOGADO" ? "por Abogado" : "por Gestor"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{solicitud.motivoDevolucion || "Sin motivo especificado"}</p>
            {ultimaDevolucion && (
              <div className="mt-4 space-y-2 text-sm text-muted-foreground border-t pt-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>Devuelto por: <strong>{ultimaDevolucion.usuario?.nombre || "Gestor"}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Fecha: {format(new Date(ultimaDevolucion.timestamp), "d MMM yyyy HH:mm", { locale: es })}</span>
                </div>
              </div>
            )}
            <Button className="mt-4" onClick={handleCorregirYReenviar}>
                Corregir y Reenviar
            </Button>
          </CardContent>
        </Card>
        )
      })()}

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
                  <p className="font-mono font-medium">{solicitud.radicadoOrigen}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Radicado SIGOBIUS</p>
                  <p className="font-mono font-medium">
                    {solicitud.radicadoSIGOBIUS || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Naturaleza</p>
                  <Badge variant="outline">{NATURALEZA_LABELS[solicitud.naturaleza as keyof typeof NATURALEZA_LABELS] || CLASE_PROCESO_LABELS[solicitud.naturaleza as keyof typeof CLASE_PROCESO_LABELS] || solicitud.naturaleza}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Concepto</p>
                  <p className="font-medium">{CONCEPTO_LABELS[solicitud.concepto as keyof typeof CONCEPTO_LABELS] || ASUNTO_LABELS[solicitud.concepto as keyof typeof ASUNTO_LABELS] || solicitud.concepto}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Juzgado de Conocimiento</p>
                  <p className="font-medium">{solicitud.juzgadoConocimiento}</p>
                </div>
                {solicitud.radicadoSistemaJusticia && (
                  <div>
                    <p className="text-sm text-muted-foreground">Radicado Sistema Justicia</p>
                    <p className="font-mono font-medium">{solicitud.radicadoSistemaJusticia}</p>
                  </div>
                )}
              </div>
              {solicitud.descripcionProceso && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Descripción</p>
                  <p className="text-sm bg-muted/50 p-3 rounded-md">
                    {solicitud.descripcionProceso}
                  </p>
                </div>
              )}

              {/* Fechas del Proceso */}
              {solicitud.etapaPreliminar && (solicitud.etapaPreliminar.providencia || solicitud.etapaPreliminar.ejecutoria) && (
                <>
                  <Separator className="my-4" />
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Fechas del Proceso</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    {solicitud.etapaPreliminar.providencia && (
                      <div>
                        <p className="text-sm text-muted-foreground">Fecha Providencia</p>
                        <p className="font-medium">{format(new Date(solicitud.etapaPreliminar.providencia), "d MMM yyyy", { locale: es })}</p>
                      </div>
                    )}
                    {solicitud.etapaPreliminar.ejecutoria && (
                      <div>
                        <p className="text-sm text-muted-foreground">Fecha Ejecutoria</p>
                        <p className="font-medium">{format(new Date(solicitud.etapaPreliminar.ejecutoria), "d MMM yyyy", { locale: es })}</p>
                      </div>
                    )}
                  </div>
                </>
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
              <CardDescription>
                Personas con obligación económica pendiente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {solicitud.sancionados.map((sancionado, index) => (
                  <div key={sancionado.id} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{sancionado.nombreCompleto}</p>
                        <p className="text-sm text-muted-foreground">
                          {TIPO_DOCUMENTO_LABELS[sancionado.tipoDocumento]}: {sancionado.numeroDocumento}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {TIPO_PERSONA_LABELS[sancionado.tipoPersona]}
                      </Badge>
                    </div>
                    {(sancionado.tipoSancion || sancionado.cantidadSancion) && (
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-xs text-muted-foreground">Valor Sanción</p>
                        <p className="text-sm font-medium">
                          {sancionado.tipoSancion === "SMMLV" && (
                            <span className="text-xs text-muted-foreground mr-1">
                              {sancionado.cantidadSancion} SMMLV →
                            </span>
                          )}
                          {formatCOP(convertirSancionACOP(
                            sancionado.cantidadSancion,
                            sancionado.tipoSancion,
                            solicitud.etapaPreliminar?.ejecutoria
                          ))}
                        </p>
                      </div>
                    )}
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
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {solicitud.documentosAdjuntos.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-destructive" />
                      <div>
                        <p className="text-sm font-medium">{doc.nombre}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(doc.fechaCarga, "d MMM yyyy", { locale: es })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setViewingDoc({ nombre: doc.nombre, url: doc.url, tipo: doc.tipo })}>
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

          {/* Etapa Preliminar */}
          {solicitud.etapaPreliminar && Object.entries(solicitud.etapaPreliminar).filter(([, v]) => v !== null && v !== undefined && v !== "").length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5 text-primary" />
                  Etapa Preliminar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {Object.entries(solicitud.etapaPreliminar)
                    .filter(([, v]) => v !== null && v !== undefined && v !== "")
                    .map(([key, value]) => (
                      <div key={key}>
                        <p className="text-sm text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                        <p className="font-medium">{typeof value === 'boolean' ? (value ? 'Sí' : 'No') : String(value)}</p>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Panel lateral */}
        <div className="space-y-6">
          {/* Despacho remitente — oculto para JUZGADO (es su propio despacho) */}
          {user?.rol !== "JUZGADO" && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                Despacho Remitente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">Código</p>
                <p className="font-medium">{solicitud.codigoDespacho}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Nombre</p>
                <p className="font-medium">{solicitud.nombreJuzgado}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Funcionario</p>
                <p className="font-medium">{solicitud.funcionarioRemitente}</p>
              </div>
              <Separator />
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs">{solicitud.correoInstitucional}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs">{solicitud.telefonoDespacho}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs">{solicitud.ciudadDespacho}</span>
              </div>
            </CardContent>
          </Card>
          )}

          {/* Abogado asignado */}
          {abogado && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  Abogado Asignado
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="font-medium">{abogado.nombre}</p>
                  <p className="text-muted-foreground text-xs">{abogado.email}</p>
                </div>
                {solicitud.fechaAsignacion && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    Asignado el {format(solicitud.fechaAsignacion, "d 'de' MMMM 'de' yyyy", { locale: es })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Fechas importantes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Fechas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Solicitud</span>
                <span>{format(solicitud.fechaSolicitud, "d MMM yyyy", { locale: es })}</span>
              </div>
              {solicitud.fechaRadicacion && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Radicación</span>
                  <span>{format(solicitud.fechaRadicacion, "d MMM yyyy", { locale: es })}</span>
                </div>
              )}
              {solicitud.fechaAsignacion && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Asignación</span>
                  <span>{format(solicitud.fechaAsignacion, "d MMM yyyy", { locale: es })}</span>
                </div>
              )}
              {solicitud.fechaCierre && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cierre</span>
                  <span>{format(solicitud.fechaCierre, "d MMM yyyy", { locale: es })}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">SLA Restante</span>
                <Badge variant={solicitud.diasSLA <= 3 ? "destructive" : "outline"}>
                  {solicitud.diasSLA} días
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Historial */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <History className="h-4 w-4 text-primary" />
                Historial
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {logs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay registros de auditoría
                  </p>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="relative pl-4 pb-4 border-l-2 border-muted last:pb-0">
                      <div className="absolute -left-1.5 top-0 h-3 w-3 rounded-full bg-primary" />
                      <p className="text-xs text-muted-foreground">
                        {format(log.timestamp, "d MMM yyyy HH:mm", { locale: es })}
                      </p>
                      <p className="text-sm font-medium">{log.tipoAccion}</p>
                      {log.observaciones && (
                        <p className="text-xs text-muted-foreground">{log.observaciones}</p>
                      )}
                    </div>
                  ))
                )}
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

      {/* Diálogos de flujo de trabajo (GESTOR y ABOGADO) */}
      {(isGestor || isAbogado) && solicitud && (
        <WorkflowDialogs
          solicitudId={solicitud.id}
          radicadoOrigen={solicitud.radicadoOrigen}
          claseProceso={solicitud.naturaleza}
          estado={solicitud.estado}
          abogados={abogados}
          openDialog={workflowDialog}
          onOpenChange={setWorkflowDialog}
          userRol={user?.rol}
        />
      )}
    </div>
  )
}

export default function SolicitudDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <SolicitudDetailContent params={params} />
    </Suspense>
  )
}
