'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Bell, CheckCircle, AlertCircle, Info, Trash2, Archive } from 'lucide-react'
import { toast } from 'sonner'

const notificaciones = [
  {
    id: 1,
    tipo: 'asignacion',
    titulo: 'Nuevo caso asignado',
    descripcion: 'Se le ha asignado el caso #2024-001245 para gestión',
    fecha: '2024-06-15 14:30',
    leida: false,
    icono: <CheckCircle className="h-5 w-5 text-blue-600" />
  },
  {
    id: 2,
    tipo: 'alerta',
    titulo: 'Vencimiento de plazo próximo',
    descripcion: 'El plazo para el caso #2024-001200 vence en 3 días',
    fecha: '2024-06-15 10:15',
    leida: false,
    icono: <AlertCircle className="h-5 w-5 text-orange-600" />
  },
  {
    id: 3,
    tipo: 'info',
    titulo: 'Pago registrado',
    descripcion: 'Se registró un pago de $500.000 en el caso #2024-001180',
    fecha: '2024-06-14 16:45',
    leida: true,
    icono: <Info className="h-5 w-5 text-green-600" />
  },
  {
    id: 4,
    tipo: 'alerta',
    titulo: 'Cambio de estado',
    descripcion: 'El caso #2024-001160 cambió a estado "En Coactiva"',
    fecha: '2024-06-14 12:20',
    leida: true,
    icono: <CheckCircle className="h-5 w-5 text-blue-600" />
  },
  {
    id: 5,
    tipo: 'info',
    titulo: 'Nuevo documento adjunto',
    descripcion: 'Se adjuntó sentencia en el caso #2024-001150',
    fecha: '2024-06-13 09:30',
    leida: true,
    icono: <Info className="h-5 w-5 text-green-600" />
  }
]

export default function NotificacionesPage() {
  const [notifs, setNotifs] = useState(notificaciones)
  const [filtro, setFiltro] = useState('todas')

  const notifsFiltradas = notifs.filter(n => {
    if (filtro === 'no-leidas') return !n.leida
    if (filtro === 'leidas') return n.leida
    return true
  })

  const handleMarcarLeida = (id: number) => {
    setNotifs(notifs.map(n => n.id === id ? { ...n, leida: true } : n))
    toast.success('Notificación marcada como leída')
  }

  const handleEliminar = (id: number) => {
    setNotifs(notifs.filter(n => n.id !== id))
    toast.success('Notificación eliminada')
  }

  const handleArchivar = (id: number) => {
    setNotifs(notifs.filter(n => n.id !== id))
    toast.success('Notificación archivada')
  }

  const noLeidas = notifs.filter(n => !n.leida).length

  return (
    <div className="space-y-8 p-8">
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
                <div className="flex gap-4">
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
                  <div className="flex gap-2">
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
                <div className="flex gap-4">
                  <div className="flex-shrink-0 pt-1">
                    {notif.icono}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">{notif.titulo}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{notif.descripcion}</p>
                    <p className="text-xs text-muted-foreground mt-2">{notif.fecha}</p>
                  </div>
                  <div className="flex gap-2">
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
                <div className="flex gap-4">
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
    </div>
  )
}
