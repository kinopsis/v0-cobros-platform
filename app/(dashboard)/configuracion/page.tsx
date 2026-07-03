'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Settings, Database, Lock, Mail, Users } from 'lucide-react'

export default function ConfiguracionPage() {
  const [nombreEntidad, setNombreEntidad] = useState('Direccion Seccional de Administracion Judicial - Antioquia')
  const [emailContacto, setEmailContacto] = useState('contacto@desaj-antioquia.gov.co')
  const [telefonoContacto, setTelefonoContacto] = useState('+57 4 xxx-xxxx')
  const [direccion, setDireccion] = useState('Carrera 50 #54-20, Medellin, Colombia')

  const handleGuardar = (seccion: string) => {
    toast.success(`${seccion} guardado correctamente`)
  }

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6 lg:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuracion del Sistema</h1>
        <p className="text-muted-foreground mt-2">Administra los parametros y configuraciones generales de la plataforma</p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <div className="-mx-1 px-1 pb-1">
        <TabsList className="grid w-full grid-cols-4 min-w-0">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notificaciones">Notificaciones</TabsTrigger>
          <TabsTrigger value="seguridad">Seguridad</TabsTrigger>
          <TabsTrigger value="integraciones">Integraciones</TabsTrigger>
        </TabsList>
        </div>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informacion General</CardTitle>
              <CardDescription>Configuracion basica del sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="text-sm font-medium">Nombre de la Entidad</label>
                <Input value={nombreEntidad} onChange={(e) => setNombreEntidad(e.target.value)} className="mt-2" placeholder="Nombre de la institucion" />
              </div>
              <div>
                <label className="text-sm font-medium">Email de Contacto</label>
                <Input type="email" value={emailContacto} onChange={(e) => setEmailContacto(e.target.value)} className="mt-2" placeholder="email@ejemplo.com" />
              </div>
              <div>
                <label className="text-sm font-medium">Telefono</label>
                <Input value={telefonoContacto} onChange={(e) => setTelefonoContacto(e.target.value)} className="mt-2" placeholder="+57 ..." />
              </div>
              <div>
                <label className="text-sm font-medium">Direccion</label>
                <Textarea value={direccion} onChange={(e) => setDireccion(e.target.value)} className="mt-2" placeholder="Direccion completa" />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline">Cancelar</Button>
                <Button onClick={() => handleGuardar('Informacion general')}>Guardar Cambios</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Parametros de Cobro Coactivo</CardTitle>
              <CardDescription>Configuracion de plazos y valores</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Plazo Maximo de Gestion (dias)</label>
                  <Input type="number" defaultValue="45" className="mt-2" />
                </div>
                <div>
                  <label className="text-sm font-medium">Monto Minimo para Coactiva</label>
                  <Input type="text" defaultValue="$500.000" className="mt-2" />
                </div>
                <div>
                  <label className="text-sm font-medium">Intereses Moratorios (%)</label>
                  <Input type="number" defaultValue="1.5" step="0.1" className="mt-2" />
                </div>
                <div>
                  <label className="text-sm font-medium">Comision de Gestion (%)</label>
                  <Input type="number" defaultValue="10" className="mt-2" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline">Cancelar</Button>
                <Button onClick={() => handleGuardar('Parametros de cobro')}>Guardar Cambios</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notificaciones" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Configuracion de Notificaciones
              </CardTitle>
              <CardDescription>Controla como se envian las notificaciones en el sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Notificaciones por Email</p>
                    <p className="text-xs text-muted-foreground">Enviar alertas a correo electronico</p>
                  </div>
                  <input type="checkbox" defaultChecked className="h-4 w-4" />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Notificaciones SMS</p>
                    <p className="text-xs text-muted-foreground">Enviar alertas por mensaje de texto</p>
                  </div>
                  <input type="checkbox" className="h-4 w-4" />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Notificaciones del Sistema</p>
                    <p className="text-xs text-muted-foreground">Alertas internas en la plataforma</p>
                  </div>
                  <input type="checkbox" defaultChecked className="h-4 w-4" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Emails para Notificaciones Criticas</label>
                <Textarea defaultValue="contacto@desaj-antioquia.gov.co&#10;director@desaj-antioquia.gov.co" className="mt-2 font-mono text-xs" rows={3} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline">Cancelar</Button>
                <Button onClick={() => handleGuardar('Notificaciones')}>Guardar Cambios</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seguridad" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Configuracion de Seguridad
              </CardTitle>
              <CardDescription>Gestiona la seguridad y permisos del sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="text-sm font-medium">Tiempo de Sesion (minutos)</label>
                <Input type="number" defaultValue="30" className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">Tiempo maximo de inactividad antes de cerrar sesion</p>
              </div>
              <div>
                <label className="text-sm font-medium">Numero Maximo de Intentos de Acceso</label>
                <Input type="number" defaultValue="5" className="mt-2" />
              </div>
              <div>
                <label className="text-sm font-medium">Politica de Contrasenas</label>
                <Select defaultValue="fuerte">
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basica">Basica (6+ caracteres)</SelectItem>
                    <SelectItem value="media">Media (8+ caracteres con numeros)</SelectItem>
                    <SelectItem value="fuerte">Fuerte (12+ caracteres, numeros, simbolos)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-sm">Autenticacion de Dos Factores</p>
                  <p className="text-xs text-muted-foreground">Requerir 2FA para acceso administrativo</p>
                </div>
                <input type="checkbox" defaultChecked className="h-4 w-4" />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline">Cancelar</Button>
                <Button onClick={() => handleGuardar('Configuracion de seguridad')}>Guardar Cambios</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integraciones" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Integraciones Externas</CardTitle>
              <CardDescription>Configura integraciones con otros sistemas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-medium">SIGOBIUS</p>
                    <p className="text-xs text-muted-foreground">Sistema de Informacion de la Rama Judicial</p>
                  </div>
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Conectado</span>
                </div>
                <Button variant="outline" size="sm">Configurar Conexion</Button>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-medium">Sistema de Cartera DIAN</p>
                    <p className="text-xs text-muted-foreground">Integracion con cartera de deudores</p>
                  </div>
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Desconectado</span>
                </div>
                <Button variant="outline" size="sm">Configurar Conexion</Button>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-medium">API de Notificaciones</p>
                    <p className="text-xs text-muted-foreground">Servicio de envio de mensajes</p>
                  </div>
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Conectado</span>
                </div>
                <Button variant="outline" size="sm">Configurar Credenciales</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
