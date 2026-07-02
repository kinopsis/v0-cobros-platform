"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
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
import {
  CLASE_PROCESO_LABELS,
  DISPONIBILIDAD_COLORS,
  DISPONIBILIDAD_LABELS,
  type ClaseProceso,
  type Disponibilidad,
  type EstadoSolicitud,
} from "@/lib/types"
import { toast } from "sonner"
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  UserPlus,
  User,
  Sparkles,
  Loader2,
} from "lucide-react"

interface Abogado {
  id: string
  nombre: string
  email: string
  especialidades?: string[]
  capacidad_maxima?: number
  disponibilidad?: string
  total_sancionados?: number
}

type DialogType = "aprobar" | "devolver" | "asignar" | "reasignar" | "radicar_gcc" | "devolver_abogado" | null

interface WorkflowDialogsProps {
  solicitudId: string
  radicadoOrigen: string
  claseProceso: ClaseProceso
  estado: EstadoSolicitud
  abogados: Abogado[]
  openDialog: DialogType
  onOpenChange: (dialog: DialogType) => void
  userRol?: string
}

export function WorkflowDialogs({
  solicitudId,
  radicadoOrigen,
  claseProceso,
  estado,
  abogados,
  openDialog,
  onOpenChange,
  userRol,
}: WorkflowDialogsProps) {
  const router = useRouter()

  // Estados para radicación
  const [radicadoSIGOBIUS, setRadicadoSIGOBIUS] = useState("")
  const [radicadoError, setRadicadoError] = useState("")
  const [isApproving, setIsApproving] = useState(false)

  // Estados para devolución
  const [motivoDevolucion, setMotivoDevolucion] = useState("")
  const [isReturning, setIsReturning] = useState(false)

  // Estados para asignación
  const [abogadoSeleccionado, setAbogadoSeleccionado] = useState("")
  const [isAssigning, setIsAssigning] = useState(false)

  // Estados para radicación GCC
  const [radicadoGCC, setRadicadoGCC] = useState("")
  const [radicadoGCCError, setRadicadoGCCError] = useState("")
  const [isRadicandoGCC, setIsRadicandoGCC] = useState(false)

  // Estados para devolución por abogado
  const [motivoDevolucionAbogado, setMotivoDevolucionAbogado] = useState("")
  const [isReturningAbogado, setIsReturningAbogado] = useState(false)

  // --- Handler: Aprobar y Radicar ---
  const handleAprobar = async () => {
    if (!radicadoSIGOBIUS.trim()) {
      setRadicadoError("Debe ingresar el radicado SIGOBIUS")
      return
    }
    setIsApproving(true)
    try {
      const res = await fetch(`/api/solicitudes/${solicitudId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estado: "RADICADA_EN_SIGOBIUS",
          radicado_sigobius: radicadoSIGOBIUS.trim(),
          fecha_radicacion: new Date().toISOString(),
          observaciones: `Radicado en SIGOBIUS: ${radicadoSIGOBIUS.trim()}`,
        }),
      })
      if (!res.ok) throw new Error("Error al radicar")
      toast.success("Solicitud aprobada y radicada", {
        description: `Radicado SIGOBIUS: ${radicadoSIGOBIUS.trim()}`,
      })
      handleAfterRadicar()
      router.refresh()
    } catch (err: any) {
      toast.error("Error al radicar", {
        description: err.message || "Intente nuevamente",
      })
    } finally {
      setIsApproving(false)
    }
  }

  const handleAfterRadicar = () => {
    toast.info("Continue con la asignación", {
      description: "Seleccione el abogado que gestionará este caso.",
    })
    onOpenChange("asignar")
  }

  // --- Handler: Devolver ---
  const handleDevolver = async () => {
    if (!motivoDevolucion.trim()) {
      toast.error("Debe indicar el motivo de devolución")
      return
    }
    setIsReturning(true)
    try {
      const res = await fetch(`/api/solicitudes/${solicitudId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estado: "DEVUELTA_POR_GESTOR",
          motivo_devolucion: motivoDevolucion.trim(),
          observaciones: `Devuelta al juzgado por gestor: ${motivoDevolucion.trim()}`,
        }),
      })
      if (!res.ok) throw new Error("Error al devolver")
      toast.success("Solicitud devuelta al juzgado")
      onOpenChange(null)
      router.refresh()
    } catch (err: any) {
      toast.error("Error al devolver", {
        description: err.message || "Intente nuevamente",
      })
    } finally {
      setIsReturning(false)
    }
  }

  // --- Handler: Asignar Abogado ---
  const handleAsignar = async () => {
    if (!abogadoSeleccionado) {
      toast.error("Debe seleccionar un abogado")
      return
    }
    setIsAssigning(true)
    try {
      const abogado = abogados.find((a) => a.id === abogadoSeleccionado)
      const res = await fetch(`/api/solicitudes/${solicitudId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estado: "ASIGNADA_A_ABOGADO",
          abogado_asignado_id: abogadoSeleccionado,
          fecha_asignacion: new Date().toISOString(),
          observaciones: `Caso asignado a ${abogado?.nombre || abogadoSeleccionado}`,
        }),
      })
      if (!res.ok) throw new Error("Error al asignar")
      toast.success("Caso asignado exitosamente", {
        description: `Abogado: ${abogado?.nombre || abogadoSeleccionado}`,
      })
      onOpenChange(null)
      router.refresh()
    } catch (err: any) {
      toast.error("Error al asignar", {
        description: err.message || "Intente nuevamente",
      })
    } finally {
      setIsAssigning(false)
    }
  }

  // Sugerencia de abogado
  const abogadoSugerido = abogados
    .filter((a) => a.especialidades?.includes(claseProceso))
    .sort((a, b) => (a.total_sancionados || 0) - (b.total_sancionados || 0))[0]

  // --- Handler: Reasignar Abogado ---
  const handleReasignar = async () => {
    if (!abogadoSeleccionado) {
      toast.error("Debe seleccionar un abogado")
      return
    }
    setIsAssigning(true)
    try {
      const abogado = abogados.find((a) => a.id === abogadoSeleccionado)
      const res = await fetch(`/api/solicitudes/${solicitudId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          abogado_asignado_id: abogadoSeleccionado,
          fecha_asignacion: new Date().toISOString(),
          observaciones: `Caso reasignado a ${abogado?.nombre || abogadoSeleccionado}`,
        }),
      })
      if (!res.ok) throw new Error("Error al reasignar")
      toast.success("Abogado reasignado exitosamente", {
        description: `Nuevo abogado: ${abogado?.nombre || abogadoSeleccionado}`,
      })
      onOpenChange(null)
      router.refresh()
    } catch (err: any) {
      toast.error("Error al reasignar", {
        description: err.message || "Intente nuevamente",
      })
    } finally {
      setIsAssigning(false)
    }
  }

  // --- Handler: Radicar en GCC ---
  const handleRadicarGCC = async () => {
    if (!radicadoGCC.trim()) {
      setRadicadoGCCError("Debe ingresar el radicado de GCC")
      return
    }
    setIsRadicandoGCC(true)
    try {
      const res = await fetch(`/api/solicitudes/${solicitudId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estado: "RADICADA_EN_GCC",
          radicado_sistema_justicia: radicadoGCC.trim(),
          fecha_cierre: new Date().toISOString(),
          observaciones: `Radicado en GCC: ${radicadoGCC.trim()}`,
        }),
      })
      if (!res.ok) throw new Error("Error al radicar en GCC")
      toast.success("Solicitud radicada en GCC", {
        description: `Radicado GCC: ${radicadoGCC.trim()}`,
      })
      onOpenChange(null)
      router.refresh()
    } catch (err: any) {
      toast.error("Error al radicar en GCC", {
        description: err.message || "Intente nuevamente",
      })
    } finally {
      setIsRadicandoGCC(false)
    }
  }

  // --- Handler: Devolver por Abogado ---
  const handleDevolverAbogado = async () => {
    if (!motivoDevolucionAbogado.trim()) {
      toast.error("Debe indicar el motivo de devolución")
      return
    }
    setIsReturningAbogado(true)
    try {
      const res = await fetch(`/api/solicitudes/${solicitudId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estado: "DEVUELTA_POR_ABOGADO",
          motivo_devolucion_abogado: motivoDevolucionAbogado.trim(),
          observaciones: `Devuelta por abogado: ${motivoDevolucionAbogado.trim()}`,
        }),
      })
      if (!res.ok) throw new Error("Error al devolver")
      toast.success("Solicitud devuelta al gestor")
      onOpenChange(null)
      router.refresh()
    } catch (err: any) {
      toast.error("Error al devolver", {
        description: err.message || "Intente nuevamente",
      })
    } finally {
      setIsReturningAbogado(false)
    }
  }

  const isReasignar = openDialog === "reasignar"
  const isAsignarOrReasignar = openDialog === "asignar" || openDialog === "reasignar"

  return (
    <>
      {/* Dialog de Radicación SIGOBIUS */}
      <Dialog
        open={openDialog === "aprobar"}
        onOpenChange={(open) => {
          if (!open) onOpenChange(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Aprobar y Radicar en SIGOBIUS
            </DialogTitle>
            <DialogDescription>
              Ingrese el número de radicado asignado en SIGOBIUS para esta
              solicitud. Este número debe ser generado directamente en el
              sistema SIGOBIUS antes de continuar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-md bg-muted/60 border px-4 py-3 text-sm space-y-1">
              <p className="text-muted-foreground">Solicitud</p>
              <p className="font-mono font-medium">{solicitudId}</p>
              <p className="text-muted-foreground mt-2">Radicado de origen</p>
              <p className="font-mono font-medium">{radicadoOrigen}</p>
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
                className={
                  radicadoError
                    ? "border-destructive focus-visible:ring-destructive"
                    : ""
                }
                autoFocus
              />
              {radicadoError && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {radicadoError}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                La integración automática con SIGOBIUS estará disponible en una
                próxima versión.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onOpenChange(null)}
              disabled={isApproving}
            >
              Cancelar
            </Button>
            <Button onClick={handleAprobar} disabled={isApproving}>
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

      {/* Dialog de Devolución por Gestor */}
      <Dialog
        open={openDialog === "devolver"}
        onOpenChange={(open) => {
          if (!open) onOpenChange(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              Devolver Solicitud al Juzgado
            </DialogTitle>
            <DialogDescription>
              Indique el motivo por el cual se devuelve la solicitud al juzgado
              remitente.
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
            <Button
              variant="outline"
              onClick={() => onOpenChange(null)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDevolver}
              disabled={isReturning}
            >
              {isReturning ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Confirmar Devolución
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Asignación / Reasignación */}
      <Dialog
        open={isAsignarOrReasignar}
        onOpenChange={(open) => {
          if (!open) onOpenChange(null)
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              {isReasignar ? "Reasignar Abogado" : "Asignar Abogado"}
            </DialogTitle>
            <DialogDescription>
              {isReasignar
                ? "Seleccione el nuevo abogado que gestionará este caso."
                : `Seleccione el abogado que gestionará este caso de ${CLASE_PROCESO_LABELS[claseProceso]}.`
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {abogadoSugerido && (
              <div className="rounded-md border border-primary/50 bg-primary/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Sugerencia de Asignación</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{abogadoSugerido.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      Especialidad en {CLASE_PROCESO_LABELS[claseProceso]} —{" "}
                      {abogadoSugerido.total_sancionados || 0} / {abogadoSugerido.capacidad_maxima || 20} sancionados
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Abogado</Label>
              <Select
                value={abogadoSeleccionado}
                onValueChange={setAbogadoSeleccionado}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un abogado..." />
                </SelectTrigger>
                <SelectContent>
                  {abogados.map((abogado) => {
                    const tieneEspecialidad =
                      abogado.especialidades?.includes(claseProceso)
                    const cargaPorcentaje = Math.round(
                      ((abogado.total_sancionados || 0) /
                        (abogado.capacidad_maxima || 20)) *
                        100
                    )
                    return (
                      <SelectItem key={abogado.id} value={abogado.id}>
                        <div className="flex items-center gap-2">
                          <span>{abogado.nombre}</span>
                          {tieneEspecialidad && (
                            <Badge variant="secondary" className="text-xs">
                              Especialista
                            </Badge>
                          )}
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              DISPONIBILIDAD_COLORS[
                                (abogado.disponibilidad || "DISPONIBLE") as Disponibilidad
                              ]
                            }`}
                          >
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
              <div className="divide-y max-h-[200px] overflow-y-auto">
                {abogados.map((abogado) => {
                  const tieneEspecialidad =
                    abogado.especialidades?.includes(claseProceso)
                  const cargaPorcentaje = Math.round(
                    ((abogado.total_sancionados || 0) /
                      (abogado.capacidad_maxima || 20)) *
                      100
                  )
                  return (
                    <div
                      key={abogado.id}
                      className={`p-3 flex items-center justify-between cursor-pointer hover:bg-muted/50 ${
                        abogadoSeleccionado === abogado.id
                          ? "bg-primary/5"
                          : ""
                      }`}
                      onClick={() => setAbogadoSeleccionado(abogado.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-8 w-8 rounded-full flex items-center justify-center ${
                            tieneEspecialidad
                              ? "bg-primary/10"
                              : "bg-muted"
                          }`}
                        >
                          <User
                            className={`h-4 w-4 ${
                              tieneEspecialidad
                                ? "text-primary"
                                : "text-muted-foreground"
                            }`}
                          />
                        </div>
                        <div>
                          <p className="text-sm font-medium flex items-center gap-2">
                            {abogado.nombre}
                            {tieneEspecialidad && (
                              <Sparkles className="h-3 w-3 text-primary" />
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {abogado.especialidades
                              ?.map((e) => CLASE_PROCESO_LABELS[e as ClaseProceso] || e)
                              .join(", ")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-4">
                        <div className="text-right shrink-0">
                          <p className="text-sm font-medium">
                            {abogado.total_sancionados || 0}/{abogado.capacidad_maxima || 20}
                          </p>
                          <p className="text-xs text-muted-foreground">sancionados</p>
                        </div>
                        <div className="w-16 sm:w-20 shrink-0">
                          <Progress value={cargaPorcentaje} className="h-2" />
                        </div>
                        <Badge
                          className={`${
                            DISPONIBILIDAD_COLORS[
                              (abogado.disponibilidad || "DISPONIBLE") as Disponibilidad
                            ]
                          } shrink-0`}
                        >
                          {DISPONIBILIDAD_LABELS[
                            (abogado.disponibilidad || "DISPONIBLE") as Disponibilidad
                          ]}
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(null)}>
              Cancelar
            </Button>
            <Button
              onClick={isReasignar ? handleReasignar : handleAsignar}
              disabled={isAssigning || !abogadoSeleccionado}
            >
              {isAssigning ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              {isReasignar ? "Confirmar Reasignación" : "Confirmar Asignación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Dialog de Radicación en GCC */}
      <Dialog
        open={openDialog === "radicar_gcc"}
        onOpenChange={(open) => {
          if (!open) onOpenChange(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Radicar en GCC (Gestión de Cobro Coactivo)
            </DialogTitle>
            <DialogDescription>
              Ingrese el número de radicado en GCC. Este es el estado final del
              proceso — a partir de aquí, GCC gestiona el cobro coactivo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-md bg-muted/60 border px-4 py-3 text-sm space-y-1">
              <p className="text-muted-foreground">Solicitud</p>
              <p className="font-mono font-medium">{solicitudId}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="radicado-gcc">
                Radicado GCC <span className="text-destructive">*</span>
              </Label>
              <Input
                id="radicado-gcc"
                placeholder="Ej: GCC-2025-00123"
                value={radicadoGCC}
                onChange={(e) => {
                  setRadicadoGCC(e.target.value)
                  if (radicadoGCCError) setRadicadoGCCError("")
                }}
                className={
                  radicadoGCCError
                    ? "border-destructive focus-visible:ring-destructive"
                    : ""
                }
                autoFocus
              />
              {radicadoGCCError && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {radicadoGCCError}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onOpenChange(null)}
              disabled={isRadicandoGCC}
            >
              Cancelar
            </Button>
            <Button onClick={handleRadicarGCC} disabled={isRadicandoGCC}>
              {isRadicandoGCC ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              Radicar en GCC
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Devolución por Abogado */}
      <Dialog
        open={openDialog === "devolver_abogado"}
        onOpenChange={(open) => {
          if (!open) onOpenChange(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-orange-600" />
              Devolver Solicitud al Gestor
            </DialogTitle>
            <DialogDescription>
              Indique las observaciones o correcciones que debe atender el gestor
              antes de reasignar el caso.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="motivo-abogado">Observaciones *</Label>
              <Textarea
                id="motivo-abogado"
                placeholder="Describa las observaciones o problemas encontrados..."
                value={motivoDevolucionAbogado}
                onChange={(e) => setMotivoDevolucionAbogado(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onOpenChange(null)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDevolverAbogado}
              disabled={isReturningAbogado}
            >
              {isReturningAbogado ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Confirmar Devolución
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
