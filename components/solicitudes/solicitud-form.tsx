"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  ClaseProceso, 
  Asunto, 
  TipoDocumento, 
  TipoPersona,
  CLASE_PROCESO_LABELS,
  ASUNTO_LABELS,
  TIPO_DOCUMENTO_LABELS,
  TIPO_PERSONA_LABELS,
  Sancionado
} from "@/lib/types"
import { 
  FileText, 
  User, 
  Building2, 
  Upload, 
  Plus, 
  Trash2, 
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save
} from "lucide-react"
import { toast } from "sonner"

interface SolicitudFormProps {
  mode?: "create" | "edit" | "view"
  solicitudId?: string
}

export function SolicitudForm({ mode = "create" }: SolicitudFormProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    radicadoOrigen: "",
    claseProceso: "" as ClaseProceso | "",
    asunto: "" as Asunto | "",
    juzgadoConocimiento: user?.nombreJuzgado || "",
    descripcionProceso: "",
  })

  const [sancionados, setSancionados] = useState<Partial<Sancionado>[]>([
    { id: "1", nombreCompleto: "", tipoDocumento: "CC", numeroDocumento: "", tipoPersona: "NATURAL" }
  ])

  const [documentos, setDocumentos] = useState<File[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Validación de radicado de 23 dígitos
  const validateRadicado = (value: string) => {
    const cleanValue = value.replace(/\D/g, "")
    if (cleanValue.length > 0 && cleanValue.length !== 23) {
      return "El radicado debe tener exactamente 23 dígitos"
    }
    return ""
  }

  // Validación de documento
  const validateDocumento = (tipo: TipoDocumento, numero: string) => {
    if (!numero) return "El número de documento es requerido"
    if (tipo === "CC" && (numero.length < 6 || numero.length > 10)) {
      return "La cédula debe tener entre 6 y 10 dígitos"
    }
    if (tipo === "NIT" && !numero.includes("-")) {
      return "El NIT debe incluir el dígito de verificación (ej: 900123456-7)"
    }
    return ""
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Validación en tiempo real para radicado
    if (field === "radicadoOrigen") {
      const error = validateRadicado(value)
      setErrors(prev => ({ ...prev, radicadoOrigen: error }))
    }
  }

  const handleSancionadoChange = (index: number, field: keyof Sancionado, value: string) => {
    setSancionados(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const addSancionado = () => {
    if (sancionados.length >= 10) {
      toast.error("Máximo 10 sancionados permitidos")
      return
    }
    setSancionados(prev => [
      ...prev,
      { id: String(prev.length + 1), nombreCompleto: "", tipoDocumento: "CC", numeroDocumento: "", tipoPersona: "NATURAL" }
    ])
  }

  const removeSancionado = (index: number) => {
    if (sancionados.length <= 1) {
      toast.error("Debe haber al menos un sancionado")
      return
    }
    setSancionados(prev => prev.filter((_, i) => i !== index))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles = files.filter(file => {
      if (file.type !== "application/pdf") {
        toast.error(`${file.name} no es un archivo PDF válido`)
        return false
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} excede el tamaño máximo de 10MB`)
        return false
      }
      return true
    })
    setDocumentos(prev => [...prev, ...validFiles])
  }

  const removeFile = (index: number) => {
    setDocumentos(prev => prev.filter((_, i) => i !== index))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.radicadoOrigen) {
      newErrors.radicadoOrigen = "El radicado de origen es requerido"
    } else {
      const radicadoError = validateRadicado(formData.radicadoOrigen)
      if (radicadoError) newErrors.radicadoOrigen = radicadoError
    }

    if (!formData.claseProceso) {
      newErrors.claseProceso = "La clase de proceso es requerida"
    }

    if (!formData.asunto) {
      newErrors.asunto = "El asunto es requerido"
    }

    // Validar sancionados
    sancionados.forEach((s, index) => {
      if (!s.nombreCompleto) {
        newErrors[`sancionado_${index}_nombre`] = "El nombre es requerido"
      }
      if (!s.numeroDocumento) {
        newErrors[`sancionado_${index}_documento`] = "El documento es requerido"
      }
    })

    if (documentos.length === 0) {
      newErrors.documentos = "Debe adjuntar al menos un documento"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error("Por favor corrija los errores del formulario")
      return
    }

    setIsSubmitting(true)

    // Simulación de envío
    await new Promise(resolve => setTimeout(resolve, 2000))

    const solicitudId = `SOL-2026-${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`
    
    toast.success(
      <div className="flex flex-col gap-1">
        <span className="font-medium">Solicitud radicada exitosamente</span>
        <span className="text-sm">ID: {solicitudId}</span>
      </div>
    )

    setIsSubmitting(false)
    router.push(`/solicitudes/${solicitudId}`)
  }

  const handleSaveDraft = async () => {
    setIsSavingDraft(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    toast.success("Borrador guardado correctamente")
    setIsSavingDraft(false)
  }

  const isViewMode = mode === "view"

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Sección 1: Datos del Despacho */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Datos del Despacho Remitente
          </CardTitle>
          <CardDescription>
            Información del juzgado o tribunal que remite la solicitud
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Código del Despacho</Label>
            <Input 
              value={user?.codigoDespacho || ""} 
              disabled 
              className="bg-muted"
            />
          </div>
          <div className="space-y-2">
            <Label>Nombre del Juzgado/Tribunal</Label>
            <Input 
              value={user?.nombreJuzgado || ""} 
              disabled 
              className="bg-muted"
            />
          </div>
          <div className="space-y-2">
            <Label>Funcionario Remitente</Label>
            <Input 
              value={user?.nombre || ""} 
              disabled 
              className="bg-muted"
            />
          </div>
          <div className="space-y-2">
            <Label>Correo Institucional</Label>
            <Input 
              value={user?.email || ""} 
              disabled 
              className="bg-muted"
            />
          </div>
          <div className="space-y-2">
            <Label>Teléfono</Label>
            <Input 
              value={user?.telefono || ""} 
              disabled 
              className="bg-muted"
            />
          </div>
          <div className="space-y-2">
            <Label>Ciudad</Label>
            <Input 
              value={user?.ciudad || ""} 
              disabled 
              className="bg-muted"
            />
          </div>
        </CardContent>
      </Card>

      {/* Sección 2: Datos del Proceso */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Datos del Proceso
          </CardTitle>
          <CardDescription>
            Información del proceso de cobro coactivo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="radicadoOrigen">
                Radicado de Origen <span className="text-destructive">*</span>
              </Label>
              <Input
                id="radicadoOrigen"
                placeholder="23 dígitos (ej: 05001310500120260001200)"
                value={formData.radicadoOrigen}
                onChange={(e) => handleInputChange("radicadoOrigen", e.target.value)}
                disabled={isViewMode}
                maxLength={23}
                className={errors.radicadoOrigen ? "border-destructive" : ""}
              />
              {errors.radicadoOrigen && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.radicadoOrigen}
                </p>
              )}
              {formData.radicadoOrigen && !errors.radicadoOrigen && formData.radicadoOrigen.length === 23 && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Formato válido
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="claseProceso">
                Clase de Proceso <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.claseProceso}
                onValueChange={(value) => handleInputChange("claseProceso", value)}
                disabled={isViewMode}
              >
                <SelectTrigger className={errors.claseProceso ? "border-destructive" : ""}>
                  <SelectValue placeholder="Seleccione..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CLASE_PROCESO_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.claseProceso && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.claseProceso}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="asunto">
                Asunto <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.asunto}
                onValueChange={(value) => handleInputChange("asunto", value)}
                disabled={isViewMode}
              >
                <SelectTrigger className={errors.asunto ? "border-destructive" : ""}>
                  <SelectValue placeholder="Seleccione..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ASUNTO_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.asunto && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.asunto}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="juzgadoConocimiento">Juzgado de Conocimiento</Label>
              <Input
                id="juzgadoConocimiento"
                value={formData.juzgadoConocimiento}
                onChange={(e) => handleInputChange("juzgadoConocimiento", e.target.value)}
                disabled={isViewMode}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcionProceso">Descripción y Observaciones del Proceso</Label>
            <Textarea
              id="descripcionProceso"
              placeholder="Describa brevemente el proceso y las observaciones relevantes..."
              value={formData.descripcionProceso}
              onChange={(e) => handleInputChange("descripcionProceso", e.target.value)}
              disabled={isViewMode}
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Sección 3: Sancionados */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Personas Involucradas (Sancionados)
              </CardTitle>
              <CardDescription>
                Personas naturales o jurídicas con obligación económica pendiente
              </CardDescription>
            </div>
            {!isViewMode && (
              <Button type="button" variant="outline" size="sm" onClick={addSancionado}>
                <Plus className="h-4 w-4 mr-1" />
                Agregar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {sancionados.map((sancionado, index) => (
            <div key={sancionado.id} className="relative rounded-lg border p-4">
              {sancionados.length > 1 && !isViewMode && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2"
                  onClick={() => removeSancionado(index)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
              
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2 lg:col-span-2">
                  <Label>
                    Nombre Completo <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    placeholder="Nombre completo o razón social"
                    value={sancionado.nombreCompleto || ""}
                    onChange={(e) => handleSancionadoChange(index, "nombreCompleto", e.target.value)}
                    disabled={isViewMode}
                    className={errors[`sancionado_${index}_nombre`] ? "border-destructive" : ""}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Tipo de Documento</Label>
                  <Select
                    value={sancionado.tipoDocumento}
                    onValueChange={(value) => handleSancionadoChange(index, "tipoDocumento", value as TipoDocumento)}
                    disabled={isViewMode}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TIPO_DOCUMENTO_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>
                    Número de Documento <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    placeholder={sancionado.tipoDocumento === "NIT" ? "900123456-7" : "1234567890"}
                    value={sancionado.numeroDocumento || ""}
                    onChange={(e) => handleSancionadoChange(index, "numeroDocumento", e.target.value)}
                    disabled={isViewMode}
                    className={errors[`sancionado_${index}_documento`] ? "border-destructive" : ""}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tipo de Persona</Label>
                  <Select
                    value={sancionado.tipoPersona}
                    onValueChange={(value) => handleSancionadoChange(index, "tipoPersona", value as TipoPersona)}
                    disabled={isViewMode}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TIPO_PERSONA_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            Puede agregar hasta 10 sancionados. Mínimo 1 requerido.
          </p>
        </CardContent>
      </Card>

      {/* Sección 4: Documentos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Documentos Adjuntos
          </CardTitle>
          <CardDescription>
            Adjunte la providencia, auto, sentencia o certificación de cobro (PDF, máx. 10MB por archivo)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isViewMode && (
            <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
              <input
                type="file"
                id="documentos"
                accept=".pdf"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="documentos" className="cursor-pointer">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-medium">
                  Haga clic para seleccionar archivos
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  o arrastre y suelte aquí
                </p>
              </label>
            </div>
          )}

          {errors.documentos && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.documentos}
            </p>
          )}

          {documentos.length > 0 && (
            <div className="space-y-2">
              {documentos.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-destructive" />
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  {!isViewMode && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFile(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            <Badge variant="secondary">Providencia</Badge>
            <Badge variant="secondary">Auto</Badge>
            <Badge variant="secondary">Sentencia</Badge>
            <Badge variant="secondary">Certificación de Cobro</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Botones de acción */}
      {!isViewMode && (
        <>
          <Separator />
          <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleSaveDraft}
              disabled={isSubmitting || isSavingDraft}
            >
              {isSavingDraft ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Guardar Borrador
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              Enviar Solicitud
            </Button>
          </div>
        </>
      )}
    </form>
  )
}
