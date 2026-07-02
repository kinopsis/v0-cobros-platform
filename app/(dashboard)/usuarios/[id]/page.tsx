"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { UsuarioDialog } from "@/components/usuarios/usuario-dialog"
import { ArrowLeft, User, Building2, Briefcase, Shield, Clock, CheckCircle2, XCircle } from "lucide-react"

const roleColors: Record<string, string> = {
  JUZGADO: "bg-blue-100 text-blue-800",
  GESTOR: "bg-purple-100 text-purple-800",
  ABOGADO: "bg-green-100 text-green-800",
  ADMIN: "bg-red-100 text-red-800",
}

export default function UsuarioDetallePage() {
  const params = useParams()
  const router = useRouter()
  const [usuario, setUsuario] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)

  useEffect(() => {
    fetchUsuario()
  }, [params.id])

  const fetchUsuario = async () => {
    try {
      const res = await fetch(`/api/usuarios/${params.id}`)
      if (!res.ok) throw new Error("Usuario no encontrado")
      const { data } = await res.json()
      setUsuario(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Cargando usuario...</div>
      </div>
    )
  }

  if (!usuario) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Usuario no encontrado</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{usuario.nombre}</h1>
          <p className="text-muted-foreground">{usuario.email}</p>
        </div>
        <Badge className={roleColors[usuario.rol]}>{usuario.rol}</Badge>
        <Badge className={usuario.activo ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
          {usuario.activo ? "Activo" : "Inactivo"}
        </Badge>
        <Button variant="outline" onClick={() => setEditOpen(true)}>
          Editar
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Datos Personales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Datos Personales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nombre</span>
              <span className="font-medium">{usuario.nombre}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{usuario.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rol</span>
              <Badge className={roleColors[usuario.rol]}>{usuario.rol}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Estado</span>
              {usuario.activo ? (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle2 className="mr-1 h-3 w-3" /> Activo
                </Badge>
              ) : (
                <Badge className="bg-red-100 text-red-800">
                  <XCircle className="mr-1 h-3 w-3" /> Inactivo
                </Badge>
              )}
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ultimo Acceso</span>
              <span className="font-medium">
                {usuario.ultimo_acceso
                  ? new Date(usuario.ultimo_acceso).toLocaleString("es-CO")
                  : "Nunca"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fecha Creacion</span>
              <span className="font-medium">
                {usuario.created_at
                  ? new Date(usuario.created_at).toLocaleDateString("es-CO")
                  : "N/A"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Office 365 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Office 365
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Azure OID</span>
              <span className="font-medium text-sm font-mono">
                {usuario.azure_oid ? `${usuario.azure_oid.substring(0, 16)}...` : "No vinculado"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Estado Sincronizacion</span>
              <Badge className={usuario.azure_oid ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                {usuario.azure_oid ? "Vinculado" : "Pendiente"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Dominio</span>
              <span className="font-medium">{usuario.email?.split("@")[1] || "N/A"}</span>
            </div>
          </CardContent>
        </Card>

        {/* Datos del Despacho (si es JUZGADO) */}
        {usuario.rol === "JUZGADO" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Datos del Despacho
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Codigo Despacho</span>
                <span className="font-medium">{usuario.codigo_despacho || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nombre Juzgado</span>
                <span className="font-medium">{usuario.nombre_juzgado || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Telefono</span>
                <span className="font-medium">{usuario.telefono || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ciudad</span>
                <span className="font-medium">{usuario.ciudad || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Distrito</span>
                <span className="font-medium">{usuario.distrito || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Circuito</span>
                <span className="font-medium">{usuario.circuito || "N/A"}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Datos del Abogado (si es ABOGADO) */}
        {usuario.rol === "ABOGADO" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Datos del Abogado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Especialidades</span>
                <div className="flex gap-1 flex-wrap justify-end">
                  {(usuario.especialidades || []).map((esp: string) => (
                    <Badge key={esp} variant="secondary" className="text-xs">
                      {esp.replace(/_/g, " ")}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Capacidad Maxima</span>
                <span className="font-medium">{usuario.capacidad_maxima || 20}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Disponibilidad</span>
                <Badge className={
                  usuario.disponibilidad === "DISPONIBLE" ? "bg-green-100 text-green-800" :
                  usuario.disponibilidad === "MEDIA" ? "bg-yellow-100 text-yellow-800" :
                  "bg-red-100 text-red-800"
                }>
                  {usuario.disponibilidad || "DISPONIBLE"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Casos Activos</span>
                <span className="font-medium">{usuario.casos_activos || 0}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actividad Reciente */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Actividad Reciente
            </CardTitle>
            <CardDescription>Ultimas 10 acciones del usuario</CardDescription>
          </CardHeader>
          <CardContent>
            {usuario.actividad_reciente?.length > 0 ? (
              <div className="space-y-3">
                {usuario.actividad_reciente.map((log: any) => (
                  <div key={log.id} className="flex items-start gap-3 text-sm">
                    <div className="min-w-[120px] text-muted-foreground">
                      {new Date(log.timestamp).toLocaleString("es-CO")}
                    </div>
                    <div>
                      <span className="font-medium">{log.tipo_accion}</span>
                      {log.observaciones && (
                        <p className="text-muted-foreground text-xs">{log.observaciones}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Sin actividad registrada</p>
            )}
          </CardContent>
        </Card>
      </div>

      <UsuarioDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        usuario={usuario}
        onSuccess={fetchUsuario}
      />
    </div>
  )
}
