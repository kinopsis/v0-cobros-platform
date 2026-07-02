"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { ROLES, DISPONIBILIDADES, CLASES_PROCESO } from "@/lib/validations/usuario-schema"

interface UsuarioDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  usuario?: any // Usuario existente para edicion, undefined para creacion
  onSuccess: () => void
}

export function UsuarioDialog({ open, onOpenChange, usuario, onSuccess }: UsuarioDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    nombre: "",
    rol: "JUZGADO" as string,
    activo: true,
    codigo_despacho: "",
    nombre_juzgado: "",
    telefono: "",
    ciudad: "",
    distrito: "",
    circuito: "",
    especialidades: [] as string[],
    capacidad_maxima: 20,
    disponibilidad: "DISPONIBLE" as string,
  })

  const isEditing = !!usuario

  useEffect(() => {
    if (usuario) {
      setFormData({
        email: usuario.email || "",
        nombre: usuario.nombre || "",
        rol: usuario.rol || "JUZGADO",
        activo: usuario.activo ?? true,
        codigo_despacho: usuario.codigo_despacho || "",
        nombre_juzgado: usuario.nombre_juzgado || "",
        telefono: usuario.telefono || "",
        ciudad: usuario.ciudad || "",
        distrito: usuario.distrito || "",
        circuito: usuario.circuito || "",
        especialidades: usuario.especialidades || [],
        capacidad_maxima: usuario.capacidad_maxima || 20,
        disponibilidad: usuario.disponibilidad || "DISPONIBLE",
      })
    } else {
      setFormData({
        email: "",
        nombre: "",
        rol: "JUZGADO",
        activo: true,
        codigo_despacho: "",
        nombre_juzgado: "",
        telefono: "",
        ciudad: "",
        distrito: "",
        circuito: "",
        especialidades: [],
        capacidad_maxima: 20,
        disponibilidad: "DISPONIBLE",
      })
    }
  }, [usuario, open])

  const handleChange = (field: string, value: string | boolean | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleEspecialidadToggle = (especialidad: string) => {
    setFormData((prev) => {
      const current = prev.especialidades
      if (current.includes(especialidad)) {
        return { ...prev, especialidades: current.filter((e) => e !== especialidad) }
      }
      return { ...prev, especialidades: [...current, especialidad] }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = isEditing ? `/api/usuarios/${usuario.id}` : "/api/usuarios"
      const method = isEditing ? "PATCH" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al guardar usuario")
      }

      toast.success(isEditing ? "Usuario actualizado correctamente" : "Usuario creado correctamente")
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error.message || "Error al guardar usuario")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Usuario" : "Nuevo Usuario"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifique los datos del usuario seleccionado"
              : "Complete el formulario para crear un nuevo usuario"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campos base */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                required
                disabled={isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => handleChange("nombre", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rol">Rol *</Label>
              <Select value={formData.rol} onValueChange={(v) => handleChange("rol", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((rol) => (
                    <SelectItem key={rol} value={rol}>
                      {rol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 flex items-end pb-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="activo"
                  checked={formData.activo}
                  onCheckedChange={(v) => handleChange("activo", v)}
                />
                <Label htmlFor="activo">Usuario Activo</Label>
              </div>
            </div>
          </div>

          {/* Campos especificos JUZGADO */}
          {formData.rol === "JUZGADO" && (
            <div className="space-y-4 border rounded-lg p-4">
              <h4 className="font-medium text-sm">Datos del Despacho</h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Codigo Despacho</Label>
                  <Input
                    value={formData.codigo_despacho}
                    onChange={(e) => handleChange("codigo_despacho", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nombre Juzgado</Label>
                  <Input
                    value={formData.nombre_juzgado}
                    onChange={(e) => handleChange("nombre_juzgado", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefono</Label>
                  <Input
                    value={formData.telefono}
                    onChange={(e) => handleChange("telefono", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ciudad</Label>
                  <Input
                    value={formData.ciudad}
                    onChange={(e) => handleChange("ciudad", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Distrito</Label>
                  <Input
                    value={formData.distrito}
                    onChange={(e) => handleChange("distrito", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Circuito</Label>
                  <Input
                    value={formData.circuito}
                    onChange={(e) => handleChange("circuito", e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Campos especificos ABOGADO */}
          {formData.rol === "ABOGADO" && (
            <div className="space-y-4 border rounded-lg p-4">
              <h4 className="font-medium text-sm">Datos del Abogado</h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Capacidad Maxima</Label>
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    value={formData.capacidad_maxima}
                    onChange={(e) => handleChange("capacidad_maxima", parseInt(e.target.value) || 20)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Disponibilidad</Label>
                  <Select value={formData.disponibilidad} onValueChange={(v) => handleChange("disponibilidad", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DISPONIBILIDADES.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Especialidades</Label>
                <div className="flex flex-wrap gap-2">
                  {CLASES_PROCESO.map((esp) => (
                    <Button
                      key={esp}
                      type="button"
                      variant={formData.especialidades.includes(esp) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleEspecialidadToggle(esp)}
                    >
                      {esp.replace(/_/g, " ")}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Guardar Cambios" : "Crear Usuario"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
