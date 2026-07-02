"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Loader2, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react"
import { toast } from "sonner"

export function Office365SyncCard() {
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<any>(null)
  const [autoSync, setAutoSync] = useState(false)

  const handleSync = async () => {
    setSyncing(true)
    setSyncResult(null)
    try {
      const res = await fetch("/api/admin/office365/sync", { method: "POST" })
      const data = await res.json()
      setSyncResult(data)
      if (data.success) {
        toast.success(`Sincronizacion completada: ${data.totalSincronizados} usuarios`)
      } else {
        toast.error(data.error || "Error en sincronizacion")
      }
    } catch (error: any) {
      toast.error(error.message || "Error de conexion")
    } finally {
      setSyncing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Sincronizacion de Usuarios
          {syncResult?.success ? (
            <Badge className="bg-green-100 text-green-800">
              <CheckCircle2 className="mr-1 h-3 w-3" /> Al dia
            </Badge>
          ) : syncResult && !syncResult.success ? (
            <Badge className="bg-red-100 text-red-800">
              <AlertCircle className="mr-1 h-3 w-3" /> Error
            </Badge>
          ) : (
            <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>
          )}
        </CardTitle>
        <CardDescription>Sincronizacion de usuarios con Azure AD</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {syncResult && (
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Usuarios sincronizados</span>
              <span className="font-medium">{syncResult.totalSincronizados || 0}</span>
            </div>
            {syncResult.duracion && (
              <div className="flex justify-between text-sm">
                <span>Duracion</span>
                <span className="font-medium">{syncResult.duracion}</span>
              </div>
            )}
          </div>
        )}

        {syncing && <Progress value={66} className="h-2" />}

        <div className="flex items-center space-x-2">
          <Switch
            id="autoSync"
            checked={autoSync}
            onCheckedChange={setAutoSync}
          />
          <Label htmlFor="autoSync">Sincronizacion automatica (diaria 2:00 AM)</Label>
        </div>

        <Button
          onClick={handleSync}
          disabled={syncing}
          className="w-full"
        >
          {syncing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sincronizando...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Sincronizar Ahora
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
