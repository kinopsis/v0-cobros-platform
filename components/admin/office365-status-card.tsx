"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle2, XCircle, RefreshCw } from "lucide-react"
import { toast } from "sonner"

interface Office365Status {
  conectado: boolean
  tenantId: string | null
  dominioPermitido: string
  ultimaSync: string | null
  usuariosSincronizados: number
  totalUsuarios: number
  estado: string
}

export function Office365StatusCard() {
  const [status, setStatus] = useState<Office365Status | null>(null)
  const [loading, setLoading] = useState(true)
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/admin/office365/status")
      if (res.ok) {
        const data = await res.json()
        setStatus(data)
      }
    } catch (error) {
      console.error("Error fetching O365 status:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleTestConnection = async () => {
    setTesting(true)
    try {
      // Intentar obtener las credenciales de la configuracion
      const configRes = await fetch("/api/configuracion")
      const configData = await configRes.json()
      const o365 = configData.data?.office365 || {}

      if (!o365.tenant_id || !o365.client_id) {
        toast.error("Configure Tenant ID y Client ID en la seccion Office 365 de Configuracion")
        return
      }

      const res = await fetch("/api/admin/office365/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: o365.tenant_id,
          clientId: o365.client_id,
          clientSecret: "", // Se necesita el secret real
        }),
      })

      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
      } else {
        toast.error(data.error || "Error al probar conexion")
      }
    } catch (error: any) {
      toast.error(error.message || "Error de conexion")
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Office 365 - Estado de Conexion</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse text-muted-foreground">Cargando estado...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Office 365 - Estado de Conexion
          {status?.conectado ? (
            <Badge className="bg-green-100 text-green-800">
              <CheckCircle2 className="mr-1 h-3 w-3" /> Conectado
            </Badge>
          ) : (
            <Badge className="bg-red-100 text-red-800">
              <XCircle className="mr-1 h-3 w-3" /> No Configurado
            </Badge>
          )}
        </CardTitle>
        <CardDescription>Estado de la integracion con Azure AD</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Tenant ID</p>
            <p className="font-mono text-sm">{status?.tenantId || "No configurado"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Dominio Permitido</p>
            <p className="font-medium">{status?.dominioPermitido || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Usuarios Sincronizados</p>
            <p className="font-medium">
              {status?.usuariosSincronizados || 0} / {status?.totalUsuarios || 0}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Ultima Sincronizacion</p>
            <p className="font-medium">
              {status?.ultimaSync
                ? new Date(status.ultimaSync).toLocaleString("es-CO")
                : "Nunca"}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={handleTestConnection}
          disabled={testing}
          className="w-full"
        >
          {testing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Probar Conexion
        </Button>
      </CardContent>
    </Card>
  )
}
