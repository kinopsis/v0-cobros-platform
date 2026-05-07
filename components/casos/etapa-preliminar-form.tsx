"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CalendarIcon, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

// Opciones de Trámite
const TRAMITE_OPTIONS = [
  { value: "", label: "Por favor seleccione" },
  { value: "APERTURA", label: "APERTURA" },
  { value: "DEVOLUCION", label: "DEVOLUCION" },
  { value: "DUPLICADO", label: "DUPLICADO" },
  { value: "INAPLICACION", label: "INAPLICACION" },
  { value: "OTRO", label: "OTRO" },
  { value: "TRASLADO", label: "TRASLADO" },
]

// Opciones de Concepto
const CONCEPTO_OPTIONS = [
  { value: "", label: "Por favor seleccione" },
  { value: "ARANCEL", label: "Arancel" },
  { value: "INCAPACIDAD", label: "Incapacidad" },
  { value: "MULTA", label: "Multa" },
  { value: "POLIZA", label: "Póliza" },
  { value: "REINTEGRO", label: "Reintegro" },
]

// Opciones de Tipo (moneda/unidad)
const TIPO_OPTIONS = [
  { value: "", label: "Por favor sel..." },
  { value: "PESOS", label: "PESOS" },
  { value: "SALARIOS", label: "SALARIOS" },
  { value: "UVTS", label: "UVTs" },
  { value: "UVBS", label: "UVBs" },
]

interface EtapaPreliminarFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  casoId: string
  abogados?: { id: string; nombre: string }[]
  onSubmit?: (data: EtapaPreliminarData) => void
}

export interface EtapaPreliminarData {
  tramite: string
  abogado: string
  concepto: string
  naturaleza: string
  noOrigen: string
  competencia: string
  providencia: Date | null
  ejecutoria: Date | null
  folios: string
  dias: string
  remisorio: string
  plazo: Date | null
  fechaLiquidacion: Date | null
  tipo: string
  cantidad: string
  cantidadLetras: string
  obligacion: string
  obligacionLetras: string
  cumpleRequisitos: boolean
  tipoExpedienteFisico: boolean
  tipoExpedienteDigital: boolean
  observaciones: string
}

// Helper para convertir número a letras (simplificado)
function numeroALetras(num: number): string {
  if (isNaN(num) || num === 0) return ""
  
  const unidades = ["", "UN", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE"]
  const decenas = ["", "DIEZ", "VEINTE", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA"]
  const especiales = ["ONCE", "DOCE", "TRECE", "CATORCE", "QUINCE", "DIECISÉIS", "DIECISIETE", "DIECIOCHO", "DIECINUEVE"]
  
  if (num < 10) return unidades[num]
  if (num >= 11 && num <= 19) return especiales[num - 11]
  if (num < 100) {
    const d = Math.floor(num / 10)
    const u = num % 10
    if (u === 0) return decenas[d]
    if (d === 2) return `VEINTI${unidades[u]}`
    return `${decenas[d]} Y ${unidades[u]}`
  }
  
  // Para números más grandes, simplemente devolvemos el número formateado
  return new Intl.NumberFormat('es-CO').format(num) + " PESOS"
}

export function EtapaPreliminarForm({
  open,
  onOpenChange,
  casoId,
  abogados = [],
  onSubmit
}: EtapaPreliminarFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [formData, setFormData] = useState<EtapaPreliminarData>({
    tramite: "",
    abogado: "",
    concepto: "",
    naturaleza: "",
    noOrigen: "",
    competencia: "",
    providencia: null,
    ejecutoria: null,
    folios: "",
    dias: "10",
    remisorio: "",
    plazo: null,
    fechaLiquidacion: null,
    tipo: "",
    cantidad: "",
    cantidadLetras: "",
    obligacion: "",
    obligacionLetras: "",
    cumpleRequisitos: false,
    tipoExpedienteFisico: false,
    tipoExpedienteDigital: false,
    observaciones: ""
  })

  // Auto-calcular cantidad en letras
  useEffect(() => {
    const num = parseFloat(formData.cantidad.replace(/[,.]/g, ''))
    if (!isNaN(num) && num > 0) {
      setFormData(prev => ({
        ...prev,
        cantidadLetras: numeroALetras(num)
      }))
    } else {
      setFormData(prev => ({ ...prev, cantidadLetras: "" }))
    }
  }, [formData.cantidad])

  // Auto-calcular obligación en letras
  useEffect(() => {
    const num = parseFloat(formData.obligacion.replace(/[,.]/g, ''))
    if (!isNaN(num) && num > 0) {
      setFormData(prev => ({
        ...prev,
        obligacionLetras: numeroALetras(num)
      }))
    } else {
      setFormData(prev => ({ ...prev, obligacionLetras: "" }))
    }
  }, [formData.obligacion])

  const handleChange = (field: keyof EtapaPreliminarData, value: string | boolean | Date | null) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    if (!formData.tramite) {
      toast.error("Debe seleccionar un trámite")
      return
    }
    if (!formData.competencia) {
      toast.error("Debe ingresar la competencia")
      return
    }

    setIsSubmitting(true)
    await new Promise(resolve => setTimeout(resolve, 1200))
    
    if (onSubmit) {
      onSubmit(formData)
    }
    
    toast.success("Etapa preliminar guardada correctamente")
    setIsSubmitting(false)
    onOpenChange(false)
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary">
            Agregar, Etapa Preliminar
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Row 1: Trámite y Abogado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="tramite">
                Trámite <span className="text-destructive">*</span>
              </Label>
              <Select value={formData.tramite} onValueChange={(v) => handleChange("tramite", v)}>
                <SelectTrigger id="tramite">
                  <SelectValue placeholder="Por favor seleccione" />
                </SelectTrigger>
                <SelectContent>
                  {TRAMITE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value || "empty"} value={opt.value || "placeholder"} disabled={!opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="abogado">Abogado</Label>
              <Select value={formData.abogado} onValueChange={(v) => handleChange("abogado", v)}>
                <SelectTrigger id="abogado">
                  <SelectValue placeholder="Por favor seleccione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="placeholder" disabled>Por favor seleccione</SelectItem>
                  {abogados.map(ab => (
                    <SelectItem key={ab.id} value={ab.id}>{ab.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 2: Concepto y Naturaleza */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="concepto">Concepto</Label>
              <Select value={formData.concepto} onValueChange={(v) => handleChange("concepto", v)}>
                <SelectTrigger id="concepto">
                  <SelectValue placeholder="Por favor seleccione" />
                </SelectTrigger>
                <SelectContent>
                  {CONCEPTO_OPTIONS.map(opt => (
                    <SelectItem key={opt.value || "empty"} value={opt.value || "placeholder"} disabled={!opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="naturaleza">Naturaleza</Label>
              <Select value={formData.naturaleza} onValueChange={(v) => handleChange("naturaleza", v)}>
                <SelectTrigger id="naturaleza">
                  <SelectValue placeholder="Por favor seleccione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="placeholder" disabled>Por favor seleccione</SelectItem>
                  <SelectItem value="ADMINISTRATIVA">Administrativa</SelectItem>
                  <SelectItem value="JUDICIAL">Judicial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 3: No.Origen y Competencia */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="noOrigen">No.Origen</Label>
              <Input
                id="noOrigen"
                value={formData.noOrigen}
                onChange={(e) => handleChange("noOrigen", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="competencia">
                Competencia <span className="text-destructive">*</span>
              </Label>
              <Input
                id="competencia"
                placeholder="Escriba para buscar..."
                value={formData.competencia}
                onChange={(e) => handleChange("competencia", e.target.value)}
              />
            </div>
          </div>

          {/* Row 4: Providencia y Ejecutoria */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Providencia</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.providencia && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.providencia ? format(formData.providencia, "dd/MM/yyyy", { locale: es }) : "Seleccionar fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.providencia || undefined}
                    onSelect={(date) => handleChange("providencia", date || null)}
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5">
              <Label>Ejecutoria</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.ejecutoria && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.ejecutoria ? format(formData.ejecutoria, "dd/MM/yyyy", { locale: es }) : "Seleccionar fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.ejecutoria || undefined}
                    onSelect={(date) => handleChange("ejecutoria", date || null)}
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Row 5: Folios y Días */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="folios">Folios</Label>
              <Input
                id="folios"
                value={formData.folios}
                onChange={(e) => handleChange("folios", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dias">Días</Label>
              <Input
                id="dias"
                value={formData.dias}
                onChange={(e) => handleChange("dias", e.target.value)}
              />
            </div>
          </div>

          {/* Row 6: Remisorio y Plazo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="remisorio">Remisorio</Label>
              <Input
                id="remisorio"
                value={formData.remisorio}
                onChange={(e) => handleChange("remisorio", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Plazo</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.plazo && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.plazo ? format(formData.plazo, "dd/MM/yyyy", { locale: es }) : "Seleccionar fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.plazo || undefined}
                    onSelect={(date) => handleChange("plazo", date || null)}
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Row 7: Fecha Liquidación, Tipo, Cantidad, Cantidad Letras */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label>Fecha Liquidación</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal text-xs",
                      !formData.fechaLiquidacion && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-1 h-3 w-3" />
                    {formData.fechaLiquidacion ? format(formData.fechaLiquidacion, "dd/MM/yy", { locale: es }) : "Fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.fechaLiquidacion || undefined}
                    onSelect={(date) => handleChange("fechaLiquidacion", date || null)}
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tipo">Tipo</Label>
              <Select value={formData.tipo} onValueChange={(v) => handleChange("tipo", v)}>
                <SelectTrigger id="tipo" className="text-xs">
                  <SelectValue placeholder="Por favor sel..." />
                </SelectTrigger>
                <SelectContent>
                  {TIPO_OPTIONS.map(opt => (
                    <SelectItem key={opt.value || "empty"} value={opt.value || "placeholder"} disabled={!opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cantidad">Cantidad</Label>
              <Input
                id="cantidad"
                value={formData.cantidad}
                onChange={(e) => handleChange("cantidad", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cantidadLetras">Cantidad Letras</Label>
              <Input
                id="cantidadLetras"
                value={formData.cantidadLetras}
                readOnly
                className="bg-emerald-500 text-white border-emerald-500"
              />
            </div>
          </div>

          {/* Row 8: Obligación y Obligación Letras */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="obligacion">Obligación</Label>
              <Input
                id="obligacion"
                value={formData.obligacion}
                onChange={(e) => handleChange("obligacion", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="obligacionLetras">Obligación Letras</Label>
              <Input
                id="obligacionLetras"
                value={formData.obligacionLetras}
                readOnly
                className="bg-emerald-500 text-white border-emerald-500"
              />
            </div>
          </div>

          {/* Row 9: Cumple Requisitos y Tipo de Expediente */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="cumpleRequisitos"
                checked={formData.cumpleRequisitos}
                onCheckedChange={(checked) => handleChange("cumpleRequisitos", !!checked)}
              />
              <Label htmlFor="cumpleRequisitos" className="cursor-pointer">
                Cumple Requisitos
              </Label>
            </div>
            <div className="flex items-center gap-6">
              <span className="text-sm text-muted-foreground">Tipo de Expediente:</span>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="tipoExpedienteFisico"
                  checked={formData.tipoExpedienteFisico}
                  onCheckedChange={(checked) => handleChange("tipoExpedienteFisico", !!checked)}
                />
                <Label htmlFor="tipoExpedienteFisico" className="cursor-pointer">Físico</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="tipoExpedienteDigital"
                  checked={formData.tipoExpedienteDigital}
                  onCheckedChange={(checked) => handleChange("tipoExpedienteDigital", !!checked)}
                />
                <Label htmlFor="tipoExpedienteDigital" className="cursor-pointer">Digital</Label>
              </div>
            </div>
          </div>

          {/* Row 10: Observaciones */}
          <div className="space-y-1.5">
            <Label htmlFor="observaciones" className="text-center block">Observaciones</Label>
            <Textarea
              id="observaciones"
              value={formData.observaciones}
              onChange={(e) => handleChange("observaciones", e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary/90"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar
          </Button>
          <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
