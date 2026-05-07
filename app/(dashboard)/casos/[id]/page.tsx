"use client"

import { use, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { mockSolicitudes, mockLogsAuditoria } from "@/lib/mock-data"
import { 
  ESTADO_LABELS, 
  ESTADO_COLORS, 
  CLASE_PROCESO_LABELS,
  ASUNTO_LABELS,
  TIPO_DOCUMENTO_LABELS,
  TIPO_PERSONA_LABELS,
  PRIORIDAD_LABELS,
  PRIORIDAD_COLORS,
  EstadoSolicitud
} from "@/lib/types"
import { format, differenceInDays } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"
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
  RefreshCw,
  Loader2,
  Upload,
  Gavel,
  ShieldAlert,
  FileCheck,
  Plus
} from "lucide-react"
import { EtapaPreliminarForm } from "@/components/casos/etapa-preliminar-form"
import { mockUsuarios } from "@/lib/mock-data"

const ESTADOS_ABOGADO: { value: EstadoSolicitud; label: string; icon: React.ElementType }[] = [
  { value: "EN_PROCESO", label: "En Proceso", icon: RefreshCw },
  { value: "MANDAMIENTO_DE_PAGO", label: "Mandamiento de Pago", icon: Gavel },
  { value: "MEDIDAS_CAUTELARES", label: "Medidas Cautelares", icon: ShieldAlert },
  { value: "RADICADO_SISTEMA_JUSTICIA", label: "Radicado Sistema Justicia", icon: FileCheck },
  { value: "CERRADA", label: "Cerrada", icon: CheckCircle2 },
  { value: "TERMINADA_SIN_PAGO", label: "Terminada sin Pago", icon: AlertCircle },
]

export default function CasoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [showActualizarDialog, setShowActualizarDialog] = useState(false)
  const [showCerrarDialog, setShowCerrarDialog] = useState(false)
  const [showEtapaPreliminarDialog, setShowEtapaPreliminarDialog] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [nuevoEstado, setNuevoEstado] = useState<EstadoSolicitud | "">("")
  const [observaciones, setObservaciones] = useState("")
  const [radicadoJudicial, setRadicadoJudicial] = useState("")
  const [resultado, setResultado] = useState("")
  const [montoRecuperado, setMontoRecuperado] = useState("")

  const caso = mockSolicitudes.find(s => s.id === id)
  
  if (!caso) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">Caso no encontrado</h2>
        <p className="text-muted-foreground mb-4">
          El caso {id} no existe o no está asignado a su usuario.
        </p>
        <Button asChild>
          <Link href="/casos">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a mis casos
          </Link>
        </Button>
      </div>
    )
  }

  const logs = mockLogsAuditoria.filter(l => l.solicitudId === caso.id)
  const diasTranscurridos = differenceInDays(new Date(), caso.fechaAsignacion || caso.fechaSolicitud)
  const tieneAlerta = diasTranscurridos > 15
  
  // Lista de abogados para el formulario de etapa preliminar
  const abogadosDisponibles = mockUsuarios
    .filter(u => u.rol === "ABOGADO")
    .map(u => ({ id: u.id, nombre: u.nombre }))

  const handleActualizarEstado = async () => {
    if (!nuevoEstado) {
      toast.error("Debe seleccionar un estado")
      return
    }

    // Validaciones específicas por estado
    if (nuevoEstado === "RADICADO_SISTEMA_JUSTICIA" && !radicadoJudicial) {
      toast.error("Debe ingresar el radicado del sistema de justicia")
      return
    }

    if ((nuevoEstado === "CERRADA" || nuevoEstado === "TERMINADA_SIN_PAGO") && !resultado) {
      toast.error("Debe indicar el resultado del proceso")
      return
    }

    setIsUpdating(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    toast.success(
      <div className="flex flex-col gap-1">
        <span className="font-medium">Estado actualizado</span>
        <span className="text-sm">Nuevo estado: {ESTADO_LABELS[nuevoEstado]}</span>
      </div>
    )
    
    setIsUpdating(false)
    setShowActualizarDialog(false)
    setShowCerrarDialog(false)
    router.refresh()
  }

  const isClosed = caso.estado === "CERRADA" || caso.estado === "TERMINADA_SIN_PAGO"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild className="mt-1">
            <Link href="/casos">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">
                {caso.id}
              </h1>
              <Badge className={ESTADO_COLORS[caso.estado]}>
                {ESTADO_LABELS[caso.estado]}
              </Badge>
              <Badge variant="outline" className={PRIORIDAD_COLORS[caso.prioridad]}>
                {PRIORIDAD_LABELS[caso.prioridad]}
              </Badge>
              {tieneAlerta && !isClosed && (
                <Badge variant="destructive">
                  <AlertCircle className="mr-1 h-3 w-3" />
                  {diasTranscurridos} días sin actualización
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground mt-1">
              {CLASE_PROCESO_LABELS[caso.claseProceso]} - {ASUNTO_LABELS[caso.asunto]}
            </p>
          </div>
        </div>
        {!isClosed && (
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => setShowActualizarDialog(true)}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualizar Estado
            </Button>
            <Button onClick={() => {
              setNuevoEstado("CERRADA")
              setShowCerrarDialog(true)
            }}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Cerrar Caso
            </Button>
          </div>
        )}
      </div>

      {/* Resultado si está cerrado */}
      {isClosed && caso.resultado && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="h-5 w-5" />
              Caso Cerrado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-4">
              <span className="text-sm text-green-700">Resultado:</span>
              <span className="font-medium">{caso.resultado}</span>
            </div>
            {caso.montoRecuperado && (
              <div className="flex items-center gap-4">
                <span className="text-sm text-green-700">Monto recuperado:</span>
                <span className="font-medium">${caso.montoRecuperado.toLocaleString('es-CO')}</span>
              </div>
            )}
            {caso.fechaCierre && (
              <div className="flex items-center gap-4">
                <span className="text-sm text-green-700">Fecha de cierre:</span>
                <span className="font-medium">{format(caso.fechaCierre, "d 'de' MMMM 'de' yyyy", { locale: es })}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Información principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Datos del proceso */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5 text-primary" />
                  Datos del Proceso
                </CardTitle>
                {!isClosed && (
                  <Button 
                    size="sm" 
                    onClick={() => setShowEtapaPreliminarDialog(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Etapa
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Radicado de Origen</p>
                  <p className="font-mono font-medium">{caso.radicadoOrigen}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Radicado SIGOBIUS</p>
                  <p className="font-mono font-medium">{caso.radicadoSIGOBIUS}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Clase de Proceso</p>
                  <Badge variant="outline">{CLASE_PROCESO_LABELS[caso.claseProceso]}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Asunto</p>
                  <p className="font-medium">{ASUNTO_LABELS[caso.asunto]}</p>
                </div>
                {caso.radicadoSistemaJusticia && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-muted-foreground">Radicado Sistema Justicia</p>
                    <p className="font-mono font-medium">{caso.radicadoSistemaJusticia}</p>
                  </div>
                )}
              </div>
              {caso.descripcionProceso && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Descripción</p>
                  <p className="text-sm bg-muted/50 p-3 rounded-md">
                    {caso.descripcionProceso}
                  </p>
                </div>
              )}

              {/* Etapa Preliminar (si existe) */}
              {caso.etapaPreliminar && (
                <>
                  <Separator className="my-4" />
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                      <Scale className="h-4 w-4" />
                      Etapa Preliminar
                    </h4>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Trámite</p>
                        <p className="font-medium">{caso.etapaPreliminar.tramite || "-"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Concepto</p>
                        <p className="font-medium">{caso.etapaPreliminar.concepto || "-"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Naturaleza</p>
                        <p className="font-medium">{caso.etapaPreliminar.naturaleza || "-"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Competencia</p>
                        <p className="font-medium">{caso.etapaPreliminar.competencia || "-"}</p>
                      </div>
                      {caso.etapaPreliminar.cantidad && (
                        <div className="md:col-span-2">
                          <p className="text-sm text-muted-foreground">Cantidad</p>
                          <p className="font-medium">
                            {caso.etapaPreliminar.cantidad} ({caso.etapaPreliminar.tipo})
                          </p>
                        </div>
                      )}
                      {caso.etapaPreliminar.obligacion && (
                        <div className="md:col-span-2">
                          <p className="text-sm text-muted-foreground">Obligación</p>
                          <p className="font-medium">{caso.etapaPreliminar.obligacion}</p>
                        </div>
                      )}
                    </div>
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
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {caso.sancionados.map((sancionado) => (
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
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Documentos
                </CardTitle>
                {!isClosed && (
                  <Button variant="outline" size="sm">
                    <Upload className="mr-2 h-4 w-4" />
                    Adjuntar
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {caso.documentosAdjuntos.map((doc) => (
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
                Juzgado Remitente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="font-medium">{caso.nombreJuzgado}</p>
                <p className="text-muted-foreground text-xs">{caso.funcionarioRemitente}</p>
              </div>
              <Separator />
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs">{caso.correoInstitucional}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs">{caso.telefonoDespacho}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs">{caso.ciudadDespacho}</span>
              </div>
            </CardContent>
          </Card>

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
                <span className="text-muted-foreground">Solicitud</span>
                <span>{format(caso.fechaSolicitud, "d MMM yyyy", { locale: es })}</span>
              </div>
              {caso.fechaRadicacion && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Radicación</span>
                  <span>{format(caso.fechaRadicacion, "d MMM yyyy", { locale: es })}</span>
                </div>
              )}
              {caso.fechaAsignacion && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Asignación</span>
                  <span>{format(caso.fechaAsignacion, "d MMM yyyy", { locale: es })}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Días en gestión</span>
                <Badge variant={tieneAlerta ? "destructive" : "outline"}>
                  {diasTranscurridos} días
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Historial */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <History className="h-4 w-4 text-primary" />
                Historial de Actuaciones
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
                      {log.estadoNuevo && (
                        <Badge className={`mt-1 text-xs ${ESTADO_COLORS[log.estadoNuevo]}`}>
                          {ESTADO_LABELS[log.estadoNuevo]}
                        </Badge>
                      )}
                      {log.observaciones && (
                        <p className="text-xs text-muted-foreground mt-1">{log.observaciones}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog actualizar estado */}
      <Dialog open={showActualizarDialog} onOpenChange={setShowActualizarDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-primary" />
              Actualizar Estado del Caso
            </DialogTitle>
            <DialogDescription>
              Seleccione el nuevo estado y agregue observaciones si es necesario.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nuevo Estado</Label>
              <Select value={nuevoEstado} onValueChange={(v) => setNuevoEstado(v as EstadoSolicitud)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione..." />
                </SelectTrigger>
                <SelectContent>
                  {ESTADOS_ABOGADO.filter(e => e.value !== "CERRADA" && e.value !== "TERMINADA_SIN_PAGO").map((estado) => (
                    <SelectItem key={estado.value} value={estado.value}>
                      <div className="flex items-center gap-2">
                        <estado.icon className="h-4 w-4" />
                        {estado.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {nuevoEstado === "RADICADO_SISTEMA_JUSTICIA" && (
              <div className="space-y-2">
                <Label>Radicado Sistema de Justicia *</Label>
                <Input
                  placeholder="23 dígitos"
                  value={radicadoJudicial}
                  onChange={(e) => setRadicadoJudicial(e.target.value)}
                  maxLength={23}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Textarea
                placeholder="Describa la actuación realizada..."
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActualizarDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleActualizarEstado} disabled={isUpdating || !nuevoEstado}>
              {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              Actualizar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog cerrar caso */}
      <Dialog open={showCerrarDialog} onOpenChange={setShowCerrarDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Cerrar Caso
            </DialogTitle>
            <DialogDescription>
              Registre el resultado final del proceso de cobro coactivo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tipo de Cierre</Label>
              <Select value={nuevoEstado} onValueChange={(v) => setNuevoEstado(v as EstadoSolicitud)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CERRADA">Cerrada (Exitoso)</SelectItem>
                  <SelectItem value="TERMINADA_SIN_PAGO">Terminada sin Pago</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Resultado *</Label>
              <Select value={resultado} onValueChange={setResultado}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pago efectuado">Pago efectuado</SelectItem>
                  <SelectItem value="Acuerdo de pago cumplido">Acuerdo de pago cumplido</SelectItem>
                  <SelectItem value="Embargo ejecutado">Embargo ejecutado</SelectItem>
                  <SelectItem value="Prescripción">Prescripción</SelectItem>
                  <SelectItem value="Insolvencia comprobada">Insolvencia comprobada</SelectItem>
                  <SelectItem value="Otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {nuevoEstado === "CERRADA" && (
              <div className="space-y-2">
                <Label>Monto Recuperado (COP)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={montoRecuperado}
                  onChange={(e) => setMontoRecuperado(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Observaciones Finales</Label>
              <Textarea
                placeholder="Observaciones sobre el cierre del caso..."
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCerrarDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleActualizarEstado} disabled={isUpdating || !resultado}>
              {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              Confirmar Cierre
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Etapa Preliminar */}
      <EtapaPreliminarForm
        open={showEtapaPreliminarDialog}
        onOpenChange={setShowEtapaPreliminarDialog}
        casoId={caso.id}
        abogados={abogadosDisponibles}
      />
    </div>
  )
}
