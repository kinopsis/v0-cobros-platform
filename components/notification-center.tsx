'use client'

import { useState } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const notificaciones = [
  {
    id: 1,
    titulo: 'Nuevo caso asignado',
    descripcion: 'Caso #2024-001245 para gestión',
    fecha: 'Hace 2 minutos',
    leida: false,
  },
  {
    id: 2,
    titulo: 'Vencimiento próximo',
    descripcion: 'Caso #2024-001200 vence en 3 días',
    fecha: 'Hace 1 hora',
    leida: false,
  },
  {
    id: 3,
    titulo: 'Pago registrado',
    descripcion: '$500.000 en caso #2024-001180',
    fecha: 'Hace 5 horas',
    leida: true,
  },
]

export function NotificationCenter() {
  const [notifs, setNotifs] = useState(notificaciones)
  const noLeidas = notifs.filter(n => !n.leida).length

  const handleMarcarLeida = (id: number) => {
    setNotifs(notifs.map(n => n.id === id ? { ...n, leida: true } : n))
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {noLeidas > 0 && (
            <span className="absolute top-1 right-1 h-2 w-2 bg-red-600 rounded-full" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Notificaciones</span>
          {noLeidas > 0 && <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">{noLeidas} nuevas</span>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <div className="max-h-96 overflow-y-auto">
          {notifs.map((notif) => (
            <button
              key={notif.id}
              onClick={() => handleMarcarLeida(notif.id)}
              className={`w-full text-left px-3 py-2 hover:bg-secondary transition-colors text-sm border-b last:border-0 ${
                !notif.leida ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-start gap-2">
                {!notif.leida && <div className="h-2 w-2 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />}
                <div className="flex-1">
                  <p className="font-medium text-xs">{notif.titulo}</p>
                  <p className="text-xs text-muted-foreground">{notif.descripcion}</p>
                  <p className="text-xs text-muted-foreground mt-1">{notif.fecha}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-center justify-center text-xs font-medium py-2">
          Ver todas las notificaciones
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
