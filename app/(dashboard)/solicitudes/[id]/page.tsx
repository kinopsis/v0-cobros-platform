"use client"

import { use } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { mockSolicitudes, getUsuarioById, mockLogsAuditoria } from "@/lib/mock-data"
import { 
  ESTADO_LABELS, 
  ESTADO_COLORS, 
  CLASE_PROCESO_LABELS,
  ASUNTO_LABELS,
  TIPO_DOCUMENTO_LABELS,
  TIPO_PERSONA_LABELS,
  PRIORIDAD_LABELS,
  PRIORIDAD_COLORS
} from "@/lib/types"
import { format } from "date-fns"
import { es } from "date-fns/locale"
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
  Scale
} from "lucide-react"

export default function SolicitudDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const solicitud = mockSolicitudes.find(s => s.id === id)
  
  if (!solicitud) {
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

  const abogado = solicitud.abogadoAsignadoId 
    ? getUsuarioById(solicitud.abogadoAsignadoId) 
    : null

  const logs = mockLogsAuditoria.filter(l => l.solicitudId === solicitud.id)

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
              {CLASE_PROCESO_LABELS[solicitud.claseProceso]} - {ASUNTO_LABELS[solicitud.asunto]}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Descargar Comprobante
          </Button>
        </div>
      </div>

      {/* Alerta de devolución */}
      {solicitud.estado === "DEVUELTA" && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Solicitud Devuelta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{solicitud.motivoDevolucion}</p>
            <Button className="mt-4" asChild>
              <Link href={`/solicitudes/${solicitud.id}/corregir`}>
                Corregir y Reenviar
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

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
                  <p className="text-sm text-muted-foreground">Clase de Proceso</p>
                  <Badge variant="outline">{CLASE_PROCESO_LABELS[solicitud.claseProceso]}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Asunto</p>
                  <p className="font-medium">{ASUNTO_LABELS[solicitud.asunto]}</p>
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
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
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
    </div>
  )
}
