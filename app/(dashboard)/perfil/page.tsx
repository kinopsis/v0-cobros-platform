'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth-context'
import { Mail, Phone, MapPin, Shield, Clock, Save } from 'lucide-react'
import { toast } from 'sonner'

export default function PerfilPage() {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    nombre: user?.nombre || '',
    email: user?.email || '',
    telefono: '+57 (1) 5555-0199',
    ciudad: 'Medellín',
    departamento: 'Antioquia',
  })

  const handleSave = () => {
    toast.success('Perfil actualizado correctamente')
    setIsEditing(false)
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase()
  }

  const roleLabels: Record<string, string> = {
    JUZGADO: 'Juzgado',
    GESTOR: 'Gestor de Casos',
    ABOGADO: 'Abogado',
    ADMIN: 'Administrador',
  }

  const roleColors: Record<string, string> = {
    JUZGADO: 'bg-blue-100 text-blue-800',
    GESTOR: 'bg-purple-100 text-purple-800',
    ABOGADO: 'bg-green-100 text-green-800',
    ADMIN: 'bg-red-100 text-red-800',
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full px-0 sm:px-4">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-foreground">Mi Perfil</h1>
        <p className="text-muted-foreground">
          Administra tu información personal y configuración de cuenta
        </p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                  {getInitials(user?.nombre || '')}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold text-foreground">{user?.nombre}</h2>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={roleColors[user?.rol || 'ADMIN']}>
                    {roleLabels[user?.rol || 'ADMIN']}
                  </Badge>
                  <Badge variant="outline">Activo</Badge>
                </div>
              </div>
            </div>
            <Button
              variant={isEditing ? 'destructive' : 'outline'}
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? 'Cancelar' : 'Editar Perfil'}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle>Información Personal</CardTitle>
          <CardDescription>
            Actualiza tus datos de contacto y ubicación
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre Completo</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Teléfono
              </Label>
              <Input
                id="telefono"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ciudad" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Ciudad
              </Label>
              <Input
                id="ciudad"
                value={formData.ciudad}
                onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                disabled={!isEditing}
              />
            </div>
          </div>
        </CardContent>
        {isEditing && (
          <div className="border-t px-6 py-4 flex justify-end">
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              Guardar Cambios
            </Button>
          </div>
        )}
      </Card>

      {/* Access & Permissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Acceso y Permisos
          </CardTitle>
          <CardDescription>
            Información de seguridad y permisos de tu cuenta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
            <div>
              <p className="text-sm font-medium text-foreground">Rol</p>
              <p className="text-sm text-muted-foreground">{roleLabels[user?.rol || 'ADMIN']}</p>
            </div>
            <Badge className={roleColors[user?.rol || 'ADMIN']}>
              {user?.rol}
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
            <div>
              <p className="text-sm font-medium text-foreground">Juzgado Asignado</p>
              <p className="text-sm text-muted-foreground">{user?.juzgado || 'Sistema'}</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
            <div>
              <p className="text-sm font-medium text-foreground">Último Acceso</p>
              <p className="text-sm text-muted-foreground">Hoy a las 14:35</p>
            </div>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Seguridad
          </CardTitle>
          <CardDescription>
            Configura opciones de seguridad de tu cuenta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
            <div>
              <p className="text-sm font-medium text-foreground">Cambiar Contraseña</p>
              <p className="text-sm text-muted-foreground">Última actualización hace 6 meses</p>
            </div>
            <Button variant="outline" size="sm">
              Cambiar
            </Button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
            <div>
              <p className="text-sm font-medium text-foreground">Autenticación de Dos Factores</p>
              <p className="text-sm text-muted-foreground">Desactivada</p>
            </div>
            <Button variant="outline" size="sm">
              Activar
            </Button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
            <div>
              <p className="text-sm font-medium text-foreground">Sesiones Activas</p>
              <p className="text-sm text-muted-foreground">1 dispositivo</p>
            </div>
            <Button variant="outline" size="sm">
              Ver
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Actividad Reciente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">Inicio de sesión</p>
                <p className="text-xs text-muted-foreground">Hoy a las 14:35</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">Cambio de perfil</p>
                <p className="text-xs text-muted-foreground">Ayer a las 11:20</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">Actualización de datos</p>
                <p className="text-xs text-muted-foreground">Hace 3 días</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
