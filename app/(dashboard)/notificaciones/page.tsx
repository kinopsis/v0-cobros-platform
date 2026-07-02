'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Bell, CheckCircle, AlertCircle, Info, Trash2, Archive, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function NotificacionesPage() {
  const [notifs, setNotifs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('todas')

  useEffect(() => {
    async function fetchNotificaciones() {
      try {
        const res = await fetch('/api/notificaciones')
        if (!res.ok) throw new Error('Error al cargar notificaciones')
        const json = await res.json()
        const mapped = (json.data || []).map((n: any) => ({
          id: n.id,
          tipo: n.tipo,
          titulo: n.titulo,
          descripcion: n.mensaje,
          fecha: n.fecha_creacion,
          leida: n.leida,
          icono: n.tipo === 'alerta' || n.tipo === 'ALERTA_INACTIVIDAD'
            ? <AlertCircle className="h-5 w-5 text-orange-600" />
            : n.tipo === 'info'
              ? <Info className="h-5 w-5 text-green-600" />
              : <CheckCircle className="h-5 w-5 text-blue-600" />,
        }))
        setNotifs(mapped)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchNotificaciones()
  }, [])

  const notifsFiltradas = notifs.filter(n => {
    if (filtro === 'no-leidas') return !n.leida
    if (filtro === 'leidas') return n.leida
    return true
  })

  const handleMarcarLeida = async (id: string) => {
    try {
      const res = await fetch('/api/notificaciones', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id], accion: 'marcar_leidas' }),
      })
      if (!res.ok) throw new Error('Error al marcar como leída')
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n))
      toast.success('Notificación marcada como leída')
    } catch {
      toast.error('Error al marcar como leída')
    }
  }

  const handleEliminar = (id: string) => {
    setNotifs(prev => prev.filter(n => n.id !== id))
    toast.success('Notificación eliminada')
  }

  const handleArchivar = (id: string) => {
    setNotifs(prev => prev.filter(n => n.id !== id))
    toast.success('Notificación archivada')
  }

  const noLeidas = notifs.filter(n => !n.leida).length

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notificaciones</h1>
          <p className="text-muted-foreground mt-2">Recibe alertas sobre tus casos y asignaciones</p>
        </div>
        {noLeidas > 0 && (
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
            <Bell className="h-5 w-5 text-blue-600" />
            <span className="font-semibold text-blue-900">{noLeidas} nuevas</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
      <Tabs defaultValue="todas" value={filtro} onValueChange={setFiltro}>
        <TabsList>
          <TabsTrigger value="todas">Todas ({notifs.length})</TabsTrigger>
          <TabsTrigger value="no-leidas">No leídas ({noLeidas})</TabsTrigger>
          <TabsTrigger value="leidas">Leídas</TabsTrigger>
        </TabsList>

        <TabsContent value="todas" className="space-y-4 mt-6">
          {notifsFiltradas.map((notif) => (
            <Card key={notif.id} className={notif.leida ? 'opacity-75' : ''}>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <div className="flex-shrink-0 pt-1">
                    {notif.icono}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm">{notif.titulo}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{notif.descripcion}</p>
                        <p className="text-xs text-muted-foreground mt-2">{notif.fecha}</p>
                      </div>
                      {!notif.leida && (
                        <div className="h-2 w-2 rounded-full bg-blue-600 ml-4 mt-1" />
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2 sm:mt-0">
                    {!notif.leida && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarcarLeida(notif.id)}
                        className="text-xs"
                      >
                        Marcar leída
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleArchivar(notif.id)}
                    >
                      <Archive className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEliminar(notif.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {notifsFiltradas.length === 0 && (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                <p className="text-muted-foreground">No hay notificaciones en este filtro</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="no-leidas" className="space-y-4 mt-6">
          {notifsFiltradas.map((notif) => (
            <Card key={notif.id}>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <div className="flex-shrink-0 pt-1">
                    {notif.icono}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">{notif.titulo}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{notif.descripcion}</p>
                    <p className="text-xs text-muted-foreground mt-2">{notif.fecha}</p>
                  </div>
                  <div className="flex gap-2 mt-2 sm:mt-0">
                    <Button
                      onClick={() => handleMarcarLeida(notif.id)}
                      size="sm"
                      className="text-xs"
                    >
                      Marcar leída
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEliminar(notif.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="leidas" className="space-y-4 mt-6">
          {notifsFiltradas.map((notif) => (
            <Card key={notif.id} className="opacity-75">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <div className="flex-shrink-0 pt-1">
                    {notif.icono}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">{notif.titulo}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{notif.descripcion}</p>
                    <p className="text-xs text-muted-foreground mt-2">{notif.fecha}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEliminar(notif.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
      )}
    </div>
  )
}
