"use client"

import { use, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
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
import { Progress } from "@/components/ui/progress"
import { mockSolicitudes, mockUsuarios, generateRadicadoSIGOBIUS } from "@/lib/mock-data"
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
  DISPONIBILIDAD_LABELS
} from "@/lib/types"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"
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
  Calendar,
  Phone,
  Mail,
  MapPin,
  Scale,
  UserPlus,
  Loader2,
  Sparkles
} from "lucide-react"

export default function GestionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [isApproving, setIsApproving] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)
  const [showDevolucionDialog, setShowDevolucionDialog] = useState(false)
  const [showAsignacionDialog, setShowAsignacionDialog] = useState(false)
  const [motivoDevolucion, setMotivoDevolucion] = useState("")
  const [abogadoSeleccionado, setAbogadoSeleccionado] = useState("")

  const solicitud = mockSolicitudes.find(s => s.id === id)
  const abogados = mockUsuarios.filter(u => u.rol === "ABOGADO" && u.activo)
  
  if (!solicitud) {
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

  // Sugerencia de abogado basada en especialidad y carga
  const abogadoSugerido = abogados
    .filter(a => a.especialidades?.includes(solicitud.claseProceso))
    .sort((a, b) => (a.casosActivos || 0) - (b.casosActivos || 0))[0]

  const handleAprobar = async () => {
    setIsApproving(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    const radicado = generateRadicadoSIGOBIUS()
    toast.success(
      <div className="flex flex-col gap-1">
        <span className="font-medium">Solicitud aprobada y radicada</span>
        <span className="text-sm">Radicado SIGOBIUS: {radicado}</span>
      </div>
    )
    setIsApproving(false)
    setShowAsignacionDialog(true)
  }

  const handleDevolver = async () => {
    if (!motivoDevolucion.trim()) {
      toast.error("Debe indicar el motivo de devolución")
      return
    }
    await new Promise(resolve => setTimeout(resolve, 1000))
    toast.success("Solicitud devuelta al juzgado")
    setShowDevolucionDialog(false)
    router.push("/gestion")
  }

  const handleAsignar = async () => {
    if (!abogadoSeleccionado) {
      toast.error("Debe seleccionar un abogado")
      return
    }
    setIsAssigning(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
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
  }

  const canValidate = solicitud.estado === "RECIBIDA" || solicitud.estado === "EN_VALIDACION"
  const canAssign = solicitud.estado === "RADICADA_EN_SIGOBIUS"

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
                  <p className="font-mono font-medium">{solicitud.radicadoOrigen}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Radicado SIGOBIUS</p>
                  <p className="font-mono font-medium">
                    {solicitud.radicadoSIGOBIUS || <span className="text-muted-foreground">Pendiente</span>}
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
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {solicitud.sancionados.map((sancionado) => (
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
              <CardDescription>
                Verifique que los documentos estén completos y legibles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {solicitud.documentosAdjuntos.map((doc) => (
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
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Ver
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
                      Especialidad en {CLASE_PROCESO_LABELS[solicitud.claseProceso]}
                    </p>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Carga actual</span>
                    <span>{abogadoSugerido.casosActivos} / {abogadoSugerido.capacidadMaxima}</span>
                  </div>
                  <Progress 
                    value={(abogadoSugerido.casosActivos || 0) / (abogadoSugerido.capacidadMaxima || 20) * 100} 
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
                <span>{format(solicitud.fechaSolicitud, "d MMM yyyy", { locale: es })}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">SLA Restante</span>
                <Badge variant={solicitud.diasSLA <= 3 ? "destructive" : "outline"}>
                  {solicitud.diasSLA} días
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

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
              Seleccione el abogado que gestionará este caso de {CLASE_PROCESO_LABELS[solicitud.claseProceso]}.
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
                    const tieneEspecialidad = abogado.especialidades?.includes(solicitud.claseProceso)
                    const cargaPorcentaje = Math.round((abogado.casosActivos || 0) / (abogado.capacidadMaxima || 20) * 100)
                    return (
                      <SelectItem key={abogado.id} value={abogado.id}>
                        <div className="flex items-center gap-2">
                          <span>{abogado.nombre}</span>
                          {tieneEspecialidad && (
                            <Badge variant="secondary" className="text-xs">
                              Especialista
                            </Badge>
                          )}
                          <Badge variant="outline" className={`text-xs ${DISPONIBILIDAD_COLORS[abogado.disponibilidad || 'DISPONIBLE']}`}>
                            {cargaPorcentaje}% carga
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
                  const tieneEspecialidad = abogado.especialidades?.includes(solicitud.claseProceso)
                  const cargaPorcentaje = Math.round((abogado.casosActivos || 0) / (abogado.capacidadMaxima || 20) * 100)
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
                            {abogado.especialidades?.map(e => CLASE_PROCESO_LABELS[e]).join(", ")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">{abogado.casosActivos}/{abogado.capacidadMaxima}</p>
                          <p className="text-xs text-muted-foreground">casos</p>
                        </div>
                        <div className="w-20">
                          <Progress value={cargaPorcentaje} className="h-2" />
                        </div>
                        <Badge className={DISPONIBILIDAD_COLORS[abogado.disponibilidad || 'DISPONIBLE']}>
                          {DISPONIBILIDAD_LABELS[abogado.disponibilidad || 'DISPONIBLE']}
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
