"use client"

import { use, useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/lib/auth-context"
import { Solicitud, NATURALEZA_LABELS, CONCEPTO_LABELS, CLASE_PROCESO_LABELS, ASUNTO_LABELS, ESTADO_LABELS, ESTADO_COLORS } from "@/lib/types"
import { toast } from "sonner"
import { ArrowLeft, Save, Loader2, AlertCircle } from "lucide-react"

export default function EditarSolicitudPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { user } = useAuth()

  const [solicitud, setSolicitud] = useState<Solicitud | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Campos editables
  const [radicadoOrigen, setRadicadoOrigen] = useState("")
  const [juzgadoConocimiento, setJuzgadoConocimiento] = useState("")
  const [descripcionProceso, setDescripcionProceso] = useState("")
  const [claseProceso, setClaseProceso] = useState("")
  const [asunto, setAsunto] = useState("")
  const [observaciones, setObservaciones] = useState("")

  useEffect(() => {
    async function loadSolicitud() {
      try {
        const res = await fetch(`/api/solicitudes/${id}`)
        if (!res.ok) throw new Error("No encontrada")
        const json = await res.json()
        const d = json.data

        // Verificar pertenencia al JUZGADO
        if (user?.rol === "JUZGADO" && d.correo_institucional !== user.email) {
          setError("No tiene permiso para editar esta solicitud")
          setLoading(false)
          return
        }

        const sol: Solicitud = {
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
          juzgadoConocimiento: d.juzgado_conocimiento || "",
          descripcionProceso: d.descripcion_proceso || "",
          estado: d.estado,
          prioridad: d.prioridad || "MEDIA",
          diasSLA: d.dias_sla || 10,
          sancionados: [],
          documentosAdjuntos: [],
          observaciones: d.observaciones || "",
        }

        setSolicitud(sol)
        setRadicadoOrigen(sol.radicadoOrigen)
        setJuzgadoConocimiento(sol.juzgadoConocimiento)
        setDescripcionProceso(sol.descripcionProceso)
        setClaseProceso(sol.naturaleza)
        setAsunto(sol.concepto)
        setObservaciones(sol.observaciones || "")
      } catch (err: any) {
        setError(err.message || "Error al cargar")
      } finally {
        setLoading(false)
      }
    }
    loadSolicitud()
  }, [id, user])

  const handleGuardar = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/solicitudes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          radicado_origen: radicadoOrigen,
          juzgado_conocimiento: juzgadoConocimiento,
          descripcion_proceso: descripcionProceso,
          clase_proceso: claseProceso,
          asunto: asunto,
          observaciones: observaciones,
        }),
      })
      if (!res.ok) throw new Error("Error al guardar")
      toast.success("Solicitud actualizada correctamente")
      router.push(`/solicitudes/${id}`)
      router.refresh()
    } catch (err: any) {
      toast.error("Error al guardar", { description: err.message })
    } finally {
      setSaving(false)
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
        <h2 className="text-xl font-semibold">Error</h2>
        <p className="text-muted-foreground mb-4">{error || "Solicitud no encontrada"}</p>
        <Button asChild>
          <Link href={`/solicitudes/${id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al detalle
          </Link>
        </Button>
      </div>
    )
  }

  const estadosEditables = ["EN_VALIDACION", "DEVUELTA_POR_GESTOR", "DEVUELTA_POR_ABOGADO"]
  const puedeEditar = user?.rol === "JUZGADO" && estadosEditables.includes(solicitud.estado)

  if (!puedeEditar) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">No editable</h2>
        <p className="text-muted-foreground mb-4">
          Esta solicitud está en estado "{ESTADO_LABELS[solicitud.estado]}" y no puede ser editada.
        </p>
        <Button asChild>
          <Link href={`/solicitudes/${id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al detalle
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/solicitudes/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Editar Solicitud {solicitud.id}
          </h1>
          <p className="text-muted-foreground">
            <Badge className={`mr-2 ${ESTADO_COLORS[solicitud.estado]}`}>
              {ESTADO_LABELS[solicitud.estado]}
            </Badge>
            {solicitud.nombreJuzgado}
          </p>
        </div>
      </div>

      <Separator />

      {/* Formulario */}
      <Card>
        <CardHeader>
          <CardTitle>Datos del Proceso</CardTitle>
          <CardDescription>Modifique los campos necesarios y guarde los cambios</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="radicado">Radicado de Origen</Label>
              <Input
                id="radicado"
                value={radicadoOrigen}
                onChange={(e) => setRadicadoOrigen(e.target.value)}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clase">Clase de Proceso</Label>
              <Select value={claseProceso} onValueChange={setClaseProceso}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CLASE_PROCESO_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="asunto">Asunto</Label>
              <Select value={asunto} onValueChange={setAsunto}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ASUNTO_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="juzgado">Juzgado de Conocimiento</Label>
              <Input
                id="juzgado"
                value={juzgadoConocimiento}
                onChange={(e) => setJuzgadoConocimiento(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción del Proceso</Label>
            <Textarea
              id="descripcion"
              value={descripcionProceso}
              onChange={(e) => setDescripcionProceso(e.target.value)}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="obs">Observaciones</Label>
            <Textarea
              id="obs"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={3}
              placeholder="Observaciones adicionales..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Acciones */}
      <div className="flex gap-2 justify-end">
        <Button variant="outline" asChild>
          <Link href={`/solicitudes/${id}`}>Cancelar</Link>
        </Button>
        <Button onClick={handleGuardar} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Guardar Cambios
        </Button>
      </div>
    </div>
  )
}
