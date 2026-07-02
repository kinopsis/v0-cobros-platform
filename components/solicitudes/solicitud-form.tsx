"use client"

import { useState, useMemo, useEffect } from "react"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
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
  Save,
  CalendarIcon,
  Eye
} from "lucide-react"
import { toast } from "sonner"
import { ComboboxBuscable } from "@/components/ui/combobox-buscable"
import { MUNICIPIOS } from "@/lib/municipios"
import { DocumentViewerDialog } from "@/components/pdf-viewer/document-viewer-dialog"

interface SolicitudFormProps {
  mode?: "create" | "edit" | "view"
  solicitudId?: string
}

export function SolicitudForm({ mode = "create", solicitudId }: SolicitudFormProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    radicadoOrigen: "",
    naturaleza: "",
    concepto: "",
  })

  // Estado del radicado dividido: código juzgado + secuencial manual
  const [codigoJuzgado, setCodigoJuzgado] = useState("")
  const [secuencialRadicado, setSecuencialRadicado] = useState("")
  const [codigosJuzgados, setCodigosJuzgados] = useState<{ value: string; label: string }[]>([])
  const [juzgadoInfo, setJuzgadoInfo] = useState<{ codigo: string; nombre: string } | null>(null)
  const [loadingCodigos, setLoadingCodigos] = useState(true)

  // Función helper: longest-prefix-match para descomponer un radicado existente
  const descomponerRadicado = (radicado: string) => {
    if (!radicado || codigosJuzgados.length === 0) return { codigo: "", secuencial: radicado }
    // Ordenar códigos por longitud descendente para longest-prefix-match
    const sorted = [...codigosJuzgados].sort((a, b) => b.value.length - a.value.length)
    for (const opt of sorted) {
      if (radicado.startsWith(opt.value)) {
        return { codigo: opt.value, secuencial: radicado.slice(opt.value.length) }
      }
    }
    return { codigo: "", secuencial: radicado }
  }

  const [sancionados, setSancionados] = useState<Partial<Sancionado>[]>([
    { id: "1", nombreCompleto: "", tipoDocumento: "CC", numeroDocumento: "", tipoPersona: "NATURAL", tipoSancion: "", cantidadSancion: "" }
  ])

  const [documentos, setDocumentos] = useState<File[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [viewingDoc, setViewingDoc] = useState<{nombre:string; url:string; tipo?:string}|null>(null)

  // Opciones de Concepto
  const CONCEPTO_OPTIONS = [
    { value: "ARANCEL", label: "Arancel" },
    { value: "INCAPACIDAD", label: "Incapacidad" },
    { value: "MULTA", label: "Multa" },
    { value: "POLIZA", label: "Póliza" },
    { value: "REINTEGRO", label: "Reintegro" },
  ]

  // Cascada: opciones de Naturaleza según Concepto
  const NATURALEZA_OPTIONS: Record<string, string[]> = {
    ARANCEL: ['ARANCEL - ARANCEL'],
    INCAPACIDAD: ['INCAPACIDAD - INCAPACIDADES'],
    MULTA: [
      'MULTA - CÁMARA DE COMERCIO','MULTA - CAUCIONES','MULTA - COMISARIAS DE FAMILIA',
      'MULTA - CONVERSIÓN DEPÓSITO JUDICIAL','MULTA - CORRECCIONAL',
      'MULTA - INCIDENTE DE DESACATO','MULTA - INCUMPLIMIENTO CONTRACTUAL',
      'MULTA - INDEMNIZACIÓN POR CAUCIONES','MULTA - JUECES DE PAZ',
      'MULTA - JURAMENTO ESTIMATORIO','MULTA - JURISDICCIÓN ADMINISTRATIVA',
      'MULTA - JURISDICCIÓN CIVIL','MULTA - JURISDICCIÓN FAMILIA','MULTA - JURISDICCIÓN LABORAL'
    ],
    POLIZA: ['POLIZA - POLIZA'],
    REINTEGRO: ['REINTEGRO - REINTEGRO'],
  }

  const naturalezaOptions = useMemo(() => 
    formData.concepto ? NATURALEZA_OPTIONS[formData.concepto] || [] : []
  , [formData.concepto])

  // Estado simplificado de fechas del proceso
  const [etapaPreliminar, setEtapaPreliminar] = useState({
    providencia: null as Date | null,
    ejecutoria: null as Date | null,
  })

  const handleEtapaChange = (field: string, value: string | boolean | Date | null) => {
    setEtapaPreliminar(prev => ({ ...prev, [field]: value }))
  }

  const handleConceptoChange = (value: string) => {
    const opciones = NATURALEZA_OPTIONS[value] || []
    const naturalezaAuto = opciones.length === 1 ? opciones[0] : ""
    setFormData(prev => ({ ...prev, concepto: value, naturaleza: naturalezaAuto }))
  }

  // Validación de radicado de 23 dígitos (excepto caso especial "00" = formato libre)
  const validateRadicado = (value: string) => {
    if (!value) return ""
    // Caso especial: código "00" = formato alfanumérico libre
    if (codigoJuzgado === "00") {
      if (value.length < 3) return "El radicado debe tener al menos 3 caracteres"
      return ""
    }
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

  // Manejador de cambio del código de juzgado (Combobox)
  const handleCodigoJuzgadoChange = (value: string) => {
    setCodigoJuzgado(value)
    const found = codigosJuzgados.find(c => c.value === value)
    if (found) {
      // Extraer el nombre del label (formato: "codigo — nombre")
      const nombrePart = found.label.split(" — ").slice(1).join(" — ")
      setJuzgadoInfo({ codigo: value, nombre: nombrePart || found.label })
    } else {
      setJuzgadoInfo(null)
    }
    // Consolidar radicado: código + secuencial
    const consolidado = value === "00" ? secuencialRadicado : value + secuencialRadicado
    setFormData(prev => ({ ...prev, radicadoOrigen: consolidado }))
    if (consolidado) {
      const error = validateRadicado(consolidado)
      setErrors(prev => ({ ...prev, radicadoOrigen: error }))
    }
  }

  // Manejador de cambio del secuencial (dígitos manuales)
  const handleSecuencialChange = (value: string) => {
    setSecuencialRadicado(value)
    // Consolidar radicado: código + secuencial
    const consolidado = codigoJuzgado === "00" ? value : codigoJuzgado + value
    setFormData(prev => ({ ...prev, radicadoOrigen: consolidado }))
    if (consolidado) {
      const error = validateRadicado(consolidado)
      setErrors(prev => ({ ...prev, radicadoOrigen: error }))
    }
  }

  const handleSancionadoChange = (index: number, field: keyof Sancionado, value: string) => {
    setSancionados(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      if (field === "tipoPersona") {
        updated[index].tipoDocumento = value === "JURIDICA" ? "NIT" : "CC"
      }
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
      { id: String(prev.length + 1), nombreCompleto: "", tipoDocumento: "CC", numeroDocumento: "", tipoPersona: "NATURAL", tipoSancion: "", cantidadSancion: "" }
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

    if (!formData.concepto) {
      newErrors.concepto = "Seleccione el concepto"
    }

    if (!formData.naturaleza) {
      newErrors.naturaleza = "Seleccione la naturaleza"
    } else if (formData.concepto) {
      // Validar que la naturaleza pertenezca al concepto seleccionado
      const opcionesValidas = NATURALEZA_OPTIONS[formData.concepto] || []
      if (!opcionesValidas.includes(formData.naturaleza)) {
        newErrors.naturaleza = `La naturaleza no corresponde al concepto "${CONCEPTO_OPTIONS.find(c => c.value === formData.concepto)?.label || formData.concepto}"`
      }
    }

    // Validar fechas obligatorias
    if (!etapaPreliminar.providencia) {
      newErrors.providencia = "Seleccione la fecha de providencia"
    }
    if (!etapaPreliminar.ejecutoria) {
      newErrors.ejecutoria = "Seleccione la fecha de ejecutoria"
    }

    // Validar sancionados
    sancionados.forEach((s, index) => {
      if (!s.tipoPersona) {
        newErrors[`sancionado_${index}_tipo`] = "Seleccione el tipo de sancionado"
      }
      if (!s.numeroDocumento) {
        newErrors[`sancionado_${index}_documento`] = "Ingrese el número de documento"
      }
      if (!s.nombreCompleto) {
        newErrors[`sancionado_${index}_nombre`] = "Ingrese el nombre completo"
      }
      if (!s.tipoSancion) {
        newErrors[`sancionado_${index}_tipoSancion`] = "Seleccione PESOS o SMMLV"
      }
      if (!s.cantidadSancion) {
        newErrors[`sancionado_${index}_valor`] = "Ingrese el valor de la sanción"
      }
    })

    if (documentos.length === 0) {
      newErrors.documentos = "Debe adjuntar al menos un documento PDF"
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

    try {
      const fd = new FormData()
      fd.append("radicado_origen", formData.radicadoOrigen)
      fd.append("naturaleza", formData.naturaleza)
      fd.append("concepto", formData.concepto)
      fd.append("sancionados", JSON.stringify(sancionados))
      fd.append("etapa_preliminar", JSON.stringify(etapaPreliminar))
      
      for (const file of documentos) {
        fd.append("documentos", file)
      }

      const url = isEditMode ? `/api/solicitudes/${solicitudId}` : "/api/solicitudes"
      const method = isEditMode ? "PATCH" : "POST"
      if (isEditMode) fd.append("estado", "EN_VALIDACION")

      const res = await fetch(url, { method, body: fd })
      if (!res.ok) throw new Error((await res.json()).error || "Error al enviar")
      
      const result = await res.json()
      
      if (result.documentos?.errores?.length > 0) {
        toast.warning(`${result.documentos.subidos} docs subidos`)
      } else {
        toast.success(isEditMode ? "Solicitud enviada a validación" : "Solicitud radicada exitosamente")
      }
      
      router.push(`/solicitudes/${result.data?.id || solicitudId}`)
    } catch (err: any) {
      toast.error(err.message || "Error al enviar la solicitud")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveDraft = async () => {
    setIsSavingDraft(true)
    try {
      const fd = new FormData()
      fd.append("radicado_origen", formData.radicadoOrigen)
      fd.append("naturaleza", formData.naturaleza)
      fd.append("concepto", formData.concepto)
      fd.append("sancionados", JSON.stringify(sancionados))
      fd.append("etapa_preliminar", JSON.stringify(etapaPreliminar))
      fd.append("estado", "BORRADOR")
      
      const res = await fetch("/api/solicitudes", { method: "POST", body: fd })
      if (!res.ok) throw new Error((await res.json()).error || "Error al guardar")
      
      const result = await res.json()
      toast.success("Borrador guardado", { description: `ID: ${result.data.id}` })
    } catch (err: any) {
      toast.error(err.message || "Error al guardar el borrador")
    } finally {
      setIsSavingDraft(false)
    }
  }

  const isViewMode = mode === "view"
  const isEditMode = mode === "edit" && solicitudId

  // Cargar códigos de juzgados desde la API
  useEffect(() => {
    async function loadCodigos() {
      try {
        setLoadingCodigos(true)
        const res = await fetch("/api/despachos/codigos")
        if (!res.ok) return
        const json = await res.json()
        const options = (json.data || []).map((c: { codigo: string; nombre: string }) => ({
          value: c.codigo,
          label: `${c.codigo} — ${c.nombre}`,
        }))
        setCodigosJuzgados(options)
      } catch {
        // Silencioso: si falla la carga, el usuario puede digitar manualmente
      } finally {
        setLoadingCodigos(false)
      }
    }
    loadCodigos()
  }, [])

  // Cargar datos del borrador para edición
  useEffect(() => {
    if (!isEditMode || !solicitudId) return
    async function loadSolicitud() {
      try {
        const res = await fetch(`/api/solicitudes/${solicitudId}`)
        if (!res.ok) return
        const { data } = await res.json()
        if (data.estado !== "BORRADOR") { toast.error("Solo se pueden editar borradores"); router.push("/solicitudes"); return }
        setFormData({
          radicadoOrigen: data.radicado_origen || "",
          naturaleza: data.clase_proceso || data.naturaleza || "",
          concepto: data.asunto || data.concepto || "",
        })
        // Descomponer radicado existente (se ejecuta cuando codigosJuzgados ya estén cargados)
        const decomposed = descomponerRadicado(data.radicado_origen || "")
        setCodigoJuzgado(decomposed.codigo)
        setSecuencialRadicado(decomposed.secuencial)
        if (data.sancionados?.length) {
          setSancionados(data.sancionados.map((s: any) => ({
            id: s.id || String(Math.random()),
            nombreCompleto: s.nombre_completo || "",
            tipoDocumento: s.tipo_documento || "CC",
            numeroDocumento: s.numero_documento || "",
            tipoPersona: s.tipo_persona || "NATURAL",
            tipoSancion: s.tipo_sancion || "",
            cantidadSancion: s.cantidad_sancion || "",
            ciudad: s.ciudad || "",
            direccion: s.direccion || "",
          })))
        }
        if (data.etapa_preliminar) {
          setEtapaPreliminar({
            providencia: data.etapa_preliminar.providencia ? new Date(data.etapa_preliminar.providencia) : null,
            ejecutoria: data.etapa_preliminar.ejecutoria ? new Date(data.etapa_preliminar.ejecutoria) : null,
          })
        }
      } catch { }
    }
    loadSolicitud()
  }, [solicitudId, isEditMode])

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Sección 1: Datos del Despacho (oculto para JUZGADO) */}
      {user?.rol !== "JUZGADO" && (
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
              <Input value={user?.codigoDespacho || ""} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Nombre del Juzgado/Tribunal</Label>
              <Input value={user?.nombreJuzgado || ""} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Funcionario Remitente</Label>
              <Input value={user?.nombre || ""} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Correo Institucional</Label>
              <Input value={user?.email || ""} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input value={user?.telefono || ""} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Ciudad</Label>
              <Input value={user?.ciudad || ""} disabled className="bg-muted" />
            </div>
          </CardContent>
        </Card>
      )}

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
        <CardContent className="space-y-6">
          {/* Fila 1: Radicado de Origen (código juzgado + secuencial) */}
          <div className="space-y-4">
            <div>
              <Label>
                Radicado de Origen <span className="text-destructive">*</span>
              </Label>
              <p className="text-xs text-muted-foreground mb-2">
                Seleccione el juzgado por código o nombre, luego digite los dígitos restantes
              </p>
            </div>

            {/* Selector de Juzgado */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Código del Juzgado</Label>
              <ComboboxBuscable
                options={codigosJuzgados}
                value={codigoJuzgado}
                onChange={handleCodigoJuzgadoChange}
                placeholder={loadingCodigos ? "Cargando juzgados..." : "Buscar juzgado por código o nombre..."}
                searchPlaceholder="Escriba código o nombre del juzgado..."
                emptyText="No se encontraron juzgados"
              />
              {juzgadoInfo && (
                <p className="text-xs text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {juzgadoInfo.nombre}
                </p>
              )}
              {codigoJuzgado && !juzgadoInfo && !loadingCodigos && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Código no encontrado en el catálogo. Puede continuar, pero verifique el juzgado.
                </p>
              )}
            </div>

            {/* Dígitos restantes */}
            <div className="space-y-1.5">
              <Label htmlFor="secuencialRadicado" className="text-xs text-muted-foreground">
                {codigoJuzgado === "00"
                  ? "Número de radicado (formato libre)"
                  : `Dígitos restantes (${codigoJuzgado ? 23 - codigoJuzgado.length : 23} dígitos)`}
              </Label>
              <Input
                id="secuencialRadicado"
                placeholder={
                  codigoJuzgado === "00"
                    ? "ej: DESAJMER25-9488"
                    : codigoJuzgado
                      ? `Ingrese los ${23 - codigoJuzgado.length} dígitos restantes`
                      : "Primero seleccione un juzgado"
                }
                value={secuencialRadicado}
                onChange={(e) => handleSecuencialChange(e.target.value)}
                disabled={isViewMode || (!codigoJuzgado && !secuencialRadicado)}
                maxLength={codigoJuzgado === "00" ? undefined : codigoJuzgado ? 23 - codigoJuzgado.length : 23}
                className={errors.radicadoOrigen ? "border-destructive" : ""}
              />
            </div>

            {/* Validación del radicado consolidado */}
            {errors.radicadoOrigen && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />{errors.radicadoOrigen}
              </p>
            )}
            {formData.radicadoOrigen && !errors.radicadoOrigen && codigoJuzgado && juzgadoInfo && (
              codigoJuzgado === "00" ? (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />Formato libre — {juzgadoInfo.nombre}
                </p>
              ) : formData.radicadoOrigen.length === 23 ? (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />Formato válido — {juzgadoInfo.nombre}
                </p>
              ) : null
            )}
          </div>

          {/* Fila 2: Concepto + Naturaleza (cascada) */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="concepto">
                Concepto <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.concepto}
                onValueChange={handleConceptoChange}
                disabled={isViewMode}
              >
                <SelectTrigger className={errors.concepto ? "border-destructive" : ""}>
                  <SelectValue placeholder="Seleccione..." />
                </SelectTrigger>
                <SelectContent>
                  {CONCEPTO_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.concepto && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />{errors.concepto}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="naturaleza">
                Naturaleza <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.naturaleza}
                onValueChange={(value) => handleInputChange("naturaleza", value)}
                disabled={isViewMode}
              >
                <SelectTrigger className={errors.naturaleza ? "border-destructive" : ""}>
                  <SelectValue placeholder={formData.concepto ? "Seleccione..." : "Primero seleccione Concepto"} />
                </SelectTrigger>
                <SelectContent>
                  {naturalezaOptions.map(opt => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.naturaleza && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />{errors.naturaleza}
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Fechas del Proceso */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Fechas del Proceso
            </h4>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Providencia <span className="text-destructive">*</span></Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" disabled={isViewMode}
                      className={cn("w-full justify-start text-left font-normal",
                        !etapaPreliminar.providencia && "text-muted-foreground",
                        errors.providencia && "border-destructive"
                      )}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {etapaPreliminar.providencia ? format(etapaPreliminar.providencia, "dd/MM/yyyy", { locale: es }) : "Seleccionar fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={etapaPreliminar.providencia || undefined}
                      onSelect={(date) => handleEtapaChange("providencia", date || null)} locale={es} />
                  </PopoverContent>
                </Popover>
                {errors.providencia && (
                  <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.providencia}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Ejecutoria <span className="text-destructive">*</span></Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" disabled={isViewMode}
                      className={cn("w-full justify-start text-left font-normal",
                        !etapaPreliminar.ejecutoria && "text-muted-foreground",
                        errors.ejecutoria && "border-destructive"
                      )}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {etapaPreliminar.ejecutoria ? format(etapaPreliminar.ejecutoria, "dd/MM/yyyy", { locale: es }) : "Seleccionar fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={etapaPreliminar.ejecutoria || undefined}
                      onSelect={(date) => handleEtapaChange("ejecutoria", date || null)} locale={es} />
                  </PopoverContent>
                </Popover>
                {errors.ejecutoria && (
                  <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.ejecutoria}</p>
                )}
              </div>
            </div>
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
                Personas Sancionadas
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
              
              <div className="space-y-3">
                {/* Fila 1: Tipo de Sancionado */}
                <div className="space-y-2">
                  <Label>Tipo de Sancionado</Label>
                  <Select
                    value={sancionado.tipoPersona}
                    onValueChange={(value) => handleSancionadoChange(index, "tipoPersona", value as TipoPersona)}
                    disabled={isViewMode}
                  >
                    <SelectTrigger className={errors[`sancionado_${index}_tipo`] ? "border-destructive" : ""}>
                      <SelectValue placeholder="Seleccione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TIPO_PERSONA_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors[`sancionado_${index}_tipo`] && (
                    <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors[`sancionado_${index}_tipo`]}</p>
                  )}
                </div>

                {/* Fila 2: Tipo Documento + Número Documento */}
                <div className="grid gap-4 grid-cols-[30%_70%]">
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
                    {errors[`sancionado_${index}_documento`] && (
                      <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors[`sancionado_${index}_documento`]}</p>
                    )}
                  </div>
                </div>

                {/* Fila 3: Nombre Completo */}
                <div className="space-y-2">
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
                  {errors[`sancionado_${index}_nombre`] && (
                    <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors[`sancionado_${index}_nombre`]}</p>
                  )}
                </div>

                {/* Fila 4: Valor Sanción */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-muted-foreground">Valor Sanción</Label>
                  <div className="grid gap-4 grid-cols-[30%_70%]">
                    <div className="space-y-2">
                      <Label htmlFor={`tipoSancion_${index}`}>Tipo de Sanción</Label>
                      <Select
                        value={sancionado.tipoSancion || ""}
                        onValueChange={(value) => handleSancionadoChange(index, "tipoSancion", value)}
                        disabled={isViewMode}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PESOS">PESOS</SelectItem>
                          <SelectItem value="SMMLV">SMMLV</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors[`sancionado_${index}_tipoSancion`] && (
                        <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors[`sancionado_${index}_tipoSancion`]}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`cantidadSancion_${index}`}>Valor Sanción</Label>
                      <Input
                        id={`cantidadSancion_${index}`}
                        placeholder="Ingrese el valor"
                        value={sancionado.cantidadSancion || ""}
                        onChange={(e) => handleSancionadoChange(index, "cantidadSancion", e.target.value)}
                        disabled={isViewMode}
                        className={errors[`sancionado_${index}_valor`] ? "border-destructive" : ""}
                      />
                      {errors[`sancionado_${index}_valor`] && (
                        <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors[`sancionado_${index}_valor`]}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Fila 5: Ciudad + Dirección */}
                <div className="grid gap-4 grid-cols-[30%_70%]">
                  <div className="space-y-2">
                    <Label>Ciudad</Label>
                    <ComboboxBuscable
                      options={MUNICIPIOS}
                      value={sancionado.ciudad || ""}
                      onChange={(v) => handleSancionadoChange(index, "ciudad", v)}
                      placeholder="Buscar municipio..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Dirección</Label>
                    <Input
                      placeholder="Dirección"
                      value={sancionado.direccion || ""}
                      onChange={(e) => handleSancionadoChange(index, "direccion", e.target.value)}
                      disabled={isViewMode}
                    />
                  </div>
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
                    <div className="flex items-center gap-1">
                      <Button type="button" variant="ghost" size="icon"
                        onClick={() => removeFile(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon"
                        onClick={() => {
                          if (viewingDoc) URL.revokeObjectURL(viewingDoc.url)
                          setViewingDoc({ nombre: file.name, url: URL.createObjectURL(file), tipo: file.type || "application/pdf" })
                        }}
                        title="Vista previa">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  {file.size > 5 * 1024 * 1024 && (
                    <Badge variant="destructive" className="text-xs ml-2">+5MB</Badge>
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

      <DocumentViewerDialog
        open={!!viewingDoc}
        onOpenChange={(o) => { if (!o) { if (viewingDoc) URL.revokeObjectURL(viewingDoc.url); setViewingDoc(null); } }}
        document={viewingDoc}
      />
    </form>
  )
}
